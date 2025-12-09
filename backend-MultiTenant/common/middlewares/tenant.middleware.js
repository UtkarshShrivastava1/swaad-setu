// common/middlewares/tenant.middleware.js
const Admin = require("../../models/admin.model");
const logger = require("../libs/logger");

let tenants = [];

async function loadTenants() {
  try {
    const tenantData = await Admin.find(
      {},
      {
        restaurantId: 1,
        restaurantName: 1,
        ownerName: 1,
        phone: 1,
        createdAt: 1,
        // Include any other fields needed for tenant validation
      }
    ).lean();

    tenants = tenantData.map((t) => ({ ...t, tenantId: t.restaurantId }));
    logger.info(`Found and loaded ${tenants.length} tenants.`);
    return tenants;
  } catch (error) {
    logger.error("Failed to load tenants:", error);
    throw error;
  }
}

function getTenants() {
  return tenants;
}

function validateTenant(req, res, next) {
  const rid = req.params.rid;

  if (!rid) {
    return res
      .status(400)
      .json({ error: "Invalid or missing restaurant ID (rid)" });
  }

  const tenant = tenants.find((t) => t.restaurantId === rid);

  if (!tenant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }

  req.tenant = tenant;
  req.restaurantId = rid;
  next();
}

module.exports = {
  loadTenants,
  getTenants,
  validateTenant,
};
