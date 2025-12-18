// controllers/table.controller.js
// Hardened version with role checks and staffAlias validation.

const Table = require("../models/table.model");
const Call = require("../models/call.model"); // Import Call model
const Order = require("../models/order.model"); // Import Order model

// Defensive logger (fallback to console)
let logger = console;
try {
  logger = require("../common/libs/logger") || console;
} catch (e) {
  console.warn("Logger not found, using console as fallback.");
}

// Helpers for staffAlias and role checks
let helpers = null;
try {
  helpers = require("../common/libs/helpers");
} catch (e) {
  helpers = null;
  logger &&
    logger.warn &&
    logger.warn("helpers not found; staffAlias validation may be skipped.");
}
const ensureStaffAliasValid = helpers
  ? helpers.ensureStaffAliasValid
  : async () => true;
const requestHasRole = helpers ? helpers.requestHasRole : () => true;
const requireRoleMiddleware = helpers ? helpers.requireRoleMiddleware : null;

// Defensive load for publishEvent from Redis helpers
let publishEvent = null;
(function tryLoadPublish() {
  const candidates = [
    "../db/redis",
    "../db/redis.helpers",
    "../db/redisHelper",
    "../../db/redis",
    "../../db/redis.helpers",
  ];

  for (const p of candidates) {
    try {
      const mod = require(p);
      if (!mod) continue;

      publishEvent =
        mod.publishEvent ||
        mod.publish ||
        (typeof mod === "function" ? mod : null);

      if (publishEvent) break;
    } catch (err) {
      // ignore and continue searching
    }
  }

  if (!publishEvent) {
    logger &&
      logger.warn &&
      logger.warn(
        "publishEvent not found; publish notifications will be no-op."
      );
    publishEvent = null;
  }
})();

// Safe publish wrapper to avoid crashes/unhandled rejections
function safePublish(channel, message) {
  if (typeof publishEvent !== "function") return;
  try {
    const res = publishEvent(channel, message);
    if (res && typeof res.then === "function") {
      res.catch((err) => {
        logger &&
          logger.error &&
          logger.error("publishEvent promise rejected:", err);
      });
    }
  } catch (err) {
    logger && logger.error && logger.error("publishEvent error:", err);
  }
}

// Get all tables for restaurant (public)
async function getTables(req, res, next) {
  try {
    const { rid } = req.params;

    // Remove any client-provided restaurantId (safe handling for null-prototype objects)
    if (req.body && typeof req.body === "object") {
      delete req.body.restaurantId;
    }
    if (req.query && typeof req.query === "object") {
      delete req.query.restaurantId;
    }

    const { includeInactive } = req.query || {};

    const filter = {
      restaurantId: rid,
      $or: [{ tableType: "dine_in" }, { tableType: { $exists: false } }],
    };
    if (!includeInactive) {
      filter.isActive = true;
    }

    const tables = await Table.find(filter).sort({ tableNumber: 1 });

    // Check for expired sessions and clear if necessary
    const now = new Date();
    const updatedTables = tables.map((table) => {
      if (
        table.currentSessionId &&
        table.sessionExpiresAt &&
        table.sessionExpiresAt < now
      ) {
        return {
          ...table.toObject(),
          currentSessionId: null,
          staffAlias: null,
        };
      }
      return table;
    });

    return res.json(updatedTables);
  } catch (error) {
    logger && logger.error && logger.error("Tables fetch error:", error);
    return next(error);
  }
}

// Get table by ID (public)
async function getTableById(req, res, next) {
  try {
    const { rid, id } = req.params;

    // Remove any client-provided restaurantId
    delete req.body.restaurantId;
    delete req.query.restaurantId;

    const table = await Table.findOne({ _id: id, restaurantId: rid });

    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    // Check for expired session and clear if necessary
    if (
      table.currentSessionId &&
      table.sessionExpiresAt &&
      table.sessionExpiresAt < new Date()
    ) {
      table.currentSessionId = null;
      table.staffAlias = null;
    }

    return res.json(table);
  } catch (error) {
    logger && logger.error && logger.error("Table fetch error:", error);
    return next(error);
  }
}

// Update table status (activate/deactivate) - admin/staff (prefer admin)
// Route should also protect with auth middleware; this controller additionally checks req.user role when present.
// Update table status (available/occupied) - staff/admin
async function updateTableStatus(req, res, next) {
  try {
    const { rid, id } = req.params;

    const body = { ...req.body };
    delete body.restaurantId;
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;
    delete req.query.restaurantId;

    const { status, isActive } = body;

    // Must be staff or admin
    if (!requestHasRole(req, ["admin", "staff"])) {
      return res.status(403).json({ error: "Forbidden: admin/staff required" });
    }

    const updates = {};

    // Allow normal activation/deactivation
    if (typeof isActive === "boolean") {
      updates.isActive = isActive;
      if (isActive === false) {
        updates.currentSessionId = null;
        updates.staffAlias = null;
      }
    }

    // ⭐ Add support for table.status
    if (status) {
      const s = status.toLowerCase();
      if (!["available", "occupied"].includes(s)) {
        return res.status(400).json({ error: "Invalid table status" });
      }
      updates.status = s;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const table = await Table.findOneAndUpdate(
      { _id: id, restaurantId: rid },
      updates,
      { new: true }
    );

    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    // publish event
    safePublish(`restaurant:${rid}:staff`, {
      event: "tableStatusUpdated",
      data: table,
    });

    return res.json(table);
  } catch (error) {
    logger && logger.error && logger.error("Table status update error:", error);
    return next(error);
  }
}

// Assign session to table - staff or admin only
async function assignSession(req, res, next) {
  try {
    const { rid, id } = req.params;

    // Remove any client-provided restaurantId
    const body = { ...req.body };
    delete body.restaurantId;
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;
    delete req.query.restaurantId;

    const { sessionId, staffAlias, ttlMinutes } = body;

    // Validate and parse TTL
    let expiryTime = null;
    if (ttlMinutes) {
      const ttl = parseInt(ttlMinutes, 10);
      if (isNaN(ttl) || ttl <= 0) {
        return res.status(400).json({ error: "Invalid TTL minutes" });
      }
      expiryTime = new Date(Date.now() + ttl * 60000);
    } else {
      // Default TTL of 30 minutes
      expiryTime = new Date(Date.now() + 30 * 60000);
    }

    // Require staff/admin role (if auth provided)
    if (!requestHasRole(req, ["staff", "admin"])) {
      return res
        .status(403)
        .json({ error: "Forbidden: staff/admin credentials required" });
    }

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID required" });
    }

    if (staffAlias) {
      const valid = await ensureStaffAliasValid(rid, staffAlias);
      if (!valid) return res.status(400).json({ error: "Invalid staff alias" });
    }

    const table = await Table.findOneAndUpdate(
      {
        _id: id,
        restaurantId: rid,
        isActive: true,
        $or: [{ tableType: "dine_in" }, { tableType: { $exists: false } }],
      },
      {
        currentSessionId: sessionId,
        staffAlias,
        sessionExpiresAt: expiryTime,
        lastUsed: Date.now(),
      },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({ error: "Table not found or inactive" });
    }

    // Publish event (safe no-op if publishEvent unavailable)
    safePublish(`restaurant:${rid}:tables:${id}`, {
      event: "sessionAssigned",
      data: { sessionId, tableId: id },
    });

    return res.json(table);
  } catch (error) {
    logger && logger.error && logger.error("Session assignment error:", error);
    return next(error);
  }
}

// Create new table - admin only
async function createTable(req, res, next) {
  try {
    const { rid } = req.params;

    // Remove any client-provided restaurantId
    const body = { ...req.body };
    delete body.restaurantId;
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;
    delete req.query.restaurantId;

    const { tableNumber, capacity } = body;

    // Enforce admin role if auth present
    if (!requestHasRole(req, ["admin"])) {
      return res.status(403).json({ error: "Forbidden: admin required" });
    }

    if (typeof tableNumber === "undefined" || typeof capacity === "undefined") {
      return res
        .status(400)
        .json({ error: "Table number and capacity required" });
    }

    const table = new Table({
      restaurantId: rid,
      tableNumber,
      capacity,
      isActive: true,
      tableType: "dine_in", // New tables are always dine-in
    });

    await table.save();

    // Publish event
    safePublish(`restaurant:${rid}:staff`, {
      event: "tableCreated",
      data: table,
    });

    return res.status(201).json(table);
  } catch (error) {
    logger && logger.error && logger.error("Table creation error:", error);
    return next(error);
  }
}

// Delete table - admin only
async function deleteTable(req, res, next) {
  try {
    const { rid, id } = req.params;

    // Remove any client-provided restaurantId
    delete req.body.restaurantId;
    delete req.query.restaurantId;

    if (!requestHasRole(req, ["admin"])) {
      return res.status(403).json({ error: "Forbidden: admin required" });
    }

    const table = await Table.findOneAndDelete({ _id: id, restaurantId: rid });

    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    // Publish event
    safePublish(`restaurant:${rid}:staff`, {
      event: "tableDeleted",
      data: { tableId: id },
    });

    return res.status(204).send();
  } catch (error) {
    logger && logger.error && logger.error("Table deletion error:", error);
    return next(error);
  }
}

// Update staff alias for table - staff/admin only (validate alias)
async function updateStaffAlias(req, res, next) {
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

    if (!requestHasRole(req, ["staff", "admin"])) {
      return res.status(403).json({ error: "Forbidden: staff/admin required" });
    }

    if (!staffAlias) {
      return res.status(400).json({ error: "Staff alias required" });
    }

    const valid = await ensureStaffAliasValid(rid, staffAlias);
    if (!valid) return res.status(400).json({ error: "Invalid staffAlias" });

    const table = await Table.findOneAndUpdate(
      {
        _id: id,
        restaurantId: rid,
        $or: [{ tableType: "dine_in" }, { tableType: { $exists: false } }],
      },
      { staffAlias, updatedAt: Date.now() },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    // Publish event (safe no-op if publishEvent unavailable)
    safePublish(`restaurant:${rid}:tables:${id}`, {
      event: "staffAssigned",
      data: { tableId: id, staffAlias },
    });

    return res.json(table);
  } catch (error) {
    logger && logger.error && logger.error("Staff alias update error:", error);
    return next(error);
  }
}

// Toggle table active status - admin only
async function toggleTableActive(req, res, next) {
  try {
    const { rid, id } = req.params;
    const { isActive } = req.body;

    // Must be admin
    if (!requestHasRole(req, ["admin"])) {
      return res.status(403).json({ error: "Forbidden: admin required" });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive (boolean) is required" });
    }

    const updates = { isActive };
    if (isActive === false) {
      // When deactivating, also clear session details
      updates.currentSessionId = null;
      updates.staffAlias = null;
    }

    const table = await Table.findOneAndUpdate(
      {
        _id: id,
        restaurantId: rid,
        $or: [{ tableType: "dine_in" }, { tableType: { $exists: false } }],
      },
      updates,
      { new: true }
    );

    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    // publish event
    safePublish(`restaurant:${rid}:staff`, {
      event: "tableStatusUpdated",
      data: table,
    });

    return res.json(table);
  } catch (error) {
    logger && logger.error && logger.error("Table active toggle error:", error);
    return next(error);
  }
}

// Reset table: set status to available, clear session and staff alias
async function resetTable(req, res, next) {
  try {
    const { rid, id } = req.params;

    if (!requestHasRole(req, ["staff", "admin"])) {
      return res.status(403).json({ error: "Forbidden: staff/admin required" });
    }

    const table = await Table.findOneAndUpdate(
      {
        _id: id,
        restaurantId: rid,
        $or: [{ tableType: "dine_in" }, { tableType: { $exists: false } }],
      },
      {
        status: "available",
        currentSessionId: null,
        sessionExpiresAt: null,
        staffAlias: null,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    // Also resolve any active calls for this table
    await Call.updateMany(
      { restaurantId: rid, tableId: id, status: "active" },
      { $set: { status: "resolved", resolvedAt: Date.now() } }
    );

    // Also cancel any active orders for this table
    await Order.updateMany(
      { restaurantId: rid, tableId: id, status: { $nin: ["billed", "paid", "cancelled"] } },
      { $set: { status: "cancelled", isOrderComplete: true, updatedAt: Date.now() } }
    );

    safePublish(`restaurant:${rid}:staff`, {
      event: "tableReset",
      data: table,
    });

    return res.json(table);
  } catch (error) {
    logger && logger.error && logger.error("Table reset error:", error);
    return next(error);
  }
}

module.exports = {
  getTables,
  getTableById,
  updateTableStatus,
  assignSession,
  updateStaffAlias,
  createTable,
  deleteTable,
  toggleTableActive,
  resetTable,
};
