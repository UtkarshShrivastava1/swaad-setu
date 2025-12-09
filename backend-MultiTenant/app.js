// app.js — FINAL CLEAN MULTI-TENANT ROUTING
require("dotenv").config(); // ✅ MUST BE FIRST LINE
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// ---------------- ROUTES ----------------
const orderRoutes = require("./routes/order.route");
const tableRoutes = require("./routes/table.route");
const billRoutes = require("./routes/bill.route"); // Bill CRUD routes ONLY
const { handleCreateBill } = require("./routes/bill.route"); // Only createBillFromOrder
const callRoutes = require("./routes/call.route");
const adminRoutes = require("./routes/admin.route");
const tenantRoutes = require("./routes/tenant.route");
const geminiRoutes = require("./routes/gemini.route"); // <- adjust filename if needed

const {
  loadSubscription,
} = require("./common/middlewares/subscription.middleware");

const {
  validateRestaurant,
} = require("./common/middlewares/validate.middleware");

// Logger fallback
let logger = console;
try {
  logger = require("./common/libs/logger") || console;
} catch (e) {
  console.warn("[app.js] logger unavailable, using console.");
}

const app = express();

// ---------------- GLOBAL MIDDLEWARES ----------------
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
if (logger.middleware) app.use(logger.middleware);

// ---------------- HEALTH CHECK ----------------
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ------------------------------------------------------------
// 🔓 PUBLIC ROUTES (NO TENANT / NO AUTH REQUIRED)
// ------------------------------------------------------------
app.use("/api", tenantRoutes);
app.use("/api", geminiRoutes);
// ------------------------------------------------------------
// 🏢 TENANT VALIDATOR
// ------------------------------------------------------------
app.use("/api/:rid", validateRestaurant);

// ------------------------------------------------------------
// 📦 TENANT ROUTES (subscription loaded once per tenant)
// ------------------------------------------------------------
app.use("/api/:rid", loadSubscription);

// -------------------- ORDERS --------------------
app.use("/api/:rid/orders", orderRoutes);

// -------------------- BILL CREATION UNDER ORDERS --------------------
// /api/:rid/orders/:orderId/bill → CREATE BILL (ONLY HERE)
app.post("/api/:rid/orders/:orderId/bill", handleCreateBill);

// -------------------- TABLES --------------------
app.use("/api/:rid/tables", tableRoutes);

// -------------------- BILLS (CRUD / EDIT / FINALIZE) --------------------
app.use("/api/:rid/bills", billRoutes);

// -------------------- CALL REQUESTS --------------------
app.use("/api/:rid/calls", callRoutes);

// -------------------- ADMIN --------------------
app.use("/api/:rid/admin", adminRoutes);

// ------------------------------------------------------------
// ❌ 404 HANDLER
// ------------------------------------------------------------
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

// ------------------------------------------------------------
// ❗ ERROR HANDLER
// ------------------------------------------------------------
app.use((err, req, res, _next) => {
  logger.error(err.stack || err);
  res.status(err.status || 500).json({
    error: err.message || "Server error",
  });
});

module.exports = app;
