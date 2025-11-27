/**
 * CENTRAL SUBSCRIPTION CONFIG — FINAL VERSION
 */

const SUBSCRIPTIONS = {
  FREE: {
    name: "Free Plan",
    price: 0,

    limits: {
      tables: 10,
      staff: 1,
      menuItems: 200,
    },

    features: {
      // Billing
      advancedBilling: false,
      splitBilling: false,
      multiPaymentModes: false,
      offersAndCoupons: true,
      // Analytics
      analyticsBasic: true,
      analyticsAdvanced: false,

      // Kitchen / Automation
      kds: false,
      whatsappAutomation: false,
      automation: false, // <— matches controller patches

      // Menu Features
      menuScheduling: false, // <— schedule-based visibility
      variants: false, // <— matches menu patches
      modifiers: false, // <— matches menu patches
      bulkEdit: false, // <— matches menu patches
      dynamicPricing: false, // <— matches menu patches
      dynamicComboPricing: false, // <— category-level combos
    },
  },

  STANDARD: {
    name: "Standard Plan",
    price: 999,

    limits: {
      tables: 25,
      staff: 5,
      menuItems: 1000,
    },

    features: {
      // Billing
      advancedBilling: true,
      splitBilling: true,
      multiPaymentModes: true,
      offersAndCoupons: true,

      // Analytics
      analyticsBasic: true,
      analyticsAdvanced: false,

      // Kitchen / Automation
      kds: true,
      whatsappAutomation: false,
      automation: false, // only PRO

      // Menu Features
      menuScheduling: true,
      variants: true,
      modifiers: true,
      bulkEdit: true,
      dynamicPricing: false, // only PRO
      dynamicComboPricing: false,
    },
  },

  PRO: {
    name: "Pro Plan",
    price: 1999,

    limits: {
      tables: 999,
      staff: 999,
      menuItems: Infinity,
    },

    features: {
      // Billing
      advancedBilling: true,
      splitBilling: true,
      multiPaymentModes: true,
      offersAndCoupons: true,

      // Analytics
      analyticsBasic: true,
      analyticsAdvanced: true,

      // Kitchen / Automation
      kds: true,
      whatsappAutomation: true,
      automation: true,

      // Menu Features
      menuScheduling: true,
      variants: true,
      modifiers: true,
      bulkEdit: true,
      dynamicPricing: true,
      dynamicComboPricing: true,
    },
  },
};

/* ------------------------------------------------------------------
   HELPERS
------------------------------------------------------------------ */

function getPlan(plan) {
  return SUBSCRIPTIONS[plan] || SUBSCRIPTIONS.FREE;
}

function getLimit(plan, key) {
  const p = getPlan(plan);
  return p?.limits?.[key];
}

function isFeatureAllowed(plan, feature) {
  const p = getPlan(plan);
  return p?.features?.[feature] === true;
}

function validateUpgrade(currentPlan, targetPlan, tenantSnapshot) {
  const current = getPlan(currentPlan);
  const target = getPlan(targetPlan);

  const errors = [];

  // tables
  if (tenantSnapshot.tables > target.limits.tables) {
    errors.push(
      `Tenant has ${tenantSnapshot.tables} tables, but ${targetPlan} allows only ${target.limits.tables}`
    );
  }

  // staff
  if (tenantSnapshot.staff > target.limits.staff) {
    errors.push(
      `Tenant has ${tenantSnapshot.staff} staff, but ${targetPlan} allows only ${target.limits.staff}`
    );
  }

  // menu items
  if (tenantSnapshot.menuItems > target.limits.menuItems) {
    errors.push(
      `Menu has ${tenantSnapshot.menuItems} items, but ${targetPlan} allows only ${target.limits.menuItems}`
    );
  }

  return {
    allowed: errors.length === 0,
    errors,
  };
}

module.exports = {
  SUBSCRIPTIONS,
  getPlan,
  getLimit,
  isFeatureAllowed,
  validateUpgrade,
};
