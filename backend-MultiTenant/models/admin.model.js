const mongoose = require("mongoose");
const { Schema } = mongoose;

/* ----------------------------------------------------------
   Override Token (temporary manager override)
---------------------------------------------------------- */
const OverrideTokenSchema = new Schema({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

/* ----------------------------------------------------------
   Tax Line (GST / VAT entries)
---------------------------------------------------------- */
const TaxLineSchema = new Schema({
  name: { type: String, required: true },
  percent: { type: Number, required: true, min: 0 },
  code: { type: String, default: "" },
  inclusive: { type: Boolean, default: false },
});

/* ----------------------------------------------------------
   Offers / Promo Codes
---------------------------------------------------------- */
const OfferSchema = new Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },

    discountType: {
      type: String,
      enum: ["flat", "percent"],
      default: "percent",
    },

    discountValue: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0 },
    maxDiscountValue: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
    validFrom: { type: Date, default: Date.now },
    validTill: { type: Date, default: null },
  },
  { _id: false }
);

/* ----------------------------------------------------------
   UPI Settings Schema
---------------------------------------------------------- */
const UPISettingsSchema = new Schema({
  UPI_ID: { type: String, trim: true, default: null },
  UPI_NAME: { type: String, trim: true, default: null },
  UPI_CURRENCY: { type: String, default: 'INR' },
}, { _id: false });

/* ----------------------------------------------------------
   Pricing config versions
---------------------------------------------------------- */
const PricingConfigSchema = new Schema({
  version: { type: Number, required: true },
  active: { type: Boolean, default: false },
  effectiveFrom: { type: Date, default: null },

  globalDiscountPercent: { type: Number, default: 0, min: 0 },
  serviceChargePercent: { type: Number, default: 0, min: 0 },

  taxes: { type: [TaxLineSchema], default: [] },

  createdBy: { type: String, default: "system" },
  reason: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },

  offers: { type: [OfferSchema], default: [] },
});

/* ----------------------------------------------------------
   Subscription System (FREE / STANDARD / PRO)
---------------------------------------------------------- */
const SubscriptionSchema = new Schema(
  {
    plan: {
      type: String,
      enum: ["FREE", "STANDARD", "PRO"],
      default: "FREE",
    },

    limits: {
      tables: { type: Number, required: true, default: 10 },
      staff: { type: Number, required: true, default: 1 },
      menuItems: { type: Number, required: true, default: 200 },
    },

    features: {
      // Billing Features
      advancedBilling: { type: Boolean, default: false },
      splitBilling: { type: Boolean, default: false },
      multiPaymentModes: { type: Boolean, default: false },
      offersAndCoupons: { type: Boolean, default: false },

      // Analytics Features
      analyticsBasic: { type: Boolean, default: true },
      analyticsAdvanced: { type: Boolean, default: false },

      // Kitchen / Automation Features
      kds: { type: Boolean, default: false },
      whatsappAutomation: { type: Boolean, default: false },
      automation: { type: Boolean, default: false },

      // Menu Features
      menuScheduling: { type: Boolean, default: false },
      variants: { type: Boolean, default: false },
      modifiers: { type: Boolean, default: false },
      bulkEdit: { type: Boolean, default: false },
      dynamicPricing: { type: Boolean, default: false },
      dynamicComboPricing: { type: Boolean, default: false },
    },

    expiry: { type: Date, default: null }, // future usage
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ----------------------------------------------------------
   MAIN Admin / Tenant Schema
---------------------------------------------------------- */
const AdminSchema = new Schema({
  /* ---------------------
        TENANT IDENTIFIERS
  ----------------------*/
  restaurantId: { type: String, required: true, unique: true },

  /* ---------------------
        BUSINESS INFO
  ----------------------*/
  restaurantName: { type: String, default: null },
  ownerName: { type: String, default: null },
  phone: { type: String, default: null },
  email: { type: String, default: null },
  fssaiNumber: { type: String, default: null, maxlength: 14, minlength: 14 },
  gstNumber: { type: String, default: null, maxlength: 15, minlength: 15 },

  address: {
    street: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    zip: { type: String, default: null },
    country: { type: String, default: null },
  },

  UPISettings: { type: UPISettingsSchema, default: () => ({}) },

  /* ---------------------
        AUTH SYSTEM
  ----------------------*/
  hashedPin: { type: String, required: true }, // Admin login PIN
  staffHashedPin: { type: String, default: "" }, // Shared staff login PIN

  /* ---------------------
       STAFF & OPERATIONS
  ----------------------*/
  staffAliases: { type: [String], default: [] },
  waiterNames: { type: [String], default: [] },

  overrideTokens: { type: [OverrideTokenSchema], default: [] },

  /* ---------------------
         PRICING ENGINE
  ----------------------*/
  pricingConfigs: { type: [PricingConfigSchema], default: [] },

  /* ---------------------
         SUBSCRIPTION
  ----------------------*/
  subscription: { type: SubscriptionSchema, default: () => ({}) },

  /* ---------------------
         TIMESTAMPS
  ----------------------*/
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

/* ----------------------------------------------------------
   Auto update timestamps
---------------------------------------------------------- */
AdminSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

/* ----------------------------------------------------------
   INSTANCE — Get Active Pricing Config
---------------------------------------------------------- */
AdminSchema.methods.getActivePricingConfig = function () {
  if (!Array.isArray(this.pricingConfigs) || this.pricingConfigs.length === 0)
    return null;

  const active = this.pricingConfigs.find((c) => c.active);
  if (active) return active;

  return this.pricingConfigs.reduce((best, cur) =>
    !best || cur.version > best.version ? cur : best
  );
};

/* ----------------------------------------------------------
   STATIC — Add a pricing config version
---------------------------------------------------------- */
AdminSchema.statics.addPricingConfig = async function (restaurantId, cfg = {}) {
  const doc = await this.findOne({ restaurantId });
  if (!doc)
    throw new Error("Admin config not found for restaurantId: " + restaurantId);

  const lastVersion = doc.pricingConfigs.length
    ? Math.max(...doc.pricingConfigs.map((c) => c.version || 0))
    : 0;

  const nextVersion = lastVersion + 1;

  const newCfg = {
    version: nextVersion,
    active: !!cfg.activate,
    effectiveFrom: cfg.effectiveFrom || null,

    globalDiscountPercent: Number(cfg.globalDiscountPercent || 0),
    serviceChargePercent: Number(cfg.serviceChargePercent || 0),

    taxes: Array.isArray(cfg.taxes)
      ? cfg.taxes.map((t) => ({
          name: t.name,
          percent: Number(t.percent || 0),
          code: t.code || "",
          inclusive: !!t.inclusive,
        }))
      : [],

    createdBy: cfg.createdBy || "system",
    reason: cfg.reason || "",
    createdAt: new Date(),

    offers: Array.isArray(cfg.offers)
      ? cfg.offers.map((offer) => ({
          code: (offer.code || "").toUpperCase().trim(),
          title: offer.title || "",
          description: offer.description || "",
          discountType: offer.discountType === "flat" ? "flat" : "percent",
          discountValue: Number(offer.discountValue || 0),
          minOrderValue: Number(offer.minOrderValue || 0),
          maxDiscountValue: Number(offer.maxDiscountValue || 0),
          isActive: typeof offer.isActive === "boolean" ? offer.isActive : true,
          validFrom: offer.validFrom || new Date(),
          validTill: offer.validTill || null,
        }))
      : [],
  };

  // If new config is active → deactivate old configs
  if (newCfg.active) {
    doc.pricingConfigs = doc.pricingConfigs.map((c) => ({
      ...c.toObject(),
      active: false,
    }));
  }

  doc.pricingConfigs.push(newCfg);
  await doc.save();

  return doc;
};

/* ----------------------------------------------------------
   STATIC — Activate a specific pricing version
---------------------------------------------------------- */
AdminSchema.statics.activatePricingVersion = async function (
  restaurantId,
  version
) {
  const doc = await this.findOne({ restaurantId });
  if (!doc)
    throw new Error("Admin config not found for restaurantId: " + restaurantId);

  let found = false;

  doc.pricingConfigs = doc.pricingConfigs.map((c) => {
    if (c.version === version) {
      found = true;
      c.active = true;
    } else {
      c.active = false;
    }
    return c;
  });

  if (!found) throw new Error("Pricing config version not found: " + version);

  await doc.save();
  return doc;
};

/* ----------------------------------------------------------
   EXPORT MODEL
---------------------------------------------------------- */
module.exports = mongoose.model("Admin", AdminSchema);
