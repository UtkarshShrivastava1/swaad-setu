// controllers/bill.controller.js
// Bill APIs - prefer order-centric creation (create bill from orderId).
// Includes manual bill creation route kept for edge-cases (admin-only).
//
// Exports:
//  - createBillFromOrder (preferred)
//  - createBillManual (kept, restricted)
//  - updateBillDraft
//  - finalizeBill
//  - markBillPaid
//  - getActiveBills
//  - getBillsHistory

const mongoose = require("mongoose");
const Bill = require("../models/bill.model");
const Order = require("../models/order.model");
// {changed} rename import to avoid duplicate identifier later
const computeTotalsFromConfigUtil = require("../utils/computeTotalsFromConfig");
const Table = require("../models/table.model");

const Admin = (() => {
  try {
    return require("../models/admin.model");
  } catch (e) {
    return null;
  }
})();
const { getPricingConfig } = (() => {
  try {
    return require("../common/libs/pricingHelper");
  } catch (e) {
    return {
      getPricingConfig: async (rid) => ({
        taxes: [],
        globalDiscountPercent: 0,
        serviceCharge: 0,
      }),
    };
  }
})();

// Defensive logger
let logger = console;
try {
  logger = require("../common/libs/logger") || console;
} catch (e) {}

// Optional redis helpers
let redisHelpers = null;
let checkIdempotency = null;
let acquireLock = null;
let releaseLock = null;
let publishEvent = null;
(function tryLoadRedisHelpers() {
  const candidates = [
    "../db/redis",
    "../db/redis.helpers",
    "../db/redisHelper",
    "../../db/redis",
  ];
  for (const p of candidates) {
    try {
      const mod = require(p);
      if (!mod) continue;
      redisHelpers = mod;
      checkIdempotency = mod.checkIdempotency || mod.check_idempotency || null;
      acquireLock = mod.acquireLock || mod.setLock || mod.lock || null;
      releaseLock = mod.releaseLock || mod.unlock || null;
      publishEvent = mod.publishEvent || mod.publish || null;
      if (checkIdempotency || acquireLock || publishEvent) break;
    } catch (e) {
      // best-effort loading, continue
      console.warn(
        `[bill.controller] tryLoadRedisHelpers failed to load ${p}:`,
        e && e.message
      );
    }
  }
})();
/* -------------------------------------------------------
   🔄 Sync Linked Order Helper
-------------------------------------------------------- */
/* -------------------------------------------------------
   🔄 Sync Linked Order Helper (Guaranteed Item Overwrite)
   - Replaces all order.items with bill.items
   - Syncs totals and payment fields
   - Handles enum-safe status + better logging
-------------------------------------------------------- */

async function syncLinkedOrder(bill, action = "finalized") {
  if (!bill?.orderId) {
    console.warn("⚠️ [BillSync] No linked orderId found, skipping sync.");
    return;
  }

  console.log("\n" + "=".repeat(80));
  console.log(`🔄 [BillSync] Starting sync for Order: ${bill.orderId}`);
  console.log("=".repeat(80));

  try {
    // 1️⃣ Fetch and snapshot BEFORE state (with tenant validation)
    const order = await Order.findOne({
      _id: bill.orderId,
      restaurantId: bill.restaurantId,
    });
    if (!order) {
      console.warn(`⚠️ [BillSync] No order found for ID: ${bill.orderId}`);
      return;
    }

    const beforeState = {
      itemCount: order.items.length,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      items: order.items.map((i) => ({
        name: i.name,
        qty: i.quantity,
        price: i.price,
      })),
    };

    console.log("\n📸 BEFORE SYNC:");
    console.table(beforeState.items);
    console.log("Totals:", {
      subtotal: beforeState.subtotal,
      tax: beforeState.taxAmount,
      total: beforeState.totalAmount,
    });

    // 2️⃣ Build fresh items from bill
    console.log("\n🔨 Building new items array from bill...");
    const syncedItems = (bill.items || []).map((item, idx) => {
      let menuItemObjectId;
      try {
        menuItemObjectId = mongoose.Types.ObjectId.isValid(item.itemId)
          ? new mongoose.Types.ObjectId(item.itemId)
          : item.itemId;
      } catch (e) {
        console.error(`❌ Invalid itemId: ${item.itemId}`, e);
        menuItemObjectId = item.itemId;
      }

      const orderItem = {
        menuItemId: menuItemObjectId,
        name: item.name,
        quantity: item.qty,
        price: item.price,
        priceAtOrder: item.priceAtOrder || item.price,
        OrderNumberForDay: idx + 1,
        notes: item.notes || "",
        status: "served",
        createdAt: item.createdAt || new Date(),
        updatedAt: new Date(),
        _id: new mongoose.Types.ObjectId(),
      };

      console.log(
        `  ✓ Item ${idx + 1}: ${item.name} x${item.qty} @ ₹${item.price}`
      );
      return orderItem;
    });

    console.log(`\n📦 Total items built: ${syncedItems.length}`);

    // 3️⃣ Replace order items
    order.items = syncedItems;
    order.markModified("items");

    // 4️⃣ Sync monetary fields
    order.subtotal = bill.subtotal ?? 0;
    order.discountAmount = bill.discountAmount ?? 0;
    order.serviceChargeAmount = bill.serviceChargeAmount ?? 0;
    order.taxAmount = bill.taxAmount ?? 0;
    order.totalAmount = bill.totalAmount ?? 0;

    console.log("\n💰 Monetary fields synced.");

    // 5️⃣ Taxes
    if (Array.isArray(bill.taxes)) {
      console.log("\n📊 Syncing tax breakdown:");
      order.appliedTaxes = bill.taxes.map((tax) => ({
        name: tax.name,
        percent: tax.rate,
        code: tax.name.toUpperCase().replace(/\s+/g, "_"),
        amount: tax.amount,
        _id: new mongoose.Types.ObjectId(),
      }));
      order.markModified("appliedTaxes");
    }

    // 6️⃣ Discount
    if (bill.discountPercent !== undefined) {
      order.appliedDiscountPercent = bill.discountPercent;
      console.log(`\n🎟️ Discount: ${bill.discountPercent}%`);
    }

    order.updatedAt = new Date();

    // 7️⃣ Status logic FIXED 🧠
    console.log("\n🚦 Updating status:");
    if (action === "finalized") {
      // ✅ Keep order open — do NOT mark done yet
      order.status = "served"; // or keep the last known state
      order.paymentStatus = "unpaid";
      order.isOrderComplete = false;
      console.log("  Status: served (kept open), Payment: unpaid");
    } else if (action === "paid") {
      order.paymentStatus = "paid";
      order.isOrderComplete = true;
      order.status = "done"; // ✅ only here
      console.log("  Payment: paid, Complete: true, Status: done");
    }

    // 8️⃣ Save
    console.log("\n💾 Saving order to database...");
    const savedOrder = await order.save({ validateBeforeSave: true });
    console.log("✅ Save completed!");

    // 9️⃣ Verify (with tenant validation)
    const verifyOrder = await Order.findOne({
      _id: bill.orderId,
      restaurantId: bill.restaurantId,
    }).lean();
    console.log("\n📸 AFTER SYNC (from database):");
    console.table(
      verifyOrder.items.map((i) => ({
        name: i.name,
        qty: i.quantity,
        price: i.price,
      }))
    );
    console.log("Totals:", {
      subtotal: verifyOrder.subtotal,
      tax: verifyOrder.taxAmount,
      total: verifyOrder.totalAmount,
      status: verifyOrder.status,
      paymentStatus: verifyOrder.paymentStatus,
    });

    console.log("=".repeat(80) + "\n");
    return verifyOrder;
  } catch (err) {
    console.error("\n❌ [BillSync] SYNC FAILED:", err.message);
    console.error("Stack:", err.stack);
    console.log("=".repeat(80) + "\n");
    throw err;
  }
}

//-----------------------------------------------------------------------------
// --- REPLACE utility functions for redis helpers ---
async function safeCheckIdempotency(key) {
  if (!checkIdempotency) return null;
  try {
    return await checkIdempotency(key);
  } catch (e) {
    logger && logger.error && logger.error("checkIdempotency error:", e);
    return null;
  }
}
async function safeAcquireLock(key, ttl = 5000) {
  if (!acquireLock) return false;
  try {
    return await acquireLock(key, ttl);
  } catch (e) {
    logger && logger.error && logger.error("acquireLock error:", e);
    return false;
  }
}
async function safeReleaseLock(key) {
  if (!releaseLock) return false;
  try {
    return await releaseLock(key);
  } catch (e) {
    logger && logger.error && logger.error("releaseLock error:", e);
    return false;
  }
}
function safePublish(channel, message) {
  if (!publishEvent) return;
  try {
    const out = publishEvent(channel, message);
    if (out && typeof out.then === "function")
      out.catch(
        (e) => logger && logger.error && logger.error("publishEvent err:", e)
      );
  } catch (e) {
    logger && logger.error && logger.error("publishEvent error:", e);
  }
}

// money rounding
function moneyRound(x) {
  return Number((Math.round(Number(x || 0) * 100) / 100).toFixed(2));
}

//
// {changed} Replace the large/local computeTotalsFromConfig implementation with a safe wrapper
// that calls the external util when available. This avoids duplicate declarations and ensures
// updateBillDraft / finalizeBill use a single canonical implementation.
//
async function computeTotalsFromConfig(
  rid,
  items = [],
  extras = [],
  pricingConfigVersion = null,
  options = {}
) {
  try {
    if (typeof computeTotalsFromConfigUtil === "function") {
      // pass-through to the shared util (preserves existing behavior)
      return await computeTotalsFromConfigUtil(
        rid,
        items,
        extras,
        pricingConfigVersion,
        options
      );
    }
  } catch (err) {
    console.error(
      "[bill.controller] computeTotalsFromConfigUtil threw an error, falling back:",
      err && (err.stack || err.message || err)
    );
  }

  // Fallback minimal implementation (safe defaults) if util unavailable or failed.
  try {
    const normalizedItems = (items || []).map((it) => ({
      quantity: Number(it.quantity ?? it.qty ?? it.qtyOrdered ?? 1),
      priceAtOrder: Number(it.priceAtOrder ?? it.price ?? 0),
    }));

    const lineTotal = normalizedItems.reduce(
      (acc, it) => acc + it.priceAtOrder * it.quantity,
      0
    );
    const extrasTotal = (extras || []).reduce(
      (acc, x) => acc + Number(x.amount ?? x.price ?? 0),
      0
    );

    const subtotal = moneyRound(lineTotal);
    const subtotalWithExtras = moneyRound(subtotal + extrasTotal);

    const discountPercent = Number(options.discountPercent ?? 0) || 0;
    const discountAmount = moneyRound(
      (subtotalWithExtras * discountPercent) / 100
    );
    const amountAfterDiscount = moneyRound(subtotalWithExtras - discountAmount);

    // No taxes/service charge in fallback
    const taxBreakdown = [];
    const taxAmount = 0;
    const serviceChargePercent = Number(options.serviceChargePercent ?? 0) || 0;
    const serviceChargeAmount = moneyRound(
      (amountAfterDiscount * serviceChargePercent) / 100
    );

    const total = moneyRound(
      amountAfterDiscount + taxAmount + serviceChargeAmount
    );

    return {
      subtotal,
      extrasTotal: moneyRound(extrasTotal),
      subtotalWithExtras,
      taxBreakdown,
      taxAmount,
      discountPercent,
      discountAmount,
      serviceChargePercent,
      serviceChargeAmount,
      total,
    };
  } catch (fallbackErr) {
    console.error(
      "[bill.controller] computeTotalsFromConfig fallback failed:",
      fallbackErr
    );
    // ensure route handlers receive something predictable
    return {
      subtotal: 0,
      extrasTotal: 0,
      subtotalWithExtras: 0,
      taxBreakdown: [],
      taxAmount: 0,
      discountPercent: 0,
      discountAmount: 0,
      serviceChargePercent: 0,
      serviceChargeAmount: 0,
      total: 0,
    };
  }
}

/**
 * Compute totals from items + extras using restaurant pricing config (server authoritative).
 * Uses getPricingConfig(rid) which should return:
 *   { taxes: [{name, percent, code, inclusive?}], globalDiscountPercent, serviceCharge or serviceChargePercent }
 *
 * - subtotal: sum of line items only (unitPrice * qty)
 * - extrasTotal: sum of extras amounts
 * - subtotalWithExtras: subtotal + extrasTotal (used for discount/tax base)
 * - discountAmount: applied on subtotalWithExtras
 * - taxBreakdown: array of { name, rate, code, amount } computed on amount after discount
 * - serviceChargeAmount: computed on amount after discount
 * - total: final payable amount (amountAfterDiscount + tax + serviceCharge)
 */

//-----------------------------------------------------------------------------
/**
 * Create bill from Order (preferred flow)
 * POST /api/:rid/orders/:orderId/bill
 *
 * - Normalizes order.items -> bill.items
 * - price (legacy required) is set to priceAtOrder
 * - Computes totals server-side via computeTotalsFromConfig
 * - Adds audit entry and publishes event
 * - ✅ Also carries customer name/contact/email + discount/service charge info
 */
async function createBillFromOrder(req, res, next) {
  console.info("[createBillFromOrder] enter", {
    params: req.params,
    bodyKeys: Object.keys(req.body || {}),
  });

  let lockKey = null;
  try {
    const { rid, orderId } = req.params;

    // Remove any client-provided restaurantId
    const body = { ...req.body };
    delete body.restaurantId;
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;
    delete req.query.restaurantId;

    // ✅ Include discount/service charge from body
    const {
      staffAlias,
      extras = [],
      discountPercent = 0,
      discountAmount = 0,
      serviceChargePercent = 0,
      serviceChargeAmount = 0,
    } = body || {};

    if (!rid || !orderId) {
      console.warn("[createBillFromOrder] missing params", { rid, orderId });
      return res.status(400).json({ error: "Missing params: rid, orderId" });
    }

    const order = await Order.findOne({
      _id: orderId,
      restaurantId: rid,
    }).lean();

    if (!order) {
      console.warn("[createBillFromOrder] order not found", { rid, orderId });
      return res.status(404).json({ error: "Order not found" });
    }

    console.debug &&
      console.debug("[createBillFromOrder] loaded order", {
        orderId,
        itemsCount: (order.items || []).length,
      });

    /* ==============================
       Table Number Resolution
    ============================== */
    let tableNumber = null;
    try {
      if (order?.tableNumber) {
        tableNumber = order.tableNumber;
      } else if (order?.tableId) {
        const { Types } = require("mongoose");
        const query = {
          _id: Types.ObjectId.isValid(order.tableId)
            ? new Types.ObjectId(order.tableId)
            : order.tableId,
          restaurantId: rid,
        };
        const tableDoc = await Table.findOne(query).lean();
        tableNumber = tableDoc?.tableNumber ?? null;
      }
    } catch (e) {
      console.error("[createBillFromOrder] Table lookup failed:", e.message);
    }

    /* ==============================
       Idempotency & Lock
    ============================== */
    const hdr =
      req.headers["x-idempotency-key"] || req.headers["x-idempotency"];
    const idempotencyKey = hdr
      ? `idempotency:bill:${rid}:${orderId}:${hdr}`
      : null;

    if (idempotencyKey) {
      const prev = await safeCheckIdempotency(idempotencyKey);
      if (prev) {
        return res.status(409).json({ error: "Duplicate request", bill: prev });
      }
    }

    lockKey = `bill:lock:${rid}:${orderId}`;
    const acquired = await safeAcquireLock(lockKey, 5000);

    if (acquired) {
      const active = await Bill.findOne({
        restaurantId: rid,
        orderId,
        status: { $in: ["draft", "finalized"] },
      }).lean();
      if (active) {
        await safeReleaseLock(lockKey).catch(() => {});
        return res
          .status(409)
          .json({ error: "Active bill exists", bill: active });
      }
    }

    /* ==============================
       Compute Totals
    ============================== */
    /* ==============================
   Compute Totals
============================== */
    const appliedDiscountPercent = Number(order.appliedDiscountPercent || 0);
    const appliedServiceChargePercent = Number(
      order.appliedServiceChargePercent || 0
    );

    const totals = await computeTotalsFromConfig(
      rid,
      order.items || [],
      extras || [],
      order.pricingConfigVersion,
      {
        discountPercent: appliedDiscountPercent,
        serviceChargePercent: appliedServiceChargePercent,
        additionalDiscountAmount: 0, // no extra discounts when creating from order
      }
    );

    if (!totals) {
      if (lockKey) await safeReleaseLock(lockKey).catch(() => {});
      return res.status(500).json({ error: "Failed to compute totals" });
    }

    console.info("[createBillFromOrder] totals computed", { totals });

    /* ==============================
   Normalize Items FIRST
============================== */
    const billItems = (order.items || []).map((it, idx) => {
      const itemId =
        it.itemId || it.menuItemId || (it._id ? String(it._id) : null);
      if (!itemId) throw new Error(`Missing item id for order.items[${idx}]`);

      const qty = Number(it.quantity ?? it.qty ?? 1);
      const priceAtOrder = Number(it.priceAtOrder ?? it.price ?? 0);

      return {
        itemId: String(itemId),
        name: it.name || "",
        qty: Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1,
        price: priceAtOrder,
        priceAtOrder,
        modifiers: Array.isArray(it.modifiers) ? it.modifiers : [],
        notes: it.notes || it.comment || "",
      };
    });

    /* ==============================
   Construct Bill AFTER
============================== */
    const bill = new Bill({
      restaurantId: rid,
      tableId: order.tableId,
      tableNumber,
      sessionId: order.sessionId,
      orderId: order._id,
      orderNumberForDay:
        order.orderNumberForDay || order.OrderNumberForDay || null,

      customerName: order.customerName || null,
      customerContact:
        order.customerContact ||
        order.customerPhone ||
        order.contactNumber ||
        null,
      customerEmail: order.customerEmail || null,
      isCustomerOrder: !!order.isCustomerOrder,

      // ✅ Now billItems is defined
      items: billItems,
      extras: extras || [],

      subtotal: Number(Number(totals.subtotal).toFixed(2)),
      extrasTotal: Number(Number(totals.extrasTotal || 0).toFixed(2)),
      subtotalWithExtras: Number(Number(totals.subtotalWithExtras).toFixed(2)),
      taxes: totals.taxBreakdown || [],
      taxAmount: Number(Number(totals.taxAmount || 0).toFixed(2)),

      // ✅ Discount & Service Charge
      appliedDiscountPercent,
      appliedServiceChargePercent,
      discountPercent: Number(
        appliedDiscountPercent || totals.discountPercent || 0
      ),
      discountAmount: Number(Number(totals.discountAmount || 0).toFixed(2)),
      serviceChargePercent: Number(
        appliedServiceChargePercent || totals.serviceChargePercent || 0
      ),
      serviceChargeAmount: Number(
        Number(totals.serviceChargeAmount || 0).toFixed(2)
      ),

      totalAmount: Number(
        (
          totals.total ||
          totals.subtotal -
            totals.discountAmount +
            totals.serviceChargeAmount +
            totals.taxAmount
        ).toFixed(2)
      ),

      status: "draft",
      staffAlias: staffAlias || null,
      audit: [
        {
          by: staffAlias || "system",
          action: "created_from_order",
          at: new Date(),
        },
      ],
    });

    /* ==============================
       Capture Pricing Metadata
    ============================== */
    try {
      const adminDoc = await Admin.findOne({ restaurantId: rid });
      if (adminDoc?.getActivePricingConfig) {
        const cfg = adminDoc.getActivePricingConfig();
        if (cfg) {
          bill.pricingConfigVersion = cfg.version ?? bill.pricingConfigVersion;
          bill.pricingConfigId = String(cfg._id);
        }
      } else {
        const cfg = await getPricingConfig(rid);
        if (cfg?.version) bill.pricingConfigVersion = cfg.version;
        if (cfg?._id) bill.pricingConfigId = String(cfg._id);
      }
    } catch (e) {
      console.warn("[createBillFromOrder] pricing metadata capture failed:", e);
    }

    /* ==============================
       Persist Bill
    ============================== */
    await bill.save();
    console.info("[createBillFromOrder] bill saved", {
      billId: bill._id,
      rid,
      orderId,
    });

    safePublish(`restaurant:${rid}:tables:${bill.tableId}`, {
      event: "billCreated",
      data: bill,
    });

    if (lockKey) await safeReleaseLock(lockKey).catch(() => {});

    return res.status(201).json(bill);
  } catch (err) {
    if (lockKey) await safeReleaseLock(lockKey).catch(() => {});
    console.error("[createBillFromOrder] error:", err);
    return next(err);
  }
}

// Manual bill creation (kept for edge cases)
// POST /api/:rid/bills  (admin-only in routing)
async function createBillManual(req, res, next) {
  console.info("[createBillManual] enter", {
    params: req.params,
    bodyKeys: Object.keys(req.body || {}),
  });
  let lockKey = null;
  try {
    const { rid } = req.params;

    // Remove any client-provided restaurantId
    const body = { ...req.body };
    delete body.restaurantId;
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;
    delete req.query.restaurantId;

    const { tableId, sessionId, items, extras = [], staffAlias } = body || {};

    if (
      !rid ||
      !tableId ||
      !sessionId ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      logger &&
        logger.warn &&
        logger.warn("[createBillManual] missing required fields", {
          rid,
          tableId,
          sessionId,
          itemsLength: Array.isArray(items) ? items.length : undefined,
        });
      return res
        .status(400)
        .json({ error: "Missing required fields: tableId, sessionId, items" });
    }

    // idempotency support (best-effort)
    const hdr =
      req.headers["x-idempotency-key"] || req.headers["x-idempotency"];
    const idempotencyKey = hdr
      ? `idempotency:bill:manual:${rid}:${sessionId}:${hdr}`
      : null;
    if (idempotencyKey) {
      logger &&
        logger.info &&
        logger.info("[createBillManual] checking idempotency", {
          idempotencyKey,
        });
      const prev = await safeCheckIdempotency(idempotencyKey);
      if (prev) {
        console.warn("[createBillManual] idempotent duplicate detected", {
          idempotencyKey,
          billId: prev._id,
        });
        return res.status(409).json({ error: "Duplicate request", bill: prev });
      }
    }

    // Acquire lock per session
    lockKey = `bill:lock:${rid}:${sessionId}`;
    const acquired = await safeAcquireLock(lockKey, 5000);
    if (!acquired) {
      logger &&
        logger.info &&
        logger.info(
          "[createBillManual] could not acquire lock, checking active bills",
          { lockKey }
        );
      const active = await Bill.findOne({
        restaurantId: rid,
        sessionId,
        status: { $in: ["draft", "finalized"] },
      }).lean();
      if (active) {
        console.warn("[createBillManual] active bill exists (no lock)", {
          billId: active._id,
        });
        return res
          .status(409)
          .json({ error: "Active bill exists", bill: active });
      }
    } else {
      logger &&
        logger.info &&
        logger.info("[createBillManual] lock acquired", { lockKey });
      // double-check after acquiring lock
      const active = await Bill.findOne({
        restaurantId: rid,
        sessionId,
        status: { $in: ["draft", "finalized"] },
      }).lean();
      if (active) {
        await safeReleaseLock(lockKey).catch(() => {});
        console.warn("[createBillManual] active bill exists (after lock)", {
          billId: active._id,
        });
        return res
          .status(409)
          .json({ error: "Active bill exists", bill: active });
      }
    }

    // --- normalization of incoming items (ensures bill schema validation passes) ---
    const normalizedItems = (items || []).map((it, idx) => {
      const itemId =
        it.itemId || it.menuItemId || (it._id ? String(it._id) : null);
      const quantity = Number(it.quantity ?? it.qty ?? 1);
      const priceAtOrder = Number(it.priceAtOrder ?? it.price ?? 0);
      if (!itemId) {
        const e = new Error(`Missing item id for items[${idx}]`);
        e.status = 400;
        throw e;
      }
      return {
        itemId,
        menuItemId: it.menuItemId ? String(it.menuItemId) : undefined,
        name: it.name || "",
        quantity,
        // legacy required field set to authoritative snapshot
        price: Number(priceAtOrder),
        priceAtOrder: Number(priceAtOrder),
        notes: it.notes || "",
        modifiers: it.modifiers || [],
        status: it.status || "placed",
      };
    });
    // --- end normalization ---

    logger &&
      logger.debug &&
      logger.debug("[createBillManual] normalized items", {
        normalizedCount: normalizedItems.length,
      });

    // Compute totals server-side using normalized items + extras
    logger &&
      logger.debug &&
      logger.debug("[createBillManual] computing totals", {
        rid,
        sessionId,
        normalizedCount: normalizedItems.length,
        extrasCount: (extras || []).length,
      });
    const totals = await computeTotalsFromConfig(rid, normalizedItems, extras);
    if (!totals) {
      logger &&
        logger.error &&
        logger.error("[createBillManual] computeTotalsFromConfig failed", {
          rid,
          sessionId,
        });
      if (lockKey) await safeReleaseLock(lockKey).catch(() => {});
      return res.status(500).json({ error: "Failed to compute totals" });
    }
    logger &&
      logger.info &&
      logger.info("[createBillManual] totals computed", { totals });

    // Build bill object (snapshot totals + metadata)
    const bill = new Bill({
      restaurantId: rid,
      tableId,
      tableNumber, // ✅ this must exist here
      sessionId,
      items: normalizedItems,
      extras: extras || [],
      subtotal: Number(Number(totals.subtotal || 0).toFixed(2)),
      extrasTotal: Number(Number(totals.extrasTotal || 0).toFixed(2)),
      subtotalWithExtras: Number(
        Number(totals.subtotalWithExtras || totals.subtotal || 0).toFixed(2)
      ),
      taxes: totals.taxBreakdown || [],
      taxAmount: Number(Number(totals.taxAmount || 0).toFixed(2)),
      discountPercent: Number(totals.discountPercent || 0),
      discountAmount: Number(Number(totals.discountAmount || 0).toFixed(2)),
      serviceChargePercent: Number(totals.serviceChargePercent || 0),
      serviceCharge: Number(Number(totals.serviceChargeAmount || 0).toFixed(2)),
      totalAmount: Number(Number(totals.total || 0).toFixed(2)),
      status: "draft",
      paymentStatus: "unpaid",
      staffAlias: staffAlias || null,
      audit: [
        {
          by: staffAlias || "system",
          action: "created_manual",
          at: new Date(),
        },
      ],
    });

    // Optionally capture pricing config metadata (best-effort)
    try {
      logger &&
        logger.debug &&
        logger.debug(
          "[createBillManual] attempting to capture pricing metadata",
          { rid }
        );
      const adminDoc = await Admin.findOne({ restaurantId: rid });
      if (adminDoc && typeof adminDoc.getActivePricingConfig === "function") {
        const activeCfg = adminDoc.getActivePricingConfig();
        if (activeCfg) {
          if (activeCfg.version)
            bill.pricingConfigVersion = Number(activeCfg.version);
          if (activeCfg._id) bill.pricingConfigId = String(activeCfg._id);
          logger &&
            logger.info &&
            logger.info(
              "[createBillManual] captured pricing metadata from Admin model",
              {
                pricingConfigId: bill.pricingConfigId,
                pricingConfigVersion: bill.pricingConfigVersion,
              }
            );
        }
      } else {
        const cfg = await getPricingConfig(rid);
        if (cfg && cfg.version) bill.pricingConfigVersion = Number(cfg.version);
        if (cfg && cfg._id) bill.pricingConfigId = String(cfg._id);
        logger &&
          logger.info &&
          logger.info(
            "[createBillManual] captured pricing metadata from helper",
            {
              pricingConfigId: bill.pricingConfigId,
              pricingConfigVersion: bill.pricingConfigVersion,
            }
          );
      }
    } catch (metaErr) {
      console.warn(
        "[createBillManual] pricing metadata capture failed",
        metaErr && metaErr.message
      );
    }

    // Persist
    await bill.save();
    console.log("[createBillManual] bill saved", {
      billId: bill._id,
      rid,
      sessionId,
    });

    // publish event (non-blocking)
    safePublish(`restaurant:${rid}:tables:${tableId}`, {
      event: "billCreated",
      data: bill,
    });
    logger &&
      logger.debug &&
      logger.debug("[createBillManual] publish attempted", {
        channel: `restaurant:${rid}:tables:${tableId}`,
      });

    // release lock
    if (lockKey)
      await safeReleaseLock(lockKey).catch(() => {
        logger &&
          logger.warn &&
          logger.warn("[createBillManual] failed to release lock (ignored)", {
            lockKey,
          });
      });

    return res.status(201).json(bill);
  } catch (err) {
    logger &&
      logger.error &&
      logger.error("[createBillManual] error:", err && (err.stack || err));
    try {
      if (lockKey) await safeReleaseLock(lockKey).catch(() => {});
    } catch (e) {
      /* ignore */
    }
    return next(err);
  }
}

// Update draft
/**
 * ✅ PATCH /api/:rid/bills/:id
 * Update a draft bill — with safe recalculation for discount, service charge, and taxes.
 */
/**
 * PATCH /api/:rid/bills/:id
 * Save draft changes to bill (items, extras, discounts)
 */
async function updateBillDraft(req, res) {
  console.info("[updateBillDraft] ▶ enter", {
    params: req.params,
    bodyKeys: Object.keys(req.body || {}),
  });

  try {
    const { rid, id: paramId } = req.params;

    // ---- Multi-tenant safety ----
    if (!rid || !paramId) {
      console.warn("[updateBillDraft] missing rid or billId");
      return res.status(400).json({ error: "Missing rid or billId" });
    }

    // Clean request body
    const body = { ...req.body };
    delete body.restaurantId;
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;

    const {
      billId: bodyBillId,
      items,
      extras,
      staffAlias,
      appliedDiscountPercent,
      appliedServiceChargePercent,
      additionalDiscounts,
    } = body;

    const billId = paramId || bodyBillId;
    if (!billId) return res.status(400).json({ error: "billId missing" });

    const Bill = require("../models/bill.model");
    const bill = await Bill.findOne({ _id: billId, restaurantId: rid });

    if (!bill) return res.status(404).json({ error: "Bill not found" });
    if (bill.status !== "draft")
      return res.status(403).json({ error: "Bill not editable unless draft" });

    // -------------------------------
    // Apply updated Items
    // -------------------------------
    if (Array.isArray(items)) {
      bill.items = items.map((i) => ({
        itemId: String(
          i.itemId || i.menuItemId || i._id || i.name || "unknown"
        ),
        name: i.name || "Unnamed Item",
        qty: Number(i.qty || i.quantity || 1),
        price: Number(i.priceAtOrder || i.price || 0),
        priceAtOrder: Number(i.priceAtOrder || i.price || 0),
        modifiers: Array.isArray(i.modifiers) ? i.modifiers : [],
        notes: i.notes || "",
      }));
    }

    // -------------------------------
    // Apply Extras (always positive)
    // -------------------------------
    if (Array.isArray(extras)) {
      bill.extras = extras.map((e) => ({
        label: e.label || "Extra",
        amount: Number(e.amount) || 0,
      }));
    }

    // -------------------------------
    // Additional Fixed Amount Discounts
    // These MUST be stored as positive values
    // -------------------------------
    if (Array.isArray(additionalDiscounts)) {
      bill.additionalDiscounts = additionalDiscounts
        .map((d) => ({
          label: d.label || "More Discount",
          amount: Math.abs(Number(d.amount) || 0), // positive only
        }))
        .filter((d) => d.amount > 0);
    }

    // -------------------------------
    // Staff alias
    // -------------------------------
    if (typeof staffAlias === "string" && staffAlias.trim())
      bill.staffAlias = staffAlias.trim();

    // -------------------------------
    // Compute totals (canonical)
    // -------------------------------
    let totals;
    try {
      const discountPercent =
        Number(appliedDiscountPercent) ||
        bill.appliedDiscountPercent ||
        bill.discountPercent ||
        0;

      const serviceChargePercent =
        Number(appliedServiceChargePercent) ||
        bill.appliedServiceChargePercent ||
        bill.serviceChargePercent ||
        0;

      const additionalDiscountAmount = Array.isArray(bill.additionalDiscounts)
        ? bill.additionalDiscounts.reduce(
            (sum, d) => sum + (Number(d.amount) || 0),
            0
          )
        : 0;

      totals = await computeTotalsFromConfig(
        rid,
        bill.items,
        bill.extras,
        bill.pricingConfigVersion || null,
        {
          discountPercent,
          serviceChargePercent,
          additionalDiscountAmount,
        }
      );
    } catch (err) {
      console.error("[updateBillDraft] ❌ total computation failed:", err);
      return res.status(500).json({ error: "Failed computing totals" });
    }

    // -------------------------------
    // Assign Canonical Totals
    // -------------------------------
    bill.subtotal = Number(totals.subtotal || 0);
    bill.taxAmount = Number(totals.taxAmount || 0);
    bill.taxes = totals.taxBreakdown || [];

    bill.extrasTotal = Number(totals.extrasTotal || 0);

    bill.discountPercent = Number(totals.discountPercent || 0);
    bill.appliedDiscountPercent = bill.discountPercent;
    bill.discountAmount = Number(totals.discountAmount || 0);

    bill.additionalDiscountTotal = Number(totals.additionalDiscountAmount || 0);

    bill.serviceChargePercent = Number(totals.serviceChargePercent || 0);
    bill.appliedServiceChargePercent = bill.serviceChargePercent;
    bill.serviceChargeAmount = Number(totals.serviceChargeAmount || 0);

    bill.totalAmount = Number(totals.total || 0);

    // -------------------------------
    // Audit logging
    // -------------------------------
    bill.audit = bill.audit || [];
    bill.audit.push({
      by: staffAlias || bill.staffAlias || "system",
      action: "updated",
      at: new Date(),
    });

    // -------------------------------
    // Save
    // -------------------------------
    await bill.save();

    console.info("[updateBillDraft] ✅ saved", {
      billId: bill._id,
      subtotal: bill.subtotal,
      totalAmount: bill.totalAmount,
    });

    // Real-time updates
    safePublish(`restaurant:${rid}:tables:${bill.tableId}`, {
      event: "billUpdated",
      data: bill,
    });

    // -------------------------------
    // SAFE, CLEAN RESPONSE
    // -------------------------------
    const clean = bill.toObject();

    delete clean.__v;
    delete clean.overrideToken;

    clean.taxes = Array.isArray(clean.taxes) ? clean.taxes : [];
    clean.extras = Array.isArray(clean.extras) ? clean.extras : [];
    clean.items = Array.isArray(clean.items) ? clean.items : [];

    clean.id = clean._id;

    return res.json(clean);
  } catch (err) {
    console.error("[updateBillDraft] 💥 error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// Finalize bill
// ==========================
// ✅ FINAL FIXED finalizeBill
// ==========================
async function finalizeBill(req, res, next) {
  console.info("[finalizeBill] enter", {
    params: req.params,
    bodyKeys: Object.keys(req.body || {}),
  });

  try {
    const { rid, id } = req.params;

    // Remove any client-provided restaurantId
    const body = { ...req.body };
    delete body.restaurantId;
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;
    delete req.query.restaurantId;

    const { staffAlias } = body || {};

    if (!rid || !id) {
      logger?.warn?.("[finalizeBill] missing params", { rid, id });
      return res.status(400).json({ error: "Missing params" });
    }

    if (!staffAlias) {
      logger?.warn?.("[finalizeBill] staffAlias missing", { rid, id });
      return res.status(400).json({ error: "staffAlias required to finalize" });
    }

    const bill = await Bill.findOne({ _id: id, restaurantId: rid });

    if (!bill) {
      logger?.warn?.("[finalizeBill] bill not found", { id, rid });
      return res.status(404).json({ error: "Bill not found" });
    }

    if (bill.status !== "draft") {
      logger?.warn?.("[finalizeBill] cannot finalize non-draft", {
        id,
        status: bill.status,
      });
      return res
        .status(400)
        .json({ error: "Only draft bills can be finalized" });
    }

    // ===========================
    // 🧾 Update linked order safely
    // ===========================
    if (bill.orderId) {
      console.log("[finalizeBill] updating associated order:", {
        orderId: bill.orderId,
        rid,
      });

      try {
        const order = await Order.findOne({
          _id: bill.orderId,
          restaurantId: rid,
        });

        if (order) {
          console.log("[finalizeBill] found order to update:", {
            orderId: order._id,
            currentStatus: order.isOrderComplete,
            paymentStatus: order.paymentStatus,
          });

          // ✅ DO NOT mark complete yet!
          order.billId = bill._id;
          order.paymentStatus = "unpaid"; // ensure consistency
          order.isOrderComplete = false; // <-- keep order open
          order.updatedAt = new Date();

          await order.save();

          console.log("[finalizeBill] order linked to bill, left open:", {
            orderId: order._id,
            isOrderComplete: order.isOrderComplete,
            paymentStatus: order.paymentStatus,
          });
        } else {
          console.warn("[finalizeBill] associated order not found:", {
            orderId: bill.orderId,
            rid,
          });
        }
      } catch (orderErr) {
        console.error("[finalizeBill] failed to update order:", {
          orderId: bill.orderId,
          error: orderErr?.message || orderErr,
        });
        // continue finalizing bill even if order update fails
      }
    }

    // ===========================
    // 💰 Compute totals safely
    // ===========================
    logger?.debug?.("[finalizeBill] recomputing totals before finalize", {
      rid,
      id,
      itemsCount: (bill.items || []).length,
    });

    const additionalDiscountTotalFinal = Array.isArray(bill.additionalDiscounts)
      ? bill.additionalDiscounts.reduce(
          (s, d) => s + (Number(d.amount) || 0),
          0
        )
      : 0;
    const totals = await computeTotalsFromConfig(
      rid,
      bill.items,
      bill.extras,
      bill.pricingConfigVersion || null,
      {
        discountPercent:
          bill.appliedDiscountPercent || bill.discountPercent || 0,
        serviceChargePercent:
          bill.appliedServiceChargePercent || bill.serviceChargePercent || 0,
        additionalDiscountAmount: additionalDiscountTotalFinal,
      }
    );
    bill.subtotal = totals.subtotal;
    bill.extrasTotal = totals.extrasTotal;
    bill.taxes = totals.taxBreakdown;
    bill.taxAmount = totals.taxAmount;
    bill.discountPercent = totals.discountPercent;
    bill.discountAmount = totals.discountAmount;
    bill.additionalDiscountTotal = totals.additionalDiscountAmount;
    bill.serviceChargeAmount = totals.serviceChargeAmount;
    bill.totalAmount = totals.total;

    // ===========================
    // ✅ Mark finalized (not done)
    // ===========================
    bill.status = "finalized";
    bill.paymentStatus = "unpaid"; // ensure consistent payment state
    bill.finalizedByAlias = staffAlias;
    bill.finalizedAt = new Date();

    bill.audit = bill.audit || [];
    bill.audit.push({
      by: staffAlias,
      action: "finalized",
      details: { orderId: bill.orderId || null },
      at: new Date(),
    });

    await bill.save();

    console.log("[finalizeBill] ✅ bill finalized successfully:", {
      billId: bill._id,
      orderId: bill.orderId,
      total: bill.totalAmount,
      paymentStatus: bill.paymentStatus,
      status: bill.status,
    });

    // ===========================
    // 📡 Notify subscribers
    // ===========================
    await syncLinkedOrder(bill, "finalized");
    safePublish(`restaurant:${rid}:tables:${bill.tableId}`, {
      event: "billFinalized",
      data: bill,
    });

    logger?.debug?.("[finalizeBill] publish attempted", {
      channel: `restaurant:${rid}:tables:${bill.tableId}`,
    });

    // ✅ Done
    return res.json(bill);
  } catch (err) {
    logger?.error?.(
      "[finalizeBill] error:",
      err && err.stack ? err.stack : err
    );
    return next(err);
  }
}

// Mark bill paid
async function markBillPaid(req, res, next) {
  console.info("[markBillPaid] enter", {
    params: req.params,
    bodyKeys: Object.keys(req.body || {}),
  });
  try {
    const { rid, id } = req.params;

    // Remove any client-provided restaurantId
    const body = { ...req.body };
    delete body.restaurantId;
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;
    delete req.query.restaurantId;

    const { staffAlias, paymentNote, overrideToken } = body || {};
    if (!rid || !id) {
      logger &&
        logger.warn &&
        logger.warn("[markBillPaid] missing params", { rid, id });
      return res.status(400).json({ error: "Missing params" });
    }
    if (!staffAlias) {
      logger &&
        logger.warn &&
        logger.warn("[markBillPaid] staffAlias missing", { rid, id });
      return res
        .status(400)
        .json({ error: "staffAlias required to mark paid" });
    }

    const bill = await Bill.findOne({ _id: id, restaurantId: rid });
    if (!bill) {
      logger &&
        logger.warn &&
        logger.warn("[markBillPaid] bill not found", { id, rid });
      return res.status(404).json({ error: "Bill not found" });
    }

    // Only finalized bills can be marked paid unless overrideToken matches bill.overrideToken
    if (
      bill.status !== "finalized" &&
      !(overrideToken && overrideToken === bill.overrideToken)
    ) {
      logger &&
        logger.warn &&
        logger.warn("[markBillPaid] bill not finalized and no valid override", {
          billId: bill._id,
          status: bill.status,
        });
      return res.status(400).json({
        error: "Only finalized bill can be marked paid without admin override",
      });
    }

    bill.paymentStatus = "paid";
    bill.paymentMarkedBy = staffAlias;
    bill.paymentNote = paymentNote || null;
    bill.paidAt = new Date();
    bill.status = "paid";
    bill.audit = bill.audit || [];
    bill.audit.push({
      by: staffAlias,
      action: "payment_marked",
      at: new Date(),
    });

    await bill.save();
    logger &&
      logger.info &&
      logger.info("[markBillPaid] bill marked paid", {
        billId: bill._id,
        rid,
        markedBy: staffAlias,
      });
    await syncLinkedOrder(bill, "paid");
    safePublish(`restaurant:${rid}:tables:${bill.tableId}`, {
      event: "billPaid",
      data: bill,
    });
    logger &&
      logger.debug &&
      logger.debug("[markBillPaid] publish attempted", {
        channel: `restaurant:${rid}:tables:${bill.tableId}`,
      });

    return res.json(bill);
  } catch (err) {
    logger &&
      logger.error &&
      logger.error("[markBillPaid] error:", err && err.stack ? err.stack : err);
    return next(err);
  }
}

// Get active bills
async function getActiveBills(req, res, next) {
  console.info("[getActiveBills] enter", { params: req.params });
  try {
    const { rid } = req.params;

    // Remove any client-provided restaurantId
    if (req.body) delete req.body.restaurantId;
    if (req.query) delete req.query.restaurantId;

    if (!rid) {
      logger && logger.warn && logger.warn("[getActiveBills] missing rid");
      return res.status(400).json({ error: "Missing rid" });
    }
    const bills = (
      await Bill.find({
        restaurantId: rid,
        status: { $in: ["draft", "finalized"] },
      })
        .sort({ createdAt: -1 })
        .lean()
    ).filter(bill => bill != null).map((bill) => {
      // ULTRA SAFETY NORMALIZATION — NOTHING CAN BE NULL OR UNDEFINED
              const safeBill = {
                ...(bill || {}),
                items: Array.isArray(bill?.items) ? bill.items : [],        extras: Array.isArray(bill?.extras) ? bill.extras : [],
        taxes: Array.isArray(bill?.taxes) ? bill.taxes : [],
        subtotal: Number(bill?.subtotal || 0),
        discountAmount: Number(bill?.discountAmount || 0),
        taxAmount: Number(bill?.taxAmount || 0),
        serviceChargeAmount: Number(bill?.serviceChargeAmount || 0),
        appliedDiscountPercent: Number(
          bill?.appliedDiscountPercent ?? bill?.discountPercent ?? 0
        ),
        appliedServiceChargePercent: Number(
          bill?.appliedServiceChargePercent ?? bill?.serviceChargePercent ?? 0
        ),
        // Add other properties that might be null/undefined and are expected by the frontend
        customerName: bill?.customerName || null,
        customerContact: bill?.customerContact || null,
        customerEmail: bill?.customerEmail || null,
        tableNumber: bill?.tableNumber || null,
        orderId: bill?.orderId || null,
        // Ensure totalAmount is always a number
        totalAmount: Number(bill?.totalAmount || 0),
        // Add an 'id' field for consistency with frontend expectations if it uses 'id' instead of '_id'
        id: bill?._id,
      };
      return safeBill;
    });
    logger &&
      logger.info &&
      logger.info("[getActiveBills] returning active bills", {
        rid,
        count: (bills || []).length,
      });
    return res.json(bills);
  } catch (err) {
    logger &&
      logger.error &&
      logger.error(
        "[getActiveBills] error:",
        err && err.stack ? err.stack : err
      );
    return next(err);
  }
}

async function getBillsHistory(req, res) {
  try {
    const { rid } = req.params;

    if (!rid) {
      return res.status(400).json({ error: "Missing rid" });
    }

    // Clean unsafe fields
    delete req.body?.restaurantId;
    delete req.query?.restaurantId;

    const {
      from,
      to,
      startDate,
      endDate,
      limit = 50,
      page = 1,
      status,
    } = req.query;

    /* -------------------------------
       🎯 Build Filter
    ------------------------------- */
    const filter = { restaurantId: rid };

    if (status) {
      filter.status = status; // e.g. finalized, paid
    } else {
      // Default: only finalized/paid bills
      filter.status = { $in: ["finalized", "paid", "completed"] };
    }

    // Unified date handling
    const start = from || startDate;
    const end = to || endDate;

    if (start || end) {
      const startISO = start
        ? new Date(`${start}T00:00:00.000Z`)
        : new Date("1970-01-01T00:00:00.000Z");

      const endISO = end ? new Date(`${end}T23:59:59.999Z`) : new Date();

      filter.createdAt = { $gte: startISO, $lte: endISO };
    }

    /* -------------------------------
       📄 Pagination
    ------------------------------- */
    const skip = (Number(page) - 1) * Number(limit);

    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalCount = await Bill.countDocuments(filter);

    /* -------------------------------
       📊 Compute Daily Totals
    ------------------------------- */
    const daily = bills.reduce(
      (acc, bill) => {
        acc.subtotal += Number(bill.subtotal || 0);
        acc.tax += Number(bill.taxAmount || 0);
        acc.serviceCharge += Number(bill.serviceChargeAmount || 0);
        acc.total += Number(bill.totalAmount || 0);
        return acc;
      },
      { subtotal: 0, tax: 0, serviceCharge: 0, total: 0 }
    );

    /* -------------------------------
       📦 Response
    ------------------------------- */
    return res.json({
      rid,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit)),
      },
      summary: daily, // 👈 daily totals
      bills,
    });
  } catch (err) {
    console.error("[getBillsHistory] error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// --- ITEM INCREMENT CONTROLLER ---
// POST /api/:rid/bills/:id/items/:itemId/increment
async function incrementBillItem(req, res, next) {
  console.info("[incrementBillItem] enter", {
    params: req.params,
    bodyKeys: Object.keys(req.body || {}),
  });
  try {
    const { rid, id, itemId } = req.params;

    // Remove any client-provided restaurantId
    const body = { ...req.body };
    delete body.restaurantId;
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;
    delete req.query.restaurantId;

    const { staffAlias } = body || {};

    if (!rid || !id || !itemId) {
      logger &&
        logger.warn &&
        logger.warn("[incrementBillItem] missing params", { rid, id, itemId });
      return res.status(400).json({ error: "Missing params" });
    }

    const bill = await Bill.findOne({ _id: id, restaurantId: rid });
    if (!bill) {
      logger &&
        logger.warn &&
        logger.warn("[incrementBillItem] bill not found", { id, rid });
      return res.status(404).json({ error: "Bill not found" });
    }
    if (bill.status !== "draft") {
      logger &&
        logger.warn &&
        logger.warn("[incrementBillItem] cannot modify finalized bill", {
          id,
          status: bill.status,
        });
      return res.status(403).json({ error: "Only draft bills are editable" });
    }

    // Find the item
    const item = bill.items.find((it) => String(it.itemId) === String(itemId));
    if (!item) {
      logger &&
        logger.warn &&
        logger.warn("[incrementBillItem] item not found in bill", {
          billId: id,
          itemId,
        });
      return res.status(404).json({ error: "Item not found in bill" });
    }

    const oldQty = item.qty;
    item.qty = Math.max(1, (item.qty || 0) + 1);

    logger &&
      logger.info &&
      logger.info("[incrementBillItem] item incremented", {
        billId: id,
        itemId,
        from: oldQty,
        to: item.qty,
      });

    // Recompute totals after modification
    const additionalDiscountTotalInc = Array.isArray(bill.additionalDiscounts)
      ? bill.additionalDiscounts.reduce(
          (s, d) => s + (Number(d.amount) || 0),
          0
        )
      : 0;
    const totals = await computeTotalsFromConfig(
      rid,
      bill.items,
      bill.extras,
      bill.pricingConfigVersion || null,
      {
        discountPercent:
          bill.appliedDiscountPercent || bill.discountPercent || 0,
        serviceChargePercent:
          bill.appliedServiceChargePercent || bill.serviceChargePercent || 0,
        additionalDiscountAmount: additionalDiscountTotalInc,
      }
    );
    Object.assign(bill, {
      subtotal: totals.subtotal,
      taxes: totals.taxBreakdown,
      taxAmount: totals.taxAmount,
      discountPercent: totals.discountPercent,
      discountAmount: totals.discountAmount,
      serviceCharge: totals.serviceChargeAmount,
      totalAmount: totals.total,
    });

    // Audit
    bill.audit = bill.audit || [];
    bill.audit.push({
      by: staffAlias || "system",
      action: "item_increment",
      details: { itemId, from: oldQty, to: item.qty },
      at: new Date(),
    });

    await bill.save();

    // Publish event
    safePublish(`restaurant:${rid}:tables:${bill.tableId}`, {
      event: "billItemIncremented",
      data: bill,
    });
    logger &&
      logger.debug &&
      logger.debug("[incrementBillItem] publish attempted", {
        channel: `restaurant:${rid}:tables:${bill.tableId}`,
      });

    return res.json(bill);
  } catch (err) {
    logger &&
      logger.error &&
      logger.error(
        "[incrementBillItem] error:",
        err && err.stack ? err.stack : err
      );
    return next(err);
  }
}

// --- ITEM DECREMENT CONTROLLER ---
// POST /api/:rid/bills/:id/items/:itemId/decrement
async function decrementBillItem(req, res, next) {
  console.info("[decrementBillItem] enter", {
    params: req.params,
    bodyKeys: Object.keys(req.body || {}),
  });
  try {
    const { rid, id, itemId } = req.params;

    // Remove any client-provided restaurantId
    const body = { ...req.body };
    delete body.restaurantId;
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;
    delete req.query.restaurantId;

    const { staffAlias } = body || {};

    if (!rid || !id || !itemId) {
      logger &&
        logger.warn &&
        logger.warn("[decrementBillItem] missing params", { rid, id, itemId });
      return res.status(400).json({ error: "Missing params" });
    }

    const bill = await Bill.findOne({ _id: id, restaurantId: rid });
    if (!bill) {
      logger &&
        logger.warn &&
        logger.warn("[decrementBillItem] bill not found", { id, rid });
      return res.status(404).json({ error: "Bill not found" });
    }
    if (bill.status !== "draft") {
      logger &&
        logger.warn &&
        logger.warn("[decrementBillItem] cannot modify finalized bill", {
          id,
          status: bill.status,
        });
      return res.status(403).json({ error: "Only draft bills are editable" });
    }

    const itemIndex = bill.items.findIndex(
      (it) => String(it.itemId) === String(itemId)
    );
    if (itemIndex === -1) {
      logger &&
        logger.warn &&
        logger.warn("[decrementBillItem] item not found in bill", {
          billId: id,
          itemId,
        });
      return res.status(404).json({ error: "Item not found in bill" });
    }

    const item = bill.items[itemIndex];
    const oldQty = item.qty;
    item.qty = Math.max((item.qty || 1) - 1, 0);

    let actionTaken = "item_decrement";
    if (item.qty === 0) {
      // remove the item completely
      bill.items.splice(itemIndex, 1);
      actionTaken = "item_removed";
      logger &&
        logger.info &&
        logger.info("[decrementBillItem] item removed (qty reached 0)", {
          billId: id,
          itemId,
        });
    } else {
      logger &&
        logger.info &&
        logger.info("[decrementBillItem] item decremented", {
          billId: id,
          itemId,
          from: oldQty,
          to: item.qty,
        });
    }

    // Recompute totals
    const additionalDiscountTotalDec = Array.isArray(bill.additionalDiscounts)
      ? bill.additionalDiscounts.reduce(
          (s, d) => s + (Number(d.amount) || 0),
          0
        )
      : 0;
    const totals = await computeTotalsFromConfig(
      rid,
      bill.items,
      bill.extras,
      bill.pricingConfigVersion || null,
      {
        discountPercent:
          bill.appliedDiscountPercent || bill.discountPercent || 0,
        serviceChargePercent:
          bill.appliedServiceChargePercent || bill.serviceChargePercent || 0,
        additionalDiscountAmount: additionalDiscountTotalDec,
      }
    );

    bill.audit = bill.audit || [];
    bill.audit.push({
      by: staffAlias || "system",
      action: actionTaken,
      details: { itemId, from: oldQty, to: item.qty },
      at: new Date(),
    });

    await bill.save();

    safePublish(`restaurant:${rid}:tables:${bill.tableId}`, {
      event:
        actionTaken === "item_removed"
          ? "billItemRemoved"
          : "billItemDecremented",
      data: bill,
    });
    logger &&
      logger.debug &&
      logger.debug("[decrementBillItem] publish attempted", {
        channel: `restaurant:${rid}:tables:${bill.tableId}`,
      });

    return res.json(bill);
  } catch (err) {
    logger &&
      logger.error &&
      logger.error(
        "[decrementBillItem] error:",
        err && err.stack ? err.stack : err
      );
    return next(err);
  }
}

/**
 * Get single bill by ID
 * GET /api/:rid/bills/:id
 * Staff (requires auth)
 */
async function getBillById(req, res) {
  try {
    const { rid, id } = req.params;

    if (!rid || !id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid or missing parameters" });
    }

    let bill = await Bill.findOne({ _id: id, restaurantId: rid })
      .populate("orderId", "tableNumber customerName totalAmount status")
      .lean();

    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }

    // ---------------------------------
    // ⭐ Normalize EVERYTHING SAFELY
    // ---------------------------------
    bill.items = Array.isArray(bill.items) ? bill.items : [];
    bill.extras = Array.isArray(bill.extras) ? bill.extras : [];
    bill.taxes = Array.isArray(bill.taxes) ? bill.taxes : [];

    bill.subtotal = Number(bill.subtotal || 0);
    bill.discountAmount = Number(bill.discountAmount || 0);
    bill.serviceChargeAmount = Number(bill.serviceChargeAmount || 0);
    bill.taxAmount = Number(bill.taxAmount || 0);
    bill.totalAmount = Number(bill.totalAmount || 0);

    bill.appliedDiscountPercent = Number(
      bill.appliedDiscountPercent || bill.discountPercent || 0
    );

    bill.appliedServiceChargePercent = Number(
      bill.appliedServiceChargePercent || bill.serviceChargePercent || 0
    );

    // safe calculations
    bill.extrasTotal = bill.extras.reduce(
      (s, e) => s + Number(e.amount || 0),
      0
    );

    bill.subtotalWithExtras = Number(bill.subtotal) + Number(bill.extrasTotal);

    // ---------------------------------
    // ⭐ FINAL SAFE RESPONSE
    // ---------------------------------
    const safe = {
      ...bill,
      id: bill._id,
    };

    return res.json(safe);
  } catch (err) {
    console.error("💥 [getBillById] Error:", err);
    return res.status(500).json({ error: "Failed to fetch bill details" });
  }
}

/**
 * getBillByOrderId - GET /api/:rid/bills/order/:orderId
 *
 * Fetches the latest (or only) bill associated with the given orderId.
 * Ensures rid and orderId are valid, handles not founds gracefully.
 */
async function getBillByOrderId(req, res, next) {
  console.log("[getBillByOrderId] enter", { params: req.params });

  try {
    const { rid, orderId } = req.params;

    if (!rid || !orderId) {
      return res
        .status(400)
        .json({ error: "Missing parameters (rid, orderId)" });
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ error: "Invalid orderId format" });
    }

    let Bill;
    try {
      Bill = require("../models/bill.model");
    } catch (e) {
      return res.status(501).json({ error: "Bill model not configured" });
    }

    const bill = await Bill.findOne({
      restaurantId: rid,
      orderId: new mongoose.Types.ObjectId(orderId),
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!bill) {
      return res
        .status(404)
        .json({ error: `No bill found for orderId ${orderId}` });
    }

    /* ======================================================
       ULTRA SAFETY NORMALIZATION — NOTHING CAN BE NULL
       ====================================================== */

    const safe = {
      ...bill,
      taxes: Array.isArray(bill.taxes) ? bill.taxes : [],
      extras: Array.isArray(bill.extras) ? bill.extras : [],
      subtotal: Number(bill.subtotal || 0),
      discountAmount: Number(bill.discountAmount || 0),
      taxAmount: Number(bill.taxAmount || 0),
      serviceChargeAmount: Number(
        bill.serviceChargeAmount || bill.serviceCharge || 0
      ),
      appliedDiscountPercent: Number(
        bill.appliedDiscountPercent ?? bill.discountPercent ?? 0
      ),
      appliedServiceChargePercent: Number(
        bill.appliedServiceChargePercent ?? bill.serviceChargePercent ?? 0
      ),
    };

    // Service charge recalc
    safe.serviceChargeAmount =
      safe.serviceChargeAmount > 0
        ? safe.serviceChargeAmount
        : (safe.subtotal * safe.appliedServiceChargePercent) / 100;

    // Extras total (bulletproof)
    safe.extrasTotal = safe.extras.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    );

    // Taxes cleanup
    safe.taxes = safe.taxes.map((t) => ({
      name: t.name || "",
      rate: Number(t.rate ?? t.percent ?? 0),
      amount: Number(t.amount || 0),
      code: t.code,
    }));

    // Total recompute
    safe.totalAmount =
      safe.subtotal -
      safe.discountAmount +
      safe.serviceChargeAmount +
      safe.taxAmount +
      safe.extrasTotal;

    safe.id = bill._id;
    safe._id = bill._id;

    return res.json(safe);
  } catch (err) {
    console.error("[getBillByOrderId] Error:", err);
    return next(err);
  }
}

async function getBillByOrderIdPublic(req, res, next) {
  console.log("[getBillByOrderIdPublic] enter", {
    params: req.params,
    query: req.query,
  });

  try {
    const { rid, orderId } = req.params;
    const { sessionId } = req.query;

    delete req.body.restaurantId;
    delete req.query.restaurantId;

    if (!rid || !orderId) {
      return res
        .status(400)
        .json({ error: "Missing parameters (rid, orderId)" });
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ error: "Invalid orderId format" });
    }

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId in query" });
    }

    let Bill, Order;
    try {
      Bill = require("../models/bill.model");
      Order = require("../models/order.model");
    } catch (e) {
      console.error("[getBillByOrderIdPublic] Models missing:", e);
      return res.status(501).json({ error: "Models not configured" });
    }

    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      restaurantId: rid,
    })
      .select("sessionId tableId")
      .lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.sessionId !== sessionId) {
      return res.status(403).json({ error: "Invalid session" });
    }

    const bill = await Bill.findOne({
      restaurantId: rid,
      orderId: new mongoose.Types.ObjectId(orderId),
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!bill) {
      return res
        .status(404)
        .json({ error: `No bill found for orderId ${orderId}` });
    }

    /* SAFELY NORMALIZE */
    bill.taxes = Array.isArray(bill.taxes) ? bill.taxes : [];
    bill.extras = Array.isArray(bill.extras) ? bill.extras : [];
    bill.subtotal = Number(bill.subtotal || 0);
    bill.serviceChargeAmount = Number(bill.serviceChargeAmount || 0);
    bill.discountAmount = Number(bill.discountAmount || 0);
    bill.taxAmount = Number(bill.taxAmount || 0);

    const extrasTotal = bill.extras.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    );

    const recomputedTotal =
      bill.subtotal -
      bill.discountAmount +
      bill.serviceChargeAmount +
      bill.taxAmount +
      extrasTotal;

    bill.totalAmount = Number(recomputedTotal.toFixed(2));

    const safeBill = {
      billId: bill._id,
      orderId: order._id,
      restaurantId: rid,
      tableId: order.tableId,
      subtotal: bill.subtotal,
      discountAmount: bill.discountAmount,
      serviceChargeAmount: bill.serviceChargeAmount,
      taxAmount: bill.taxAmount,
      extras: bill.extras,
      taxes: bill.taxes.map((t) => ({
        name: t.name,
        rate: Number(t.rate ?? t.percent ?? 0),
        amount: Number(t.amount || 0),
      })),
      totalAmount: bill.totalAmount,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt,
    };

    return res.json({ bill: safeBill });
  } catch (err) {
    console.error("[getBillByOrderIdPublic] Error:", err);
    return next(err);
  }
}

module.exports = {
  createBillFromOrder,
  createBillManual,
  updateBillDraft,
  finalizeBill,
  markBillPaid,
  getActiveBills,
  getBillsHistory,
  incrementBillItem,
  decrementBillItem,
  getBillById,
  getBillByOrderId,
  getBillByOrderIdPublic,
};
