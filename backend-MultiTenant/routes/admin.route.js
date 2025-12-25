// routes/admin.route.js
const express = require("express");
const router = express.Router({ mergeParams: true });
const adminController = require("../controllers/admin.controller");
const tenantController = require("../controllers/tenant.controller");
const upload = require("../common/middlewares/upload.middleware");
const {
  enforceLimit,
} = require("../common/middlewares/subscription.middleware");
const Menu = require("../models/menu.model");
// -----------------------------------------------------------
// Auth / Role Middlewares
// -----------------------------------------------------------
const authMiddleware = require("../common/middlewares/auth.middleware");
const requireRole = require("../common/middlewares/role.middleware");

// -----------------------------------------------------------
// 🆕 Subscription Middlewares
// -----------------------------------------------------------
const {
  loadSubscription,
  requirePlan, // Enforce minimum plan level (STANDARD / PRO)
  requireFeature, // Enforce specific features (exports, offers, analytics)
} = require("../common/middlewares/subscription.middleware");

// -----------------------------------------------------------
// Optional middlewares
// -----------------------------------------------------------
let rateLimit = null;
let validate = null;

try {
  rateLimit = require("../common/middlewares/rateLimit.middleware");
} catch {
  console.warn("rateLimit.middleware missing – limiting disabled.");
  rateLimit = {};
}

try {
  validate = require("../common/middlewares/validate.middleware");
} catch {
  console.warn("validate.middleware missing – validation disabled.");
  validate = {};
}

// Helper: tenant-aware limiter
function limiter(name) {
  if (!rateLimit || !rateLimit[name]) return (req, res, next) => next();
  return (req, res, next) => {
    req.rateLimitTenantKey = req.params.rid;
    return rateLimit[name](req, res, next);
  };
}

// -----------------------------------------------------------
// 🔐 TENANT VALIDATION (MANDATORY)
// -----------------------------------------------------------
router.use((req, res, next) => {
  const rid = req.params?.rid;

  if (!rid || !rid.trim()) {
    return res
      .status(400)
      .json({ error: "Missing or invalid restaurant id (rid)" });
  }

  if (req.body?.restaurantId) delete req.body.restaurantId;

  next();
});

// -----------------------------------------------------------
// 🆕 LOAD SUBSCRIPTION FOR ALL ADMIN ROUTES
// -----------------------------------------------------------
router.use(loadSubscription);

// -----------------------------------------------------------
// 🧾 REQUEST LOGGER
// -----------------------------------------------------------
router.use((req, res, next) => {
  const now = new Date().toISOString();
  console.info(`[${now}] [admin.route]`, {
    method: req.method,
    path: req.originalUrl,
    rid: req.params.rid,
    reqId: req.header("x-request-id") || null,
  });
  next();
});

// -----------------------------------------------------------
// 🟢 PUBLIC ROUTES (tenant-aware)
// -----------------------------------------------------------

// Admin login
router.post(
  "/login",
  limiter("sensitiveLimiter"),
  (req, res, next) => {
    req.body.restaurantId = req.params.rid;
    next();
  },
  adminController.login
);

// Staff login
router.post(
  "/auth/staff-login",
  limiter("staffLimiter"),
  (req, res, next) => {
    req.body.restaurantId = req.params.rid;
    next();
  },
  adminController.staffLogin
);

// Customer menu
router.get("/menu", adminController.getMenu);

// Generate override token (FREE for all)
router.post(
  "/overrides",
  limiter("sensitiveLimiter"),
  (req, res, next) => {
    req.body.restaurantId = req.params.rid;
    next();
  },
  adminController.generateOverrideToken
);

// -----------------------------------------------------------
// 🔒 PROTECTED ROUTES
// -----------------------------------------------------------

// -----------------------------------------------------------
// ⚖ PRICING CONFIG (STANDARD & PRO only)
// -----------------------------------------------------------
router.get(
  "/pricing",
  authMiddleware,
  requireRole("admin"),
  requirePlan("STANDARD"), // FREE users cannot manage pricing configs
  adminController.getPricingConfigs
);

router.post(
  "/pricing",
  authMiddleware,
  requireRole("admin"),
  requirePlan("FREE"),
  limiter("sensitiveLimiter"),
  adminController.createPricingConfig
);

router.patch(
  "/pricing/:version/activate",
  authMiddleware,
  requireRole("admin"),
  requirePlan("FREE"),
  limiter("sensitiveLimiter"),
  adminController.activatePricingVersion
);

router.get(
  "/pricing/active",
  authMiddleware,
  requireRole("admin"),
  tenantController.getPricingConfig
);

// -----------------------------------------------------------
// 🧾 MENU MANAGEMENT (mostly FREE)
// -----------------------------------------------------------

// -----------------------------------------------------------
// 🧾 MENU MANAGEMENT
// -----------------------------------------------------------

// ✔ FREE: Basic menu structure update
// 🔒 STANDARD+ if menuScheduling is used
router.post(
  "/menu",
  authMiddleware,
  requireRole("admin"),
  adminController.updateMenu
);

// 🔒 LIMITED BY PLAN (max menu items)
router.post(
  "/menu/items",
  authMiddleware,
  requireRole("admin"),
  upload.single('image'),
  enforceLimit("menuItems", (rid) =>
    Menu.countDocuments({ restaurantId: rid })
  ),
  adminController.addMenuItem
);

// 🔒 STANDARD+ for variants/modifiers features
router.patch(
  "/menu/items/:itemId",
  authMiddleware,
  requireRole("admin"),
  upload.single('image'),
  adminController.updateMenuItem
);

// 🔒 STANDARD+ Advanced menu item features
router.patch(
  "/menu/items/:itemId/variants",
  authMiddleware,
  requireRole("admin"),
  requireFeature("variants"), // 🔒 Variants feature required
  adminController.updateMenuItem
);

router.patch(
  "/menu/items/:itemId/modifiers",
  authMiddleware,
  requireRole("admin"),
  requireFeature("modifiers"), // 🔒 Modifiers feature required
  adminController.updateMenuItem
);

// ✔ FREE
router.delete(
  "/menu/items/:itemId",
  authMiddleware,
  requireRole("admin"),
  adminController.deleteMenuItem
);

// ✔ FREE
router.patch(
  "/menu/items/:itemId/restore",
  authMiddleware,
  requireRole("admin"),
  adminController.restoreMenuItem
);

// ✔ FREE
router.patch(
  "/menu/categories/:categoryId",
  authMiddleware,
  requireRole("admin"),
  adminController.updateCategory
);

// ✔ FREE
router.delete(
  "/menu/categories/:categoryId",
  authMiddleware,
  requireRole("admin"),
  adminController.deleteCategory
);

// ✔ FREE
router.get("/menu/categories", adminController.getAllCategories);

// ✔ FREE
router.post(
  "/menu/categories",
  authMiddleware,
  requireRole("admin"),
  adminController.addCategory
);

// -----------------------------------------------------------
// 📢 ANNOUNCEMENTS (FREE)
// -----------------------------------------------------------
router.post(
  "/announcements",
  authMiddleware,
  requireRole("admin"),
  adminController.createAnnouncement
);

// -----------------------------------------------------------
// 📊 ANALYTICS (STANDARD + PRO)
// -----------------------------------------------------------
router.get(
  "/analytics",
  authMiddleware,
  requireRole("admin"),
  requirePlan("STANDARD"), // FREE plan has no analytics
  adminController.getAnalytics
);

// -----------------------------------------------------------
// 📤 EXPORT REPORTS (STANDARD + PRO)
// -----------------------------------------------------------
router.post(
  "/export",
  authMiddleware,
  requireRole("admin"),
  requireFeature("exports"), // feature-based block
  adminController.exportReport
);

// -----------------------------------------------------------
// 🪑 TABLE MANAGEMENT (FREE)
// -----------------------------------------------------------
router.patch(
  "/tables/:id",
  authMiddleware,
  requireRole("admin"),
  adminController.updateTable
);

// -----------------------------------------------------------
// 🔐 PIN + STAFF MANAGEMENT (FREE)
// -----------------------------------------------------------
router.patch(
  "/pin",
  authMiddleware,
  requireRole("admin"),
  limiter("sensitiveLimiter"),
  adminController.updateAdminPin
);

//staff pin update (FREE)
router.patch(
  "/staff-pin",
  authMiddleware,
  requireRole("admin"),
  limiter("sensitiveLimiter"),
  adminController.updateStaffPin
);

router.patch(
  "/staff-aliases",
  authMiddleware,
  requireRole("admin"),
  enforceLimit("staff", (rid) =>
    Admin.findOne({ restaurantId: rid }).then((a) => a.staffAliases.length)
  ),
  adminController.updateStaffAliases
);

// -----------------------------------------------------------
// ⚙ GLOBAL CONFIG (FREE)
// -----------------------------------------------------------
router.patch(
  "/config",
  authMiddleware,
  requireRole("admin"),
  adminController.updateConfig
);

// -----------------------------------------------------------
// 💳 BILL OVERRIDE (FREE)
// -----------------------------------------------------------
router.post(
  "/bills/:billId/reopen",
  authMiddleware,
  requireRole("admin"),
  adminController.reopenBill
);

// -----------------------------------------------------------
// 👨‍🍳 WAITER MANAGEMENT (FREE)
// -----------------------------------------------------------
const safeHandler = (handler, fallback) => {
  if (handler && typeof handler === 'function') return handler;
  return fallback || ((req, res) => res.status(501).json({ error: "Not Implemented" }));
};

/* ============================================================
   GET: admin + staff
   ============================================================ */
router.get(
  "/waiters",
  authMiddleware,
  (req, res, next) => {
    if (req.user?.role === "admin" || req.user?.role === "staff") {
      return next();
    }
    return res.status(403).json({ error: "Forbidden" });
  },
  safeHandler(adminController.getWaiterNames, async (req, res, next) => {
    try {
      const Admin = require("../models/admin.model");
      const admin = await Admin.findOne({
        restaurantId: req.params.rid,
      }).lean();

      if (!admin)
        return res.status(404).json({ error: "Admin config not found" });

      return res.json({ waiterNames: admin.waiterNames || [] });
    } catch (err) {
      next(err);
    }
  })
);

/* ============================================================
   POST: admin only
   ============================================================ */
router.post(
  "/waiters",
  authMiddleware,
  (req, res, next) => {
    if (req.user?.role === "admin") return next();
    return res.status(403).json({ error: "Forbidden" });
  },
  limiter("sensitiveLimiter"),
  validate.addWaiterName || ((req, res, next) => next()),
  safeHandler(adminController.addWaiterName)
);

/* ============================================================
   PATCH: admin + staff
   ============================================================ */
router.patch(
  "/waiters",
  authMiddleware,
  (req, res, next) => {
    if (req.user?.role === "admin" || req.user?.role === "staff") {
      return next();
    }
    return res.status(403).json({ error: "Forbidden" });
  },
  limiter("sensitiveLimiter"),
  validate.updateWaiterName || ((req, res, next) => next()),
  safeHandler(adminController.updateWaiterName)
);

/* ============================================================
   DELETE: admin only
   ============================================================ */
router.delete(
  "/waiters",
  authMiddleware,
  (req, res, next) => {
    if (req.user?.role === "admin") return next();
    return res.status(403).json({ error: "Forbidden" });
  },
  limiter("sensitiveLimiter"),
  validate.deleteWaiterName || ((req, res, next) => next()),
  safeHandler(adminController.deleteWaiterName)
);

// -----------------------------------------------------------
// 🆕 SUBSCRIPTION MANAGEMENT (FREE)
router.get(
  "/subscription/status",
  authMiddleware,
  requireRole("admin"),
  adminController.getSubscriptionStatus
);

router.post(
  "/subscription/upgrade",
  authMiddleware,
  requireRole("admin"),
  adminController.upgradeSubscription
);

// -----------------------------------------------------------
// EXPORT
// -----------------------------------------------------------
module.exports = router;
