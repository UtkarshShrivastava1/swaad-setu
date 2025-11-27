// common/middlewares/validate.middleware.js

// -------------------- LOGGER (SAFE REQUIRE) --------------------
let logger = console;
try {
  logger = require("../libs/logger");
} catch (e) {
  console.warn("Logger not found, using console fallback.");
}

// -------------------- DEFENSIVE IMPORTS ------------------------
let Admin = null;
try {
  Admin = require("../../models/admin.model");
} catch (e) {
  logger.warn("Admin model load warning:", e.message || e);
}

let checkIdempotency = null;
try {
  const redisHelpers = require("../../db/redis");
  checkIdempotency = redisHelpers.checkIdempotency;
} catch (e) {
  logger.warn("Redis helpers unavailable:", e.message || e);
}

// -------------------- HELPERS ---------------------------------
function isNonEmptyString(v, minLen = 1) {
  return typeof v === "string" && v.trim().length >= minLen;
}

// -------------------- TENANT VALIDATION ------------------------
function validateRestaurant(req, res, next) {
  const rid = req.params?.rid;

  if (!isNonEmptyString(rid, 3)) {
    return res
      .status(400)
      .json({ error: "Invalid or missing restaurant ID (rid)" });
  }

  req.restaurantId = rid.trim();
  next();
}

// -------------------- CUSTOMER SESSION -------------------------
function validateCustomerSession(req, res, next) {
  const sessionId =
    req.body?.sessionId || req.headers["x-session-id"] || req.query?.sessionId;

  if (!isNonEmptyString(sessionId, 5)) {
    return res.status(400).json({ error: "Invalid or missing session ID" });
  }

  req.sessionId = sessionId.trim();
  next();
}

// -------------------- STAFF VALIDATION -------------------------
function validateStaff(req, res, next) {
  const staffAlias =
    req.body?.staffAlias ||
    req.headers["x-staff-alias"] ||
    req.query?.staffAlias;

  if (!isNonEmptyString(staffAlias, 2)) {
    return res.status(400).json({ error: "Invalid or missing staff alias" });
  }

  req.staffAlias = staffAlias.trim();
  next();
}

// -------------------- MANAGER OVERRIDE TOKEN -------------------
async function validateManager(req, res, next) {
  const rid = req.params?.rid;
  if (!rid) return res.status(400).json({ error: "Missing tenant ID" });

  const overrideToken =
    req.body?.overrideToken ||
    req.headers["x-override-token"] ||
    req.query?.overrideToken;

  if (!isNonEmptyString(overrideToken, 1)) {
    return res.status(401).json({ error: "Override token required" });
  }

  if (!Admin) {
    return res.status(501).json({ error: "Manager validation not configured" });
  }

  try {
    const admin = await Admin.findOne({ restaurantId: rid }).lean();
    if (!admin || !Array.isArray(admin.overrideTokens)) {
      return res.status(401).json({ error: "Invalid override token" });
    }

    const tokenObj = admin.overrideTokens.find(
      (t) => t.token === overrideToken && new Date(t.expiresAt) > new Date()
    );

    if (!tokenObj) {
      return res
        .status(401)
        .json({ error: "Invalid or expired override token" });
    }

    await Admin.updateOne(
      { restaurantId: rid },
      { $pull: { overrideTokens: { token: overrideToken } } }
    );

    req.managerValidated = true;
    next();
  } catch (err) {
    logger.error("validateManager error:", err);
    next(err);
  }
}

// -------------------- IDEMPOTENCY ------------------------------
async function handleIdempotency(req, res, next) {
  const rid = req.params?.rid;
  const sessionId =
    req.body?.sessionId || req.headers["x-session-id"] || req.query?.sessionId;

  const idempotencyKey = req.headers["x-idempotency-key"];

  if (!idempotencyKey || !rid) return next();
  if (typeof checkIdempotency !== "function") return next();

  try {
    const key = `idempotency:${rid}:${
      sessionId || "no-session"
    }:${idempotencyKey}`;
    const existing = await checkIdempotency(key);

    if (existing) {
      return res
        .status(409)
        .json({ error: "Duplicate request", data: existing });
    }

    req.idempotencyKey = key;
    next();
  } catch (err) {
    logger.error("handleIdempotency error:", err);
    next(err);
  }
}

// -------------------- EXPORTS ----------------------------------
module.exports = {
  validateRestaurant,
  validateCustomerSession,
  validateStaff,
  validateManager,
  handleIdempotency,

  stripRestaurantId(req, _res, next) {
    if (req.body && "restaurantId" in req.body) {
      delete req.body.restaurantId;
    }
    next();
  },
};
