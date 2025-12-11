// models/menu.model.js
// Unified Menu Model — supports standard menu + combo categories seamlessly.
// Hardened and future-proof, fully backward compatible.

const mongoose = require("mongoose");
const { Schema } = mongoose;

/* ------------------------------------------------------------------
   Menu Item Schema
   ------------------------------------------------------------------ */
const MenuItemSchema = new Schema({
  itemId: {
    type: String,
    
    index: true,
    // ✅ NOT required anymore (backend will auto-generate)
  },

  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true, default: 0 },
  currency: { type: String, default: "INR" },
  image: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  isVegetarian: { type: Boolean, default: false },
  preparationTime: { type: Number, default: null },
  metadata: { type: Schema.Types.Mixed, default: {} }, // extensible for tags, spiceLevel, etc.
});

/* ------------------------------------------------------------------
   Combo Metadata Schema (nested in category)
   ------------------------------------------------------------------ */
const ComboMetaSchema = new Schema(
  {
    originalPrice: { type: Number, default: 0 },
    discountedPrice: { type: Number, default: 0 },
    saveAmount: { type: Number, default: 0 },
    description: { type: String, default: "" },
    image: { type: String, default: null },
  },
  { _id: false }
);

/* ------------------------------------------------------------------
   Category Schema (supports normal + combo categories)
   ------------------------------------------------------------------ */
const MenuCategorySchema = new Schema({
  name: { type: String, required: true, trim: true },

  itemIds: { type: [String], default: [] }, // references MenuItem.itemId

  isMenuCombo: { type: Boolean, default: false },

  comboMeta: { type: ComboMetaSchema, default: () => ({}) },
});

/* ------------------------------------------------------------------
   Tax Schema
   ------------------------------------------------------------------ */
const TaxSchema = new Schema({
  name: { type: String, default: "GST" },
  percent: { type: Number, default: 0 },
});

/* ------------------------------------------------------------------
   Main Menu Schema
   ------------------------------------------------------------------ */
const MenuSchema = new Schema(
  {
    restaurantId: {
      type: String,
      required: true,
      // ⚠️ No unique constraint — allows versioned menus
    },

    version: { type: Number, required: true, default: 1 },
    isActive: { type: Boolean, default: true },
    title: { type: String, default: "" },

    // content
    items: { type: [MenuItemSchema], default: [] },
    categories: { type: [MenuCategorySchema], default: [] },

    // global config
    taxes: { type: [TaxSchema], default: [] },
    serviceCharge: { type: Number, default: 0 },
    branding: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

/* ------------------------------------------------------------------
   Indexes
   ------------------------------------------------------------------ */
MenuSchema.index({ restaurantId: 1, version: -1 });
MenuSchema.index({ restaurantId: 1, isActive: 1 });

// ✅ Unique business ID per restaurant (safe with backend-generated IDs)
MenuSchema.index(
  { restaurantId: 1, "items.itemId": 1 },
  {
    unique: true,
    // Use a partial index so only string itemId values are indexed.
    // This avoids duplicate-null problems and is compatible with older MongoDB versions.
    partialFilterExpression: { "items.itemId": { $type: "string" } },
  }
);

/* ------------------------------------------------------------------
   Pre-save Middleware — auto compute saveAmount for combos
   ------------------------------------------------------------------ */
MenuSchema.pre("save", function (next) {
  try {
    if (Array.isArray(this.categories)) {
      this.categories.forEach((cat) => {
        if (cat.isMenuCombo && cat.comboMeta) {
          const { originalPrice = 0, discountedPrice = 0 } = cat.comboMeta;
          cat.comboMeta.saveAmount = Math.max(
            originalPrice - discountedPrice,
            0
          );
        }
      });
    }
  } catch (err) {
    console.warn(
      "[MenuSchema.pre('save')] comboMeta auto-calc error:",
      err.message
    );
  }
  next();
});

/* ------------------------------------------------------------------
   Export Model
   ------------------------------------------------------------------ */
module.exports = mongoose.model("Menu", MenuSchema);
