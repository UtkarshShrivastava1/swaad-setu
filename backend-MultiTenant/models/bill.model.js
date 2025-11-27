const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Bill item: controllers should normalize incoming shapes to this canonical form:
 *  { itemId, name, qty, price, priceAtOrder, modifiers:[], notes }
 */
const BillItemSchema = new Schema(
  {
    itemId: { type: String, required: true }, // menu item id / SKU (string for flexible ids)
    name: { type: String, required: true },
    qty: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true }, // price at billing time (duplicated for legacy)
    priceAtOrder: { type: Number, required: true, default: 0 }, // authoritative snapshot
    modifiers: [
      {
        id: String,
        name: String,
        priceDelta: Number,
      },
    ],
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const BillSchema = new Schema({
  restaurantId: { type: String, required: true },
  tableId: { type: String, required: true }, // ref to Table document
  tableNumber: { type: Number, default: null }, // ✅ numeric table number from Table model
  sessionId: { type: String, required: true },

  // optional relation to originating order (helpful for order-centric flows)
  orderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
  orderNumberForDay: { type: Number, default: null }, // ✅ order reference (daily sequence)

  // ✅ NEW — Customer details copied from originating order
  customerName: { type: String, default: null },
  customerContact: { type: String, default: null },
  customerEmail: { type: String, default: null },
  isCustomerOrder: { type: Boolean, default: false },
  // ✅ Discount and Service Charge (applied + legacy)
  appliedDiscountPercent: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 }, // used by legacy compute + fallback
  appliedServiceChargePercent: { type: Number, default: 0 },
  serviceChargePercent: { type: Number, default: 0 }, // used by legacy compute + fallback

  customerNotes: { type: String, default: null }, // optional (e.g. “less spicy”)

  items: { type: [BillItemSchema], default: [] },

  // extras normalized as { label: String, amount: Number }
  extras: { type: [{ label: String, amount: Number }], default: [] },

  subtotal: { type: Number, required: true, default: 0 },

  // Taxes array: name, rate (percent), amount (calculated)
  taxes: [
    {
      name: String,
      rate: Number,
      amount: Number,
    },
  ],
  taxAmount: { type: Number, default: 0 }, // total tax amount

  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },

  // canonical naming for service charge (controllers must set serviceChargeAmount)
  serviceChargeAmount: { type: Number, default: 0 },

  totalAmount: { type: Number, required: true, default: 0 },

  // lifecycle
  status: {
    type: String,
    enum: ["draft", "finalized", "paid", "cancelled"],
    default: "draft",
  },

  audit: [{ by: String, action: String, delta: Object, at: Date }],

  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid",
  },

  staffAlias: { type: String, default: "waiter" },
  finalizedByAlias: { type: String, default: "waiter" },
  finalizedAt: { type: Date, default: null },
  paymentMarkedBy: { type: String, default: "waiter" },
  paidAt: { type: Date, default: null },

  adminReopened: {
    by: String,
    reason: String,
    at: Date,
  },

  overrideToken: { type: String, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ Indexes for fast querying
BillSchema.index({ restaurantId: 1, tableId: 1 });
BillSchema.index({ restaurantId: 1, orderNumberForDay: 1 });
BillSchema.index({ sessionId: 1 });
BillSchema.index({ restaurantId: 1, orderId: 1 }, { unique: true });

// auto update updatedAt timestamp
BillSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Bill", BillSchema);
