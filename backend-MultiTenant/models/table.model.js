// models/table.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const TableSchema = new Schema({
  restaurantId: { type: String, required: true },
  tableNumber: { type: Number, required: true }, // uniqueness enforced per-restaurant by index below
  capacity: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: ["available", "occupied"],
    default: "available",
  },
  isActive: { type: Boolean, default: true },
  CurrentOrderId: { type: String, default: null },
  // session info
  currentSessionId: { type: String, default: null },
  sessionExpiresAt: { type: Date, default: null }, // optional TTL for auto-expiry logic
  staffAlias: { type: String, default: null },
  lastUsed: { type: Date, default: Date.now },
  tableType: {
    type: String,
    enum: ["dine_in", "takeout"],
    default: "dine_in",
  },
  isSystem: { type: Boolean, default: false }, // System flag for special tables like takeout
  // soft-delete flag (optional but useful)
  isDeleted: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
// enforce tableNumber uniqueness per restaurant
TableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });
TableSchema.index({ restaurantId: 1, tableType: 1 }); // New index for querying tableType

// fast lookups
TableSchema.index({ restaurantId: 1, isActive: 1 });
TableSchema.index({ currentSessionId: 1 });

// Middleware to update timestamps
TableSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // Automatically set status based on session existence
  if (this.currentSessionId) {
    this.status = "occupied";
  } else {
    this.status = "available";
  }

  next();
});

module.exports = mongoose.model("Table", TableSchema);
