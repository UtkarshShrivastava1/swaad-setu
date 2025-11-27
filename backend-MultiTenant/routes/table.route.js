// routes/table.route.js
const express = require("express");
const router = express.Router({ mergeParams: true });

const tableController = require("../controllers/table.controller");

// ------------------------------------------------------------
// 🧱 Defensive middleware imports
// ------------------------------------------------------------
let authMiddleware = (req, res, next) => next();
let requireRole = () => (req, res, next) => next();
let rateLimit = {};
let helpers = null;
let validate = {};

try {
  const auth = require("../common/middlewares/auth.middleware");
  authMiddleware =
    typeof auth === "function" ? auth : auth.verifyToken || authMiddleware;
} catch (e) {
  console.warn("[table.routes] auth.middleware missing → using no-op");
}

try {
  const role = require("../common/middlewares/role.middleware");
  requireRole =
    typeof role === "function" ? role : role.requireRole || requireRole;
} catch (e) {
  console.warn("[table.routes] role.middleware missing → using no-op");
}

try {
  rateLimit = require("../common/middlewares/rateLimit.middleware") || {};
} catch (e) {
  console.warn("[table.routes] rateLimit.middleware missing");
  rateLimit = {};
}

try {
  helpers = require("../common/libs/helpers");
} catch (e) {
  console.warn(
    "[table.routes] helpers missing → staffAlias validation disabled"
  );
  helpers = null;
}

try {
  validate = require("../common/middlewares/validate.middleware") || {};
} catch (e) {
  validate = {};
}

// ------------------------------------------------------------
// 🆕 SUBSCRIPTION MIDDLEWARES
// ------------------------------------------------------------
const {
  loadSubscription,
  enforceLimit,
} = require("../common/middlewares/subscription.middleware");
const Table = require("../models/table.model");

// ------------------------------------------------------------
// ⏱ Tenant-aware limiter
// ------------------------------------------------------------
function limiter(name) {
  if (!rateLimit || !rateLimit[name]) return (req, res, next) => next();
  return (req, res, next) => {
    req.rateLimitTenantKey = req.params.rid;
    return rateLimit[name](req, res, next);
  };
}

// ------------------------------------------------------------
// 🔐 TENANT VALIDATION — Required for multi-tenancy
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// 🆕 LOAD SUBSCRIPTION BEFORE ALL TABLE ROUTES
// ------------------------------------------------------------
router.use(loadSubscription);

// ------------------------------------------------------------
// 🧾 Logger
// ------------------------------------------------------------
router.use((req, res, next) => {
  console.info("[table.routes]", {
    method: req.method,
    path: req.originalUrl,
    rid: req.params.rid,
  });
  next();
});

// ------------------------------------------------------------
// 🧩 Role helpers
// ------------------------------------------------------------
const adminOnly = [authMiddleware, requireRole("admin")];
const staffOrAdmin = [authMiddleware, requireRole(["staff", "admin"])];

const ensureStaffAliasMiddleware = helpers?.ensureStaffAliasMiddleware
  ? helpers.ensureStaffAliasMiddleware()
  : (req, res, next) => next();

// ------------------------------------------------------------
// ROUTES (all tenant-aware)
// ------------------------------------------------------------

/**
 * POST /api/:rid/tables
 * Create table (admin only)
 *
 * 🔒 SUBSCRIPTION RULE:
 * FREE → maxTables = 10
 * STANDARD → maxTables = 40
 * PRO → unlimited
 *
 * So we apply enforceLimit("tables") only here.
 */
router.post(
  "/",
  ...adminOnly,
  limiter("sensitiveLimiter"),

  // Enforce subscription table limit
  enforceLimit("tables", (rid) => Table.countDocuments({ restaurantId: rid })),

  validate.stripRestaurantId
    ? validate.stripRestaurantId
    : (req, res, next) => next(),

  tableController.createTable
);

/**
 * GET /api/:rid/tables
 * Public list — FREE for all plans
 * No subscription checks needed
 */
router.get("/", tableController.getTables);

/**
 * GET /api/:rid/tables/:id
 * Public detail — FREE for all plans
 */
router.get("/:id", tableController.getTableById);

/**
 * PATCH /api/:rid/tables/:id/status
 * Staff/Admin: update table status
 * No subscription plan restrictions
 */
router.patch(
  "/:id/status",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("staffLimiter"),
  validate.stripRestaurantId || ((req, res, next) => next()),
  tableController.updateTableStatus
);

/**
 * PATCH /api/:rid/tables/:id/session
 * Assign session to table (staff/admin)
 * No subscription restrictions
 */
router.patch(
  "/:id/session",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("staffLimiter"),
  validate.stripRestaurantId || ((req, res, next) => next()),
  ensureStaffAliasMiddleware,
  tableController.assignSession
);

/**
 * PATCH /api/:rid/tables/:id/staff
 * Update staff alias (staff/admin)
 * No subscription restrictions
 */
router.patch(
  "/:id/staff",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("staffLimiter"),
  validate.stripRestaurantId || ((req, res, next) => next()),
  ensureStaffAliasMiddleware,
  tableController.updateStaffAlias
);

/**
 * PATCH /api/:rid/tables/:id/active
 * Admin: toggle table active status
 * No subscription plan restrictions
 */
router.patch(
  "/:id/active",
  ...adminOnly,
  limiter("sensitiveLimiter"),
  validate.stripRestaurantId || ((req, res, next) => next()),
  tableController.toggleTableActive
);

/**
 * PATCH /api/:rid/tables/:id/reset
 * Staff/Admin: reset table status to available, clear session and staff alias
 * No subscription plan restrictions
 */
router.patch(
  "/:id/reset",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("staffLimiter"),
  validate.stripRestaurantId || ((req, res, next) => next()),
  tableController.resetTable
);

/**
 * DELETE /api/:rid/tables/:id
 * Delete table (admin only)
 * Deletion should NOT be restricted by plan
 */
router.delete(
  "/:id",
  ...adminOnly,
  limiter("sensitiveLimiter"),
  tableController.deleteTable
);

module.exports = router;
