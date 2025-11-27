// debug-getmenu.js
require("dotenv").config();
(async () => {
  const mongoose = require("mongoose");
  const MONGO = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/swadsetu";
  console.log("Connecting to", MONGO);
  await mongoose.connect(MONGO, { serverSelectionTimeoutMS: 5000 });
  const Admin = require("./models/admin.model");
  const admin = await Admin.findOne({ restaurantId: "restro10" }).lean();
  console.log("Found admin keys:", admin ? Object.keys(admin) : "NOT FOUND");
  console.log("menu present?", !!(admin && admin.menu));
  if (admin && admin.menu)
    console.log("menu preview:", JSON.stringify(admin.menu).slice(0, 500));
  await mongoose.disconnect();
  process.exit(0);
})();
