const express = require("express");
const router = express.Router({ mergeParams: true });

// Load controller safely
let callController = {};
try {
  callController = require("../controllers/call.controller");
  console.log("[call.route] call.controller loaded");
} catch (e) {
  console.error("[call.route] FAILED to load call.controller:", e);
  callController = {};
}

// -----------------------------
// Defensive middleware imports
// -----------------------------
let authMiddleware = (req, res, next) => next();
let requireRole = () => (req, res, next) => next();
let rateLimit = {};
let validate = {};

try {
  const auth = require("../common/middlewares/auth.middleware");
  authMiddleware =
    typeof auth === "function" ? auth : auth.verifyToken || authMiddleware;
} catch (e) {
  console.warn("[call.route] auth.middleware missing → using no-op");
}

try {
  const role = require("../common/middlewares/role.middleware");
  requireRole =
    typeof role === "function" ? role : role.requireRole || requireRole;
} catch (e) {
  console.warn("[call.route] role.middleware missing → using no-op");
}

try {
  rateLimit = require("../common/middlewares/rateLimit.middleware") || {};
} catch (e) {
  rateLimit = {};
}

try {
  validate = require("../common/middlewares/validate.middleware") || {};
} catch (e) {
  validate = {};
}

// -----------------------------
// 🆕 Subscription middleware import
// (Calls are FREE → only loadSubscription is used)
// -----------------------------
const {
  loadSubscription,
} = require("../common/middlewares/subscription.middleware");

// -----------------------------
// Tenant-aware limiter wrapper
// -----------------------------
function limiter(name) {
  if (!rateLimit || !rateLimit[name]) return (req, res, next) => next();

  return (req, res, next) => {
    req.rateLimitTenantKey = req.params?.rid;
    return rateLimit[name](req, res, next);
  };
}

// ======================================================
// 🔐 MULTI-TENANT PROTECTION
// ======================================================
router.use((req, res, next) => {
  const rid = req.params?.rid;

  if (!rid || typeof rid !== "string" || !rid.trim()) {
    return res
      .status(400)
      .json({ error: "Missing or invalid restaurant id (rid)" });
  }

  if (req.body?.restaurantId) delete req.body.restaurantId;

  next();
});

// ======================================================
// 🆕 Load subscription for all call routes
// (No restrictions, but useful for consistency + controller logic)
// ======================================================
router.use(loadSubscription);

// ======================================================
// 🖨 REQUEST LOGGER
// ======================================================
router.use((req, res, next) => {
  console.info("[call.route]", {
    method: req.method,
    path: req.originalUrl,
    rid: req.params.rid,
    reqId: req.header("x-request-id") || null,
  });
  next();
});

// ======================================================
// ROUTES
// ======================================================

/**
 * ------------------------------------
 * 🧾 Create Call (Customer/Table)
 * Public: FREE for all subscription plans
 * ------------------------------------
 */
router.post(
  "/",
  limiter("createCall"),
  validate.stripRestaurantId || ((req, res, next) => next()),
  callController.createCall
);

/**
 * ------------------------------------
 * 👩‍🍳 Active Calls (Staff/Admin)
 * FREE for all plans
 * ------------------------------------
 */
router.get(
  "/active",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("getActiveCalls"),
  callController.getActiveCalls
);

/**
 * ------------------------------------
 * 🟢 Resolve a Call (Staff/Admin)
 * FREE for all plans
 * ------------------------------------
 */
router.patch(
  "/:id/resolve",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("resolveCall"),
  callController.resolveCall
);

/**
 * ------------------------------------
 * 📜 Resolved Call History (Staff/Admin)
 * FREE for all plans
 * ------------------------------------
 */
router.get(
  "/resolved",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("getResolvedCalls"),
  callController.getResolvedCalls
);

module.exports = router;
