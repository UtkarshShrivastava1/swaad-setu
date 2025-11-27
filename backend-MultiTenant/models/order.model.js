const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Order item snapshot schema
 */
const OrderItemSchema = new Schema({
  menuItemId: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: false, default: 0 },
  priceAtOrder: { type: Number, required: true, default: 0 },

  // ✅ Sequential order number (for day) — already exists for items
  OrderNumberForDay: {
    type: Number,
    required: true,
  },

  notes: { type: String, default: "" },
  status: {
    type: String,
    enum: [
      "placed",
      "accepted",
      "preparing",
      "done",
      "cancelled",
      "pending",
      "approved",
      "ready",
      "served",
    ],
    default: "placed",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

/**
 * Tax line snapshot used on orders/bills
 */
const TaxLineSnapshot = new Schema({
  name: { type: String, required: true },
  percent: { type: Number, required: true, min: 0 },
  code: { type: String, default: "" },
  amount: { type: Number, default: 0 },
});

/**
 * Main Order schema
 */
const OrderSchema = new Schema({
  restaurantId: { type: String, required: true },
  tableId: { type: String, required: true },
  sessionId: { type: String, required: true },

  items: { type: [OrderItemSchema], default: [] },

  // ✅ ADD THIS (root-level order number for easy querying)
  OrderNumberForDay: {
    type: Number,
    required: true,
  },

  // computed money fields
  subtotal: { type: Number, required: true, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  serviceChargeAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true, default: 0 },

  status: {
    type: String,
    enum: [
      "placed",
      "accepted",
      "preparing",
      "done",
      "cancelled",
      "pending",
      "approved",
      "ready",
      "served",
      "billed", // ✅ added
      "paid", // ✅ optional for clarity if ever needed
    ],
    default: "placed",
  },

  paymentStatus: {
    type: String,
    enum: ["unpaid", "partial", "paid"],
    default: "unpaid",
  },

  isCustomerOrder: { type: Boolean, default: true },
  customerName: { type: String, required: true },
  customerContact: { type: String },
  customerEmail: { type: String },
  isOrderComplete: { type: Boolean, default: false },

  staffAlias: { type: String, default: null },
  overrideToken: { type: String, default: null },

  appliedTaxes: { type: [TaxLineSnapshot], default: [] },
  appliedDiscountPercent: { type: Number, default: 0 },
  appliedServiceChargePercent: { type: Number, default: 0 },
  pricingConfigVersion: { type: Number, default: null },
  pricingConfigId: { type: Schema.Types.ObjectId, default: null },

  version: { type: Number, default: 1 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
OrderSchema.index({ restaurantId: 1, tableId: 1, status: 1 });
OrderSchema.index({ sessionId: 1 });
OrderSchema.index({ restaurantId: 1, createdAt: -1 });
OrderSchema.index({ restaurantId: 1, pricingConfigVersion: 1 });
OrderSchema.index({ restaurantId: 1, OrderNumberForDay: 1 }); // ✅ new useful index

/**
 * Middleware to update timestamps
 */
OrderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Order", OrderSchema);
