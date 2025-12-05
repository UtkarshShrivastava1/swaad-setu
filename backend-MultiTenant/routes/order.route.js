// routes/order.routes.js
// Unified Order Routes (multi-tenant, defensive imports, clean bill mounts)

const express = require("express");
const mongoose = require("mongoose");
const router = express.Router({ mergeParams: true });

// ------------------------------------------------------------
// Load ORDER controller only
// ------------------------------------------------------------
let orderController = {};
try {
  orderController = require("../controllers/order.controller");
  console.log("[order.routes] Loaded order.controller");
} catch (e) {
  console.error("[order.routes] Failed to load order.controller:", e);
  orderController = {};
}

// ------------------------------------------------------------
// Load ONLY required bill endpoints
// ------------------------------------------------------------
let billController = {};
try {
  const fullBill = require("../controllers/bill.controller");
  billController.getBillByOrderId = fullBill.getBillByOrderId;
  billController.getBillByOrderIdPublic = fullBill.getBillByOrderIdPublic;
  billController.createBillFromOrder = fullBill.createBillFromOrder;

  console.log("[order.routes] Loaded bill subset for orders");
} catch (e) {
  console.error("[order.routes] Failed to load bill subset:", e);
  billController = {
    getBillByOrderId: (req, res) =>
      res.status(500).json({ error: "Bill controller missing" }),
    getBillByOrderIdPublic: (req, res) =>
      res.status(500).json({ error: "Bill controller missing" }),
    createBillFromOrder: (req, res) =>
      res.status(500).json({ error: "Bill controller missing" }),
  };
}

// ------------------------------------------------------------
// Defensive middleware imports
// ------------------------------------------------------------
let authMiddleware = (req, res, next) => next();
let requireRole = () => (req, res, next) => next();
let rateLimit = {};
let validate = {};

try {
  const auth = require("../common/middlewares/auth.middleware");
  authMiddleware = auth.verifyToken || authMiddleware;
} catch {
  console.warn("[order.routes] auth.middleware missing → using no-op");
}

try {
  const role = require("../common/middlewares/role.middleware");
  requireRole = role.requireRole || requireRole;
} catch {
  console.warn("[order.routes] role.middleware missing → using no-op");
}

try {
  rateLimit = require("../common/middlewares/rateLimit.middleware") || {};
} catch {
  rateLimit = {};
}

try {
  validate = require("../common/middlewares/validate.middleware") || {};
} catch {
  validate = {};
}

// Rate limiter wrapper
function limiter(name) {
  if (!rateLimit[name]) return (req, res, next) => next();
  return (req, res, next) => {
    req.rateLimitTenantKey = req.params.rid;
    return rateLimit[name](req, res, next);
  };
}

// ------------------------------------------------------------
// Subscription middleware
// ------------------------------------------------------------
const {
  loadSubscription,
} = require("../common/middlewares/subscription.middleware");

// ------------------------------------------------------------
// Tenant guard
// ------------------------------------------------------------
router.use((req, res, next) => {
  if (!req.params?.rid) {
    return res.status(400).json({ error: "Missing restaurant id (rid)" });
  }
  delete req.body?.restaurantId;
  next();
});

// ------------------------------------------------------------
// Load subscription once
// ------------------------------------------------------------
router.use(loadSubscription);

// ------------------------------------------------------------
// Logger
// ------------------------------------------------------------
router.use((req, res, next) => {
  console.info("[order.routes]", req.method, req.originalUrl);
  next();
});

// =====================================================================
// 1️⃣ PUBLIC — Create customer order
// =====================================================================
router.post(
  "/",
  validate.stripRestaurantId || ((req, res, next) => next()),
  orderController.createOrder
);

// =====================================================================
// 2️⃣ STAFF/ADMIN — Manage orders
// =====================================================================
router.get(
  "/active",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("standardLimiter"),
  orderController.getActiveOrders
);

router.get(
  "/history",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("standardLimiter"),
  orderController.getOrderHistory
);

router.get(
  "/", // This route handles /api/:rid/orders?status=...
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("standardLimiter"),
  orderController.getOrderHistory
);

router.get(
  "/waiters",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("standardLimiter"),
  orderController.getOrderWaiters
);

router.get(
  "/table/:tableId",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("standardLimiter"),
  orderController.getOrdersByTable
);

// =====================================================================
// 3️⃣ BILL ENDPOINTS (ONLY THESE ALLOWED HERE)
// =====================================================================

// ✔ Get bill for an order
router.get(
  "/bill/:orderId",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("standardLimiter"),
  billController.getBillByOrderId
);

// ✔ Create bill from an order
router.post(
  "/:orderId/bill",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("standardLimiter"),
  billController.createBillFromOrder
);

// ✔ Public bill (QR scan)
router.get(
  "/public/bill/:orderId",
  limiter("standardLimiter"),
  billController.getBillByOrderIdPublic
);

// =====================================================================
// 4️⃣ Order updates
// =====================================================================
router.patch(
  "/:id/status",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("standardLimiter"),
  orderController.updateOrderStatus
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("sensitiveLimiter"),
  orderController.deleteOrderById
);

router.patch(
  "/:id",
  authMiddleware,
  requireRole(["staff", "admin"]),
  limiter("standardLimiter"),
  orderController.updateOrderFromBill
);

// =====================================================================
// 5️⃣ Public simple fetch
// =====================================================================
router.get("/:orderId", (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.orderId)) {
    return res.status(400).json({ error: "Invalid Order ID format" });
  }
  return orderController.getOrderById(req, res, next);
});

module.exports = router;
