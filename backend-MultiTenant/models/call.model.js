// models/call.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const CallSchema = new Schema({
  restaurantId: { type: String, required: true },
  tableId: { type: String, required: true },
  sessionId: { type: String, required: true },
  orderId: { type: String },
  type: {
    type: String,
    enum: ["staff", "bill", "help", "custom"],
    required: true,
  },
  notes: { type: String },
  status: {
    type: String,
    enum: ["active", "resolved"],
    default: "active",
  },
  staffAlias: { type: String },
  customerName: { type: String },
  customerContact: { type: String },
  resolvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
CallSchema.index({ restaurantId: 1, tableId: 1, status: 1 });

// Middleware to auto-update timestamps
CallSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Call", CallSchema);
