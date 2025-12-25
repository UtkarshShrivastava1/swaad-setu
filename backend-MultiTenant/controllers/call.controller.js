// controllers/call.controller.js
// Traditional HTTP-based call system — auto-fetches active order info, no Redis, no sockets.

const Call = require("../models/call.model");
const mongoose = require("mongoose");

// ---------------------- LOGGER (DEFENSIVE) ----------------------
let logger = console;
try {
  logger = require("../common/libs/logger") || console;
} catch (e) {
  console.warn("Logger not found, using console fallback.");
}

// ---------------------- REDIS/SOCKETS (DEFENSIVE) ----------------------
let publishEvent = null;
(function tryLoadRedis() {
  try {
    const mod = require("../db/redis");
    if (mod) {
      publishEvent = mod.publishEvent || mod.publish || null;
    }
  } catch (e) {
    logger.warn && logger.warn("Redis module not found, sockets disabled.");
  }
})();

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

// ---------------------- HELPERS (DEFENSIVE) ----------------------
let helpers = null;
try {
  helpers = require("../common/libs/helpers");
} catch (e) {
  helpers = null;
  logger.warn &&
    logger.warn("helpers not found; staffAlias validation skipped.");
}

const ensureStaffAliasValid =
  helpers?.ensureStaffAliasValid || (async () => true);

// ---------------------- IDEMPOTENCY CACHE ----------------------
const localIdempotencyCache = new Map();
function storeLocalIdempotency(key, value, ttlSec = 3600) {
  localIdempotencyCache.set(key, {
    value,
    expires: Date.now() + ttlSec * 1000,
  });
  setTimeout(() => localIdempotencyCache.delete(key), ttlSec * 1000);
}
function checkLocalIdempotency(key) {
  const entry = localIdempotencyCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    localIdempotencyCache.delete(key);
    return null;
  }
  return entry.value;
}

// ===============================================================
// ✅ CREATE CALL  (PUBLIC / CUSTOMER SIDE)
// ===============================================================
async function createCall(req, res, next) {
  try {
    const { rid } = req.params;

    // Remove any client-provided restaurantId
    const body = { ...req.body };
    delete body.restaurantId;
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;
    delete req.query.restaurantId;

    let { tableId, tableNumber, type, notes, staffAlias } = body;

    if (!type) {
      return res.status(400).json({ error: "Missing required field: type" });
    }

    // ✅ Resolve tableNumber → tableId if needed
    if (!tableId && tableNumber) {
      try {
        const Table = require("../models/table.model");
        const query = mongoose.Types.ObjectId.isValid(tableNumber)
          ? { _id: tableNumber }
          : { tableNumber };
        const tableDoc = await Table.findOne({
          restaurantId: rid,
          $or: [{ tableType: "dine_in" }, { tableType: { $exists: false } }],
          ...query,
        });
        if (!tableDoc)
          return res.status(404).json({ error: "Table not found" });
        tableId = tableDoc._id.toString();
      } catch (err) {
        logger.warn("Could not resolve tableNumber to tableId:", err);
      }
    }

    if (!tableId) {
      return res
        .status(400)
        .json({ error: "Missing required field: tableId or tableNumber" });
    }

    // Optional: validate staffAlias if sent
    if (staffAlias) {
      const valid = await ensureStaffAliasValid(rid, staffAlias);
      if (!valid) return res.status(400).json({ error: "Invalid staffAlias" });
    }

    // Step 1️⃣ Fetch active order info
    let orderInfo = {};
    try {
      const Order = require("../models/order.model");
      const activeOrder = await Order.findOne({
        restaurantId: rid,
        tableId,
        status: { $in: ["active", "placed"] },
      });

      if (activeOrder) {
        orderInfo = {
          orderId: activeOrder._id.toString(),
          sessionId: activeOrder.sessionId,
          customerName: activeOrder.customerName,
          customerContact: activeOrder.customerContact,
        };
      }
    } catch (e) {
      logger.warn("Order model unavailable or no active order found.");
    }

    // Step 2️⃣ Fallback if no active order
    const sessionId =
      orderInfo.sessionId ||
      `call-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Step 3️⃣ Create and save call
    const call = new Call({
      restaurantId: rid,
      tableId,
      sessionId,
      orderId: orderInfo.orderId,
      type,
      notes,
      customerName: orderInfo.customerName,
      customerContact: orderInfo.customerContact,
      staffAlias,
    });

    await call.save();

    // ------------------ NOTIFY SUBSCRIBERS ------------------
    // Notify staff dashboard
    safePublish(`restaurant:${rid}:staff`, {
      event: "new_call",
      data: call,
    });

    // Notify user at the table
    safePublish(`restaurant:${rid}:tables:${tableId}`, {
      event: "call_status_update",
      data: { callId: call._id, status: "active" },
    });

    return res.status(201).json(call);
  } catch (error) {
    logger.error && logger.error("Call creation error:", error);
    return next(error);
  }
}

// ===============================================================
// ✅ RESOLVE CALL (STAFF / ADMIN)
// ===============================================================
async function resolveCall(req, res, next) {
  try {
    const { rid, id } = req.params;

    // Remove any client-provided restaurantId
    const body = { ...req.body };
    delete body.restaurantId;
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;
    delete req.query.restaurantId;

    const { staffAlias } = body;

    // 🔒 Authorization check
    const userRole = req.user?.role;
    if (!["staff", "admin"].includes(userRole)) {
      return res
        .status(403)
        .json({ error: "Forbidden: staff/admin required to resolve call" });
    }

    if (!staffAlias) {
      return res.status(400).json({ error: "Staff alias required" });
    }

    const valid = await ensureStaffAliasValid(rid, staffAlias);
    if (!valid) return res.status(400).json({ error: "Invalid staffAlias" });

    // --- IMPROVED IDEMPOTENT RESOLUTION ---

    // Step 1: Attempt to find and update the active call.
    let call = await Call.findOneAndUpdate(
      { _id: id, restaurantId: rid, status: "active" },
      {
        status: "resolved",
        resolvedBy: staffAlias, // Use a more descriptive field name
        resolvedAt: Date.now(),
        updatedAt: Date.now(),
      },
      { new: true }
    );

    // Step 2: If it fails, check if the call was already resolved (race condition).
    if (!call) {
      const existingCall = await Call.findOne({ _id: id, restaurantId: rid });

      // If it exists and is resolved, return the existing data (idempotency).
      if (existingCall && existingCall.status === "resolved") {
        return res.status(200).json(existingCall);
      }

      // Otherwise, the call truly doesn't exist.
      return res.status(404).json({ error: "Call not found." });
    }

    // ------------------ NOTIFY SUBSCRIBERS ------------------
    // Notify staff dashboard
    safePublish(`restaurant:${rid}:staff`, {
      event: "call_resolved",
      data: call,
    });

    // Notify user at the table
    safePublish(`restaurant:${rid}:tables:${call.tableId}`, {
      event: "call_status_update",
      data: { callId: call._id, status: "resolved" },
    });

    return res.json(call);
  } catch (error) {
    logger.error && logger.error("Call resolution error:", error);
    return next(error);
  }
}

// ===============================================================
// ✅ GET ACTIVE CALLS (STAFF / ADMIN)
// ===============================================================
async function getActiveCalls(req, res, next) {
  try {
    const { rid } = req.params;

    // Remove any client-provided restaurantId
    if (req.body) delete req.body.restaurantId;
    if (req.query) delete req.query.restaurantId;

    const userRole = req.user?.role;

    if (!["staff", "admin"].includes(userRole)) {
      return res
        .status(403)
        .json({ error: "Forbidden: staff/admin required to view calls" });
    }

    const calls = await Call.find({ restaurantId: rid, status: "active" }).sort(
      { createdAt: -1 }
    );
    return res.json(calls);
  } catch (error) {
    logger.error && logger.error("Active calls fetch error:", error);
    return next(error);
  }
}

// ===============================================================
// ✅ GET RESOLVED CALLS (STAFF / ADMIN)
// ===============================================================
async function getResolvedCalls(req, res, next) {
  try {
    const { rid } = req.params;

    // Remove any client-provided restaurantId
    if (req.body) delete req.body.restaurantId;
    if (req.query) delete req.query.restaurantId;

    const userRole = req.user?.role;

    if (!["staff", "admin"].includes(userRole)) {
      return res
        .status(403)
        .json({ error: "Forbidden: staff/admin required to view history" });
    }

    const calls = await Call.find({
      restaurantId: rid,
      status: "resolved",
    }).sort({ resolvedAt: -1 });
    return res.json(calls);
  } catch (error) {
    logger.error && logger.error("Resolved calls fetch error:", error);
    return next(error);
  }
}

// ===============================================================
module.exports = {
  createCall,
  resolveCall,
  getActiveCalls,
  getResolvedCalls,
};
