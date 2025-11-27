const express = require("express");
const router = express.Router({ mergeParams: true });

/* =====================================================
   LOAD CONTROLLER
===================================================== */
let billController = {};
try {
  billController = require("../controllers/bill.controller");
  console.log("[bill.route] bill.controller loaded");
} catch (e) {
  console.error("[bill.route] FAILED to load bill.controller:", e);
  billController = {};
}

/* =====================================================
   AUTH & ROLE MIDDLEWARES
===================================================== */
let authMiddleware = (req, res, next) => next();
let requireRole = () => (req, res, next) => next();

try {
  const m = require("../common/middlewares/auth.middleware");
  authMiddleware = m.verifyToken || authMiddleware;
} catch {}

try {
  const m = require("../common/middlewares/role.middleware");
  requireRole = m.requireRole || requireRole;
} catch {}

let validate = {};
let rateLimit = {};

try {
  validate = require("../common/middlewares/validate.middleware") || {};
} catch {}

try {
  rateLimit = require("../common/middlewares/rateLimit.middleware") || {};
} catch {}

function limiter(name) {
  return rateLimit?.[name] || ((req, res, next) => next());
}

/* =====================================================
   SUBSCRIPTION MIDDLEWARE
===================================================== */
const {
  loadSubscription,
  requireFeature,
} = require("../common/middlewares/subscription.middleware");

/* =====================================================
   TENANT GUARD
===================================================== */
router.use((req, res, next) => {
  const rid = req.params.rid;
  if (!rid) return res.status(400).json({ error: "Missing restaurant id" });

  if (req.body?.restaurantId) delete req.body.restaurantId;
  next();
});

router.use(loadSubscription);

/* =====================================================
   LOGGING
===================================================== */
router.use((req, res, next) => {
  console.info("[bill.route]", req.method, req.originalUrl);
  next();
});

/* =====================================================
   ROUTES (🚀 IMPORTANT ORDERING)
===================================================== */

/* ===============================
   ✔ BILL HISTORY  (must come FIRST)
=============================== */
router.get(
  "/history",
  limiter("standardLimiter"),
  authMiddleware,
  requireRole(["staff", "admin"]),
  billController.getBillsHistory
);

/* ===============================
   ✔ ACTIVE BILLS
=============================== */
router.get(
  "/active",
  limiter("standardLimiter"),
  authMiddleware,
  requireRole(["staff", "admin"]),
  billController.getActiveBills
);

/* ===============================
   ✔ CREATE BILL MANUALLY
=============================== */
router.post(
  "/",
  limiter("sensitiveLimiter"),
  authMiddleware,
  requireRole("admin"),
  validate.createBillManual || ((req, res, next) => next()),
  billController.createBillManual
);

/* ===============================
   ✔ GET BILL BY ID (AFTER history)
=============================== */
router.get(
  "/:id",
  limiter("standardLimiter"),
  authMiddleware,
  requireRole(["staff", "admin"]),
  billController.getBillById
);

/* ===============================
   ✔ UPDATE BILL DRAFT
=============================== */
router.patch(
  "/:id",
  limiter("standardLimiter"),
  authMiddleware,
  requireRole(["staff", "admin"]),
  validate.updateBillDraft || ((req, res, next) => next()),
  billController.updateBillDraft
);

/* ===============================
   ✔ FINALIZE
=============================== */
router.post(
  "/:id/finalize",
  limiter("sensitiveLimiter"),
  authMiddleware,
  requireRole(["staff", "admin"]),
  billController.finalizeBill
);

/* ===============================
   ✔ MARK PAID
=============================== */
router.post(
  "/:id/mark-paid",
  limiter("sensitiveLimiter"),
  authMiddleware,
  requireRole(["staff", "admin"]),
  billController.markBillPaid
);

/* ===============================
   ✔ INCREMENT / DECREMENT
=============================== */
router.post(
  "/:id/items/:itemId/increment",
  limiter("standardLimiter"),
  authMiddleware,
  requireRole(["staff", "admin"]),
  validate.stripRestaurantId || ((req, res, next) => next()),
  billController.incrementBillItem
);

router.post(
  "/:id/items/:itemId/decrement",
  limiter("standardLimiter"),
  authMiddleware,
  requireRole(["staff", "admin"]),
  validate.stripRestaurantId || ((req, res, next) => next()),
  billController.decrementBillItem
);

/* =====================================================
   EXPORT
===================================================== */
module.exports = router;

module.exports.handleCreateBill =
  billController.createBillFromOrder ||
  ((req, res) =>
    res.status(500).json({ error: "createBillFromOrder missing" }));
