// common/middlewares/subscription.middleware.js

const Admin = require("../../models/admin.model");
const {
  getPlan,
  getLimit,
  isFeatureAllowed,
} = require("../../config/subscriptions");

/**
 * Load tenant subscription into req.subscription
 */
async function loadSubscription(req, res, next) {
  try {
    const rid = req.params?.rid;
    if (!rid) {
      return res.status(400).json({ error: "Missing restaurant ID (rid)" });
    }

    const admin = await Admin.findOne(
      { restaurantId: rid },
      { subscription: 1 }
    ).lean();

    const plan = admin?.subscription?.plan || "FREE";

    req.subscription = {
      plan,
      definition: getPlan(plan),
    };

    return next();
  } catch (error) {
    console.error("loadSubscription error:", error);
    return res.status(500).json({ error: "Subscription lookup failed" });
  }
}

/**
 * Enforce that the current tenant has a specific plan or higher
 */
function requirePlan(minPlan) {
  const planRank = { FREE: 1, STANDARD: 2, PRO: 3 };

  return (req, res, next) => {
    const current = req.subscription?.plan || "FREE";

    if (planRank[current] < planRank[minPlan]) {
      return res.status(403).json({
        error: `This action requires the ${minPlan} plan`,
        upgrade: true,
        currentPlan: current,
      });
    }

    next();
  };
}

/**
 * Enforce feature-based access (PRO/STD/FREE)
 */
function requireFeature(featureKey) {
  return (req, res, next) => {
    const plan = req.subscription?.plan || "FREE";

    if (!isFeatureAllowed(plan, featureKey)) {
      return res.status(403).json({
        error: `The feature "${featureKey}" is not available in your current plan`,
        upgrade: true,
        requiredFeature: featureKey,
        currentPlan: plan,
      });
    }

    next();
  };
}

/**
 * Enforce numerical limit such as:
 * - tables
 * - staff
 * - menu-items
 */
function enforceLimit(limitKey, tenantCountFn) {
  return async (req, res, next) => {
    try {
      const rid = req.params?.rid;
      const plan = req.subscription?.plan || "FREE";
      const allowed = getLimit(plan, limitKey);

      // Count tenant items runtime
      const current = await tenantCountFn(rid);

      if (current >= allowed) {
        return res.status(403).json({
          error: `Limit exceeded: ${current}/${allowed} ${limitKey}. Upgrade your plan.`,
          upgrade: true,
          limitKey,
          allowed,
        });
      }

      next();
    } catch (error) {
      console.error("enforceLimit error:", error);
      return res
        .status(500)
        .json({ error: "Failed to check subscription limit" });
    }
  };
}

module.exports = {
  loadSubscription,
  requirePlan,
  requireFeature,
  enforceLimit,
};
