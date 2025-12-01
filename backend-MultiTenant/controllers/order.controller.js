// controllers/order.controller.js
// Order controller - snapshot pricing, compute totals, optimistic locking, idempotency-friendly.
//
// Exports:
//  - createOrder(req,res,next)
//  - updateOrderStatus(req,res,next)
//  - getActiveOrders(req,res,next)
//  - getOrderHistory(req,res,next)
//  - deleteOrderById(req,res,next)
//  - getOrderWaiters(req,res,next)

const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Bill = require("../models/bill.model");

const Table = (() => {
  try {
    return require("../models/table.model");
  } catch (e) {
    return null;
  }
})();
const Menu = (() => {
  try {
    return require("../models/menu.model");
  } catch (e) {
    return null;
  }
})();
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
        serviceCharge: 0,
        globalDiscountPercent: 0,
      }),
    };
  }
})();
// Canonical status mapping for order updates (define once, used across funcs)
const STATUS_MAP = {
  pending: "placed",
  placed: "placed",
  accepted: "accepted",
  preparing: "preparing",
  ready: "ready",
  served: "served",
  done: "done",
  cancelled: "cancelled",
};

// Defensive logger
let logger = console;
try {
  logger = require("../common/libs/logger") || console;
} catch (e) {
  // fallback console
}

// Defensive redis helpers (idempotency, publish)
let redisHelpers = null;
let checkIdempotency = null;
let publishEvent = null;
(function tryLoadRedis() {
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
      publishEvent = mod.publishEvent || mod.publish || null;
      if (checkIdempotency || publishEvent) break;
    } catch (e) {
      /* ignore */
    }
  }
})();

//===========================================================================================================
// Helper Functions
//===========================================================================================================

// Safe idempotency check wrapper
async function safeCheckIdempotency(key) {
  if (typeof checkIdempotency !== "function") return null;
  try {
    return await checkIdempotency(key);
  } catch (err) {
    logger && logger.error && logger.error("checkIdempotency error:", err);
    return null;
  }
}

// Safe publish wrapper
function safePublish(channel, message) {
  if (typeof publishEvent !== "function") return;
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

// rounding helper
function moneyRound(x) {
  return Number((Math.round(Number(x || 0) * 100) / 100).toFixed(2));
}

// Compute totals from order snapshot (items + snapshot config)
function computeTotalsFromOrderSnapshot({
  items = [],
  appliedTaxes = [],
  appliedDiscountPercent = 0,
  appliedServiceChargePercent = 0,
  extras = [],
} = {}) {
  // Base calculations
  const lineTotal = (items || []).reduce(
    (s, it) => s + Number(it.priceAtOrder || 0) * Number(it.quantity || 1),
    0
  );
  const extrasTotal = (extras || []).reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );
  const subtotal = moneyRound(lineTotal + extrasTotal);

  // Step 1: Apply discount
  const discountAmount = moneyRound(
    (subtotal * Number(appliedDiscountPercent || 0)) / 100
  );
  const afterDiscount = moneyRound(subtotal - discountAmount);

  // Step 2: Apply service charge
  const serviceChargeAmount = moneyRound(
    (afterDiscount * Number(appliedServiceChargePercent || 0)) / 100
  );
  const afterServiceCharge = moneyRound(afterDiscount + serviceChargeAmount);

  // Step 3: Calculate taxes on (after discount + service charge)
  const taxBreakdown = (appliedTaxes || []).map((t) => {
    const rate = Number(t.percent || 0);
    const amount = moneyRound((afterServiceCharge * rate) / 100);
    return {
      name: t.name || "Tax",
      rate,
      amount,
    };
  });

  const taxAmount = moneyRound(
    taxBreakdown.reduce((sum, tax) => sum + tax.amount, 0)
  );

  // Final total
  const total = moneyRound(afterServiceCharge + taxAmount);

  return {
    subtotal,
    discountAmount,
    serviceChargeAmount,
    taxBreakdown,
    taxAmount,
    total,
    debug: {
      afterDiscount,
      afterServiceCharge,
      baseForTax: afterServiceCharge,
    },
  };
}

//===========================================================================================================
// Exported Controller Functions
//===========================================================================================================
/**
 * Create Order
 * POST /api/:rid/orders
 *
 * Creates an order and snapshots the current active pricing config from Admin into the order.
 * Computes totals and persists them on the order.
 */
async function createOrder(req, res, next) {
  console.log("[createOrder] enter", { params: req.params });
  try {
    const { rid } = req.params;

    // Remove any client-provided restaurantId
    const body = { ...req.body };
    delete body.restaurantId;
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;
    delete req.query.restaurantId;

    const {
      orderId, // Add orderId to the destructuring
      tableId,
      sessionId,
      items,
      extras = [],
      isCustomerOrder,
      staffAlias,
      customerName,
      customerContact,
      customerEmail,
    } = body || {};

    if (
      !rid ||
      !tableId ||
      !sessionId ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !customerName
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: tableId, sessionId, items, customerName",
      });
    }

    // ------------------ IDEMPOTENCY HANDLING ------------------
    const hdr =
      req.headers["x-idempotency-key"] || req.headers["x-idempotency"];
    const idempotencyKey = hdr
      ? `idempotency:order:${rid}:${sessionId}:${hdr}`
      : null;
    if (idempotencyKey) {
      const prev = await safeCheckIdempotency(idempotencyKey);
      if (prev)
        return res
          .status(409)
          .json({ error: "Duplicate request", order: prev });
    }

    // ------------------ CHECK EXISTING ORDER ------------------
    let existingOrder = null;

    if (orderId) {
      // If orderId is provided, try to find that specific order
      existingOrder = await Order.findOne({
        _id: orderId,
        restaurantId: rid,
        status: { $in: ["placed", "pending", "open"] },
      });
      if (!existingOrder) {
        return res.status(404).json({
          error: `Order with ID ${orderId} not found or not in a mergeable status.`,
        });
      }
    } else {
      // Otherwise, use the existing logic to find an order by tableId and sessionId
      existingOrder = await Order.findOne({
        restaurantId: rid,
        tableId,
        sessionId,
        status: { $nin: ["completed", "cancelled"] },
      });
    }


    // ✅ MERGE if existing active order exists
    if (existingOrder) {
      console.log(
        `[createOrder] merging into existing order ${existingOrder._id}`
      );

      const menuDoc = await Menu.findOne({
        restaurantId: rid,
        isActive: true,
      }).lean();
      if (!menuDoc || !Array.isArray(menuDoc.items)) {
        return res
          .status(400)
          .json({ error: "Active menu not found for restaurant" });
      }

      const normalizeId = (id) =>
        String(id || "")
          .toLowerCase()
          .trim();
      const byId = new Map();
      for (const m of menuDoc.items || []) {
        if (!m) continue;
        const ids = [m._id, m.itemId].filter(Boolean).map(normalizeId);
        ids.forEach((id) => byId.set(id, m));
      }

      // Merge items
      for (const it of items || []) {
        const providedId = it.menuItemId || it.itemId || it.id;
        const normalizedId = normalizeId(providedId);
        const menuItem = byId.get(normalizedId);
        if (!menuItem) continue;

        const existingItem = existingOrder.items.find(
          (i) => i.menuItemId.toString() === String(menuItem._id)
        );
        if (existingItem) {
          existingItem.quantity += Number(it.quantity || 1);
          existingItem.priceAtOrder = Number(
            it.priceAtOrder || existingItem.priceAtOrder || menuItem.price
          );
        } else {
          existingOrder.items.push({
            menuItemId: menuItem._id,
            name: menuItem.name,
            quantity: Number(it.quantity || 1),
            priceAtOrder: Number(it.priceAtOrder || menuItem.price || 0),
            notes: it.notes || "",
            status: "placed",
            modifiers: it.modifiers || [],
            OrderNumberForDay: existingOrder.OrderNumberForDay, // ✅ schema-safe
          });
        }
      }

      // Ensure all items have OrderNumberForDay
      for (const item of existingOrder.items) {
        if (!item.OrderNumberForDay)
          item.OrderNumberForDay = existingOrder.OrderNumberForDay;
      }

      // Update customer info if provided
      if (customerName && !existingOrder.customerName)
        existingOrder.customerName = customerName;
      if (customerContact) existingOrder.customerContact = customerContact;
      if (customerEmail) existingOrder.customerEmail = customerEmail;

      // Recompute totals
      const baseTotal = existingOrder.items.reduce(
        (sum, r) => sum + r.priceAtOrder * (r.quantity || 1),
        0
      );
      const totals = computeTotalsFromOrderSnapshot({
        items: existingOrder.items,
        appliedTaxes: existingOrder.appliedTaxes || [],
        appliedDiscountPercent: existingOrder.appliedDiscountPercent || 0,
        appliedServiceChargePercent:
          existingOrder.appliedServiceChargePercent || 0,
        extras,
      });

      existingOrder.subtotal = totals.subtotal;
      existingOrder.taxAmount = totals.taxAmount;
      existingOrder.serviceChargeAmount = totals.serviceChargeAmount;
      existingOrder.discountAmount = totals.discountAmount;
      existingOrder.totalAmount = totals.total;
      existingOrder.status = "placed";
      existingOrder.updatedAt = new Date();

      await existingOrder.save();

      // ------------------ ALSO UPDATE EXISTING BILL ------------------
      try {
        const bill = await Bill.findOne({
          restaurantId: rid,
          orderId: existingOrder._id,
          status: { $in: ["draft", "open", "unpaid"] },
        });

        if (bill) {
          console.log("[createOrder] updating existing bill for merged order");

          // Rebuild items for bill
          const billItems = existingOrder.items.map((it) => ({
            itemId: String(it.menuItemId),
            name: it.name,
            qty: it.quantity,
            price: it.priceAtOrder || it.price || 0,
            priceAtOrder: it.priceAtOrder || it.price || 0,
            modifiers: it.modifiers || [],
            notes: it.notes || "",
          }));

          // Recalculate totals
          const billTotals = computeTotalsFromOrderSnapshot({
            items: existingOrder.items,
            appliedTaxes: existingOrder.appliedTaxes || [],
            appliedDiscountPercent: existingOrder.appliedDiscountPercent || 0,
            appliedServiceChargePercent:
              existingOrder.appliedServiceChargePercent || 0,
            extras: existingOrder.extras || [],
          });

          bill.items = billItems;
          bill.subtotal = billTotals.subtotal;
          bill.taxAmount = billTotals.taxAmount;
          bill.discountAmount = billTotals.discountAmount;
          bill.serviceChargeAmount = billTotals.serviceChargeAmount;
          bill.totalAmount = billTotals.total;
          bill.updatedAt = new Date();

          // Add audit trail
          bill.audit.push({
            by: "(System)",
            action: "item_added_to_existing_order",
            at: new Date(),
          });

          await bill.save();

          safePublish(`restaurant:${rid}:bills`, {
            event: "billUpdated",
            data: bill,
          });

          console.log("[createOrder] bill updated successfully");
        } else {
          console.warn("[createOrder] no active bill found to update");
        }
      } catch (e) {
        console.error("[createOrder] failed to update existing bill", e);
      }

      // ------------------ BROADCAST MERGE EVENT ------------------
      safePublish(`restaurant:${rid}:orders`, {
        event: "orderMerged",
        data: existingOrder,
      });

      return res.status(200).json({
        message: "Existing order found and merged successfully.",
        order: existingOrder,
        preBill: {
          subtotal: totals.subtotal,
          taxes: totals.taxBreakdown,
          serviceCharge: totals.serviceChargeAmount,
          discount: totals.discountAmount,
          total: totals.total,
        },
      });
    }

    // ------------------ OTHERWISE CREATE NEW ORDER ------------------
    const menuDoc = await Menu.findOne({
      restaurantId: rid,
      isActive: true,
    }).lean();
    if (!menuDoc || !Array.isArray(menuDoc.items)) {
      return res.status(400).json({ error: "Menu not found for restaurant" });
    }

    const normalizeId = (id) =>
      String(id || "")
        .toLowerCase()
        .trim();
    const byId = new Map();
    for (const m of menuDoc.items || []) {
      if (!m) continue;
      const ids = [m._id, m.itemId].filter(Boolean).map(normalizeId);
      ids.forEach((id) => byId.set(id, m));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastOrderToday = await Order.findOne({
      restaurantId: rid,
      createdAt: { $gte: today },
    })
      .sort({ createdAt: -1 })
      .lean();

    let nextOrderNumber = 1;
    if (lastOrderToday) {
      const prevNumber =
        lastOrderToday.OrderNumberForDay ||
        (lastOrderToday.items?.[0]?.OrderNumberForDay ?? 0);
      nextOrderNumber = prevNumber + 1;
    }

    const resolvedItems = [];
    for (const [idx, it] of (items || []).entries()) {
      const providedId = it.menuItemId || it.itemId || it.id;
      const normalizedId = normalizeId(providedId);
      const menuItem = byId.get(normalizedId);
      if (!menuItem) continue;
      const qty = Math.max(1, Number(it.quantity ?? it.qty ?? 1));
      const authoritativePrice = Number(
        it.priceAtOrder ?? it.price ?? menuItem.price ?? 0
      );
      resolvedItems.push({
        menuItemId: new mongoose.Types.ObjectId(menuItem._id),
        name: menuItem.name || it.name || "Item",
        quantity: qty,
        price: authoritativePrice,
        priceAtOrder: authoritativePrice,
        OrderNumberForDay: nextOrderNumber,
        notes: it.notes || "",
        status: it.status || "placed",
        modifiers: it.modifiers || [],
      });
    }

    const baseTotal = resolvedItems.reduce(
      (sum, r) => sum + r.priceAtOrder * (r.quantity || 1),
      0
    );

    let cfg = null;
    let appliedTaxes = [];
    let appliedDiscountPercent = 0;
    let appliedServiceChargePercent = 0;
    let pricingConfigVersion = null;

    try {
      const adminDoc = await Admin.findOne({ restaurantId: rid });
      if (adminDoc?.getActivePricingConfig)
        cfg = adminDoc.getActivePricingConfig();
      if (!cfg) cfg = await getPricingConfig(rid);
      if (cfg) {
        appliedTaxes = (cfg.taxes || []).map((t) => ({
          name: t.name,
          percent: Number(t.percent || 0),
          code: t.code || "",
        }));
        appliedDiscountPercent = Number(cfg.globalDiscountPercent || 0);
        appliedServiceChargePercent = Number(
          cfg.serviceCharge || cfg.serviceChargePercent || 0
        );
        pricingConfigVersion = cfg.version ? Number(cfg.version) : null;
      }
    } catch (e) {
      logger?.warn?.("[createOrder] failed to fetch Admin pricing config", e);
    }

    const totals = computeTotalsFromOrderSnapshot({
      items: resolvedItems,
      appliedTaxes,
      appliedDiscountPercent,
      appliedServiceChargePercent,
      extras,
    });

    const orderDoc = new Order({
      restaurantId: rid,
      tableId,
      sessionId,
      items: resolvedItems,
      status: "placed",
      paymentStatus: "unpaid",
      isCustomerOrder:
        typeof isCustomerOrder === "boolean" ? isCustomerOrder : true,
      customerName,
      customerContact: customerContact || null,
      customerEmail: customerEmail || null,
      staffAlias: staffAlias || null,
      version: 1,
      OrderNumberForDay: nextOrderNumber,
      pricingConfigVersion,
      pricingConfigId: cfg?._id ? String(cfg._id) : null,
    });

    orderDoc.appliedTaxes = (totals.taxBreakdown || []).map((t) => ({
      name: t.name || "Tax",
      percent: Number(t.rate ?? t.percent ?? 0),
      code: t.code || t.name?.toUpperCase()?.replace(/\s+/g, "_") || "",
      amount: Number(Number(t.amount || 0).toFixed(2)),
    }));

    orderDoc.appliedDiscountPercent = Number(
      totals.discountPercent ?? appliedDiscountPercent
    );
    orderDoc.appliedServiceChargePercent = Number(
      totals.serviceChargePercent ?? appliedServiceChargePercent
    );
    orderDoc.subtotal = Number(
      Number(totals.subtotal || baseTotal || 0).toFixed(2)
    );
    orderDoc.extrasTotal = Number(
      Number(
        totals.extrasTotal ||
          (extras || []).reduce((s, e) => s + Number(e.amount || 0), 0)
      ).toFixed(2)
    );
    orderDoc.taxAmount = Number(Number(totals.taxAmount || 0).toFixed(2));
    orderDoc.serviceChargeAmount = Number(
      Number(totals.serviceChargeAmount || 0).toFixed(2)
    );
    orderDoc.discountAmount = Number(
      Number(totals.discountAmount || 0).toFixed(2)
    );
    orderDoc.totalAmount = Number(Number(totals.total || 0).toFixed(2));

    await orderDoc.save();

    // Update Table
    if (Table) {
      try {
        await Table.findOneAndUpdate(
          { _id: tableId, restaurantId: rid },
          {
            $set: {
              status: "occupied",
              CurrentOrderId: orderDoc._id,
              lastUsed: new Date(),
              updatedAt: new Date(),
            },
          }
        );
      } catch (e) {
        logger?.warn?.("[createOrder] failed to update table status", e);
      }
    }

    // Notify subscribers
    safePublish(`restaurant:${rid}:orders`, {
      event: "orderCreated",
      data: orderDoc,
    });

    return res.status(201).json({
      order: orderDoc,
      preBill: {
        subtotal: totals.subtotal,
        taxes: totals.taxBreakdown,
        serviceCharge: totals.serviceChargeAmount,
        discount: totals.discountAmount,
        total: totals.total,
      },
    });
  } catch (err) {
    logger?.error?.("[createOrder] error:", err);
    return next(err);
  }
}

/**
 * Update order status (optimistic locking support)
 * PATCH /api/:rid/orders/:id/status
 * Body: { status, staffAlias, version }
 */
async function updateOrderStatus(req, res, next) {
  console.log("[updateOrderStatus] enter", {
    params: req.params,
    body: req.body,
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

    const { status, staffAlias, version } = body || {};

    if (!rid || !id || !status)
      return res.status(400).json({ error: "Missing parameters" });

    // Normalize status
    const canonical = STATUS_MAP[String(status).toLowerCase()] || status;

    const update = {
      status: canonical,
      staffAlias: staffAlias || null,
      updatedAt: new Date(),
    };

    // ====== Update with optimistic version lock ======
    let order;
    if (typeof version !== "undefined") {
      order = await Order.findOneAndUpdate(
        { _id: id, restaurantId: rid, version },
        { $set: update, $inc: { version: 1 } },
        { new: true }
      );
      if (!order) {
        const current = await Order.findOne({
          _id: id,
          restaurantId: rid,
        }).lean();
        return res.status(409).json({ error: "Version mismatch", current });
      }
    } else {
      order = await Order.findOneAndUpdate(
        { _id: id, restaurantId: rid },
        { $set: update, $inc: { version: 1 } },
        { new: true }
      );
    }

    // ====== Notify real-time subscribers ======
    safePublish(`restaurant:${rid}:tables:${order.tableId}`, {
      event: "orderUpdated",
      data: order,
    });

    // ====== Auto-reset table if order is done/completed/cancelled ======
    if (["done", "completed", "cancelled"].includes(order.status) && Table) {
      try {
        await Table.findOneAndUpdate(
          { _id: order.tableId, restaurantId: rid },
          {
            $set: {
              status: "available",
              CurrentOrderId: null,
              currentSessionId: null,
              updatedAt: new Date(),
            },
          }
        );
        console.log(
          `[updateOrderStatus] Table ${order.tableId} reset to 'available' ✅`
        );
      } catch (e) {
        logger?.warn?.("[updateOrderStatus] failed to reset table", e);
      }
    }

    return res.json(order);
  } catch (err) {
    logger?.error?.("[updateOrderStatus] error:", err);
    return next(err);
  }
}

/**
 * getActiveOrders - returns active orders, optionally including terminal statuses
 * GET /api/:rid/orders/active
 */
async function getActiveOrders(req, res, next) {
  console.log("[getActiveOrders] enter", {
    params: req.params,
    query: req.query,
  });
  try {
    const rid = req.params?.rid || req.query?.rid;

    // Remove any client-provided restaurantId (safe handling for null-prototype objects)
    if (req.body && typeof req.body === "object") {
      delete req.body.restaurantId;
    }
    if (req.query && typeof req.query === "object") {
      delete req.query.restaurantId;
    }

    if (!rid)
      return res.status(400).json({ error: "Missing restaurant id (rid)" });

    const includeTerminal =
      req.query && typeof req.query.includeTerminal === "string"
        ? req.query.includeTerminal.toLowerCase() !== "false"
        : true;
    const statuses = includeTerminal
      ? ["placed", "accepted", "preparing", "ready", "served"]
      : ["placed", "accepted", "preparing"];

    const orders = await Order.find({
      restaurantId: rid,
      status: { $in: statuses },
    })
      .populate({ path: "tableId", select: "tableNumber" })
      .sort({ createdAt: -1 })
      .lean();

    const denorm = orders.map((o) => {
      const out = { ...o };
      if (out.tableId && typeof out.tableId === "object") {
        out.tableNumber = out.tableId.tableNumber ?? null;
        out.tableId = String(out.tableId._id);
      } else {
        out.tableNumber = out.tableNumber ?? null;
        out.tableId = out.tableId ? String(out.tableId) : null;
      }
      return out;
    });

    return res.json(denorm);
  } catch (err) {
    logger &&
      logger.error &&
      logger.error(
        "[getActiveOrders] error:",
        err && err.stack ? err.stack : err
      );
    return next(err);
  }
}

/**
 * getOrderHistory - GET /api/:rid/orders/history
 * Query params support: sessionId, date, startDate, endDate, limit, page, sort
 */
async function getOrderHistory(req, res, next) {
  console.log("[getOrderHistory] enter", {
    params: req.params,
    query: req.query,
  });
  try {
    const { rid } = req.params;

    // Remove any client-provided restaurantId
    delete req.body?.restaurantId;
    delete req.query?.restaurantId;

    const {
      sessionId: querySessionId,
      date,
      startDate,
      endDate,
      limit,
      page,
      sort,
    } = req.query || {};
    if (!rid)
      return res.status(400).json({ error: "Missing restaurant id (rid)" });

    // determine if request from staff (req.user)
    const userRole = req.user && (req.user.role || req.user.roles);
    const isStaff = userRole === "staff" || userRole === "admin";

    if (!isStaff && !querySessionId)
      return res
        .status(400)
        .json({ error: "sessionId query required for non-staff" });

    // date filters
    const dateFilter = {};
    if (date) {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime()))
        return res.status(400).json({ error: "invalid date param" });
      const s = new Date(
        Date.UTC(
          parsed.getUTCFullYear(),
          parsed.getUTCMonth(),
          parsed.getUTCDate(),
          0,
          0,
          0
        )
      );
      const e = new Date(
        Date.UTC(
          parsed.getUTCFullYear(),
          parsed.getUTCMonth(),
          parsed.getUTCDate(),
          23,
          59,
          59,
          999
        )
      );
      dateFilter.createdAt = { $gte: s, $lte: e };
    } else if (startDate || endDate) {
      const s = startDate ? new Date(startDate) : new Date(0);
      const e = endDate ? new Date(endDate) : new Date();
      if ((startDate && isNaN(s.getTime())) || (endDate && isNaN(e.getTime())))
        return res.status(400).json({ error: "invalid startDate or endDate" });
      const ss = new Date(
        Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate(), 0, 0, 0)
      );
      const ee = new Date(
        Date.UTC(
          e.getUTCFullYear(),
          e.getUTCMonth(),
          e.getUTCDate(),
          23,
          59,
          59,
          999
        )
      );
      dateFilter.createdAt = { $gte: ss, $lte: ee };
    }

    const baseQuery = { restaurantId: rid, status: "done", ...dateFilter };
    if (!isStaff) baseQuery.sessionId = querySessionId;
    else if (querySessionId) baseQuery.sessionId = querySessionId;

    const perPage = Math.min(parseInt(limit, 10) || 25, 200);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const sortOption = sort || "-createdAt";

    const [total, orders] = await Promise.all([
      Order.countDocuments(baseQuery),
      Order.find(baseQuery)
        .sort(sortOption)
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .lean(),
    ]);

    return res.json({
      meta: {
        total,
        page: pageNum,
        perPage,
        pages: Math.ceil(total / perPage),
      },
      data: orders,
    });
  } catch (err) {
    logger &&
      logger.error &&
      logger.error(
        "[getOrderHistory] error:",
        err && err.stack ? err.stack : err
      );
    return next(err);
  }
}

/**
 * deleteOrderById - DELETE /api/:rid/orders/:id
 */
async function deleteOrderById(req, res, next) {
  console.log("[deleteOrderById] enter", { params: req.params });

  try {
    const { rid, id: orderId } = req.params;

    if (!rid || !orderId) {
      return res.status(400).json({ error: "Missing rid or orderId" });
    }

    delete req.body?.restaurantId;
    delete req.query?.restaurantId;

    const Bill = require("../models/bill.model");
    const Table = require("../models/table.model");

    /* ========================================
       1. Find bill associated with this order
    ========================================= */
    const bill = await Bill.findOne({
      orderId,
      restaurantId: rid,
    });

    if (bill) {
      console.log("[deleteOrderById] Found related bill → deleting", {
        billId: bill._id,
      });
      await Bill.deleteOne({ _id: bill._id });
    } else {
      console.log("[deleteOrderById] No related bill found");
    }

    /* ========================================
       2. Delete order
    ========================================= */
    const order = await Order.findOneAndDelete({
      _id: orderId,
      restaurantId: rid,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const tableId = order.tableId;

    /* ========================================
       3. Check if table should become available
    ========================================= */

    if (tableId) {
      console.log("[deleteOrderById] Checking table occupancy…");

      const activeOrders = await Order.countDocuments({
        restaurantId: rid,
        tableId,
        status: { $ne: "done" }, // any order still active?
      });

      if (activeOrders === 0) {
        console.log(
          "[deleteOrderById] No remaining orders → setting table available"
        );

        await Table.findOneAndUpdate(
          { _id: tableId, restaurantId: rid },
          {
            status: "available",
            CurrentOrderId: null,
            currentSessionId: null,
            sessionExpiresAt: null,
          },
          { new: true }
        );
      } else {
        console.log(
          `[deleteOrderById] Table still has ${activeOrders} active orders → not changing status`
        );
      }
    }

    /* ========================================
       4. Publish socket event
    ========================================= */
    safePublish(`restaurant:${rid}:orders`, {
      event: "orderDeleted",
      data: { orderId, billId: bill?._id || null, tableId },
    });

    return res.json({
      message: "Order deleted successfully",
      deletedOrderId: orderId,
      deletedBillId: bill?._id || null,
      tableStatusUpdated: !tableId ? false : true,
    });
  } catch (err) {
    console.error("[deleteOrderById] error:", err);
    return res.status(500).json({ error: "Failed to delete order" });
  }
}

/**
 * getOrderWaiters - returns normalized waiter names
 * GET /api/:rid/orders/waiters
 * Public endpoint - no auth required since it just returns waiter names
 */
async function getOrderWaiters(req, res, next) {
  logger?.info?.("[getOrderWaiters] enter", { params: req.params });

  try {
    const { rid } = req.params;

    // Remove any client-provided restaurantId
    delete req.body?.restaurantId;
    delete req.query?.restaurantId;

    // Validate tenant
    if (!rid) {
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }

    // Cache (optional)
    res.set("Cache-Control", "public, max-age=60");

    /* ======================================================
       1️⃣ SAFE MODEL REQUIRE
    ====================================================== */
    let Admin;
    try {
      Admin = require("../models/admin.model");
    } catch (e) {
      logger?.error?.("[getOrderWaiters] Admin model missing:", e);
      return res.status(501).json({ error: "Admin model not configured" });
    }

    /* ======================================================
       2️⃣ LOAD ADMIN DOCUMENT SAFELY
    ====================================================== */
    const admin = await Admin.findOne({ restaurantId: rid })
      .select("waiterNames")
      .lean()
      .catch((err) => {
        logger?.error?.("[getOrderWaiters] Mongo error:", err);
        return null;
      });

    if (!admin || !Array.isArray(admin.waiterNames)) {
      return res.json({
        waiterNames: [],
        count: 0,
      });
    }

    /* ======================================================
       3️⃣ SAFELY NORMALIZE WAITER NAMES
    ====================================================== */

    const waiterNames = admin.waiterNames
      .map((name) => {
        if (!name) return null;
        if (typeof name !== "string") return null;
        const trimmed = name.trim();
        return trimmed.length > 0 ? trimmed : null;
      })
      .filter(Boolean);

    // Remove case-insensitive duplicates
    const uniqueMap = new Map();
    waiterNames.forEach((n) => {
      const key = n.toLowerCase();
      if (!uniqueMap.has(key)) uniqueMap.set(key, n);
    });

    const uniqueWaiters = Array.from(uniqueMap.values());

    /* ======================================================
       4️⃣ RETURN FINAL PAYLOAD
    ====================================================== */
    logger?.info?.("[getOrderWaiters] returning:", {
      count: uniqueWaiters.length,
    });

    return res.json({
      waiterNames: uniqueWaiters,
      count: uniqueWaiters.length,
    });
  } catch (err) {
    logger?.error?.("[getOrderWaiters] error:", err?.stack || err);
    return next(err);
  }
}

/**
 * Get order details by id (public / customer view)
 * GET /api/:rid/orders/:orderId
 * Returns the same shape you returned on createOrder: { order: ... }
 */
async function getOrderById(req, res, next) {
  console.log("[getOrderById] enter", { params: req.params, query: req.query });

  try {
    const { rid, orderId } = req.params;

    // Remove any client-provided restaurantId
    delete req.body?.restaurantId;
    delete req.query?.restaurantId;

    if (!rid || !orderId) {
      return res
        .status(400)
        .json({ error: "Missing parameters (rid, orderId)" });
    }

    // Find order strictly scoped to restaurant
    const order = await Order.findOne({
      _id: orderId,
      restaurantId: rid,
    }).lean();

    if (!order) {
      return res
        .status(404)
        .json({ error: `Order not found for id ${orderId}` });
    }

    // Optional: keep response customer-safe (you already return full doc in createOrder)
    // Here we mirror createOrder and return { order } directly for consistency.
    return res.status(200).json({ order });
  } catch (err) {
    console.error("❌ [getOrderById] error:", err);
    return next(err);
  }
}

/** getOrdersByTable - GET /api/:rid/orders/table/:tableId
 *
 * Fetches all active (non-closed) orders for the given tableId.
 */
async function getOrdersByTable(req, res, next) {
  try {
    const { rid, tableId } = req.params;

    // Multi-tenant guard
    if (!rid || !tableId) {
      return res.status(400).json({ error: "Missing rid or tableId" });
    }

    // Remove client-injected restaurantId
    delete req.body?.restaurantId;
    delete req.query?.restaurantId;

    // Fetch orders safely
    const orders = await Order.find({
      restaurantId: rid,
      tableId,
      status: { $ne: "done" }, // exclude closed orders
    })
      .sort({ createdAt: -1 })
      .lean();

    // If no orders, return empty (frontend expects array)
    if (!orders || orders.length === 0) {
      return res.json([]);
    }

    // Normalize orders to avoid frontend crashes
    const safeOrders = orders.map((o) => ({
      ...o,
      id: o._id,
      _id: o._id,
      items: Array.isArray(o.items) ? o.items : [],
      totalAmount: Number(o.totalAmount || 0),
      paymentStatus: o.paymentStatus || "unpaid",
      status: o.status || "pending",
      customerName: o.customerName || "",
    }));

    return res.json(safeOrders);
  } catch (err) {
    console.error("[getOrdersByTable] error:", err);
    return res.status(500).json({ error: "Failed to fetch orders" });
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

    delete req.body?.restaurantId;
    delete req.query?.restaurantId;

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

/**
 * PATCH /api/:rid/orders/:id
 * Used to sync Order fields when a Bill is finalized or paid
 */
async function updateOrderFromBill(req, res) {
  const { rid, id } = req.params;

  // Remove any client-provided restaurantId
  const body = { ...req.body };
  delete body.restaurantId;
  delete body._id;
  delete body.createdAt;
  delete body.updatedAt;
  delete req.query.restaurantId;

  console.group(`🧾 [updateOrderFromBill] PATCH /api/${rid}/orders/${id}`);
  console.log("Incoming update payload:", body);

  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: id, restaurantId: rid },
      { $set: body },
      { new: true }
    );

    if (!updatedOrder) {
      console.warn(
        `⚠️ No matching order found for restaurantId=${rid}, orderId=${id}`
      );
      console.groupEnd();
      return res.status(404).json({ message: "Order not found" });
    }

    console.log("✅ Order updated successfully:", {
      orderId: updatedOrder._id,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
      isOrderComplete: updatedOrder.isOrderComplete,
    });

    console.groupEnd();
    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error("❌ [updateOrderFromBill] Error updating order:", err);
    console.groupEnd();
    res
      .status(500)
      .json({ message: "Failed to update order", error: err.message });
  }
}

module.exports = {
  createOrder,
  updateOrderStatus,
  getActiveOrders,
  getOrderHistory,
  deleteOrderById,
  getOrderWaiters,
  getOrdersByTable,
  getOrderById,
  getBillByOrderId,
  getBillByOrderIdPublic,
  updateOrderFromBill,
};
