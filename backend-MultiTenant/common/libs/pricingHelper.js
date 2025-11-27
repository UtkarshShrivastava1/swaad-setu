/**
 * Multi-tenant Pricing Configuration Fetcher
 *
 * Priority:
 *  1. Active PricingConfig from Admin (latest activated version)
 *  2. Legacy admin.settings fallback (only if old data exists)
 *  3. Default safe values
 */

async function getPricingConfig(rid) {
  const Admin = require("../../models/admin.model");

  try {
    const adminDoc = await Admin.findOne(
      { restaurantId: rid },
      {
        pricingConfigs: 1,
        settings: 1, // legacy fallback
      }
    ).lean();

    // ----------------------------
    // 1️⃣ Modern PricingConfig system
    // ----------------------------
    if (adminDoc?.pricingConfigs?.length > 0) {
      // pick last activated version
      const activeConfig = [...adminDoc.pricingConfigs]
        .reverse()
        .find((cfg) => cfg.activate === true);

      if (activeConfig) {
        return {
          taxes: activeConfig.taxes || [],
          serviceCharge: activeConfig.serviceChargePercent || 0,
          globalDiscountPercent: activeConfig.globalDiscountPercent || 0,
        };
      }
    }

    // ----------------------------
    // 2️⃣ Legacy fallback (old systems)
    // ----------------------------
    if (adminDoc?.settings) {
      return {
        taxes: [
          {
            name: "Tax",
            percent: adminDoc.settings.taxPercent || 0,
          },
        ],
        serviceCharge: adminDoc.settings.serviceCharge || 0,
        globalDiscountPercent: adminDoc.settings.globalDiscountPercent || 0,
      };
    }
  } catch (err) {
    console.error("[getPricingConfig] Admin lookup error:", err);
  }

  // ----------------------------
  // 3️⃣ Safe fallback
  // ----------------------------
  return {
    taxes: [],
    serviceCharge: 0,
    globalDiscountPercent: 0,
  };
}

module.exports = { getPricingConfig };
