// models/combo.model.js
const mongoose = require("mongoose");

const comboSchema = new mongoose.Schema(
  {
    restaurantId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    itemsIncluded: [{ type: String, trim: true }],
    originalPrice: { type: Number, required: true },
    discountedPrice: { type: Number, required: true },
    image: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "combos" }
);

comboSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Combo", comboSchema);
