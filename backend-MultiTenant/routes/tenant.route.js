const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenant.controller");

router.post("/tenants/register", tenantController.registerRestaurant);
router.get("/restaurants/:rid", tenantController.getRestaurantByRid);

module.exports = router;
