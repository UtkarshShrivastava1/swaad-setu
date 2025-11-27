#!/usr/bin/env node
// scripts/upsertMenu.js
// Usage: node scripts/upsertMenu.js

require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  try {
    const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/swadsetu";

    console.log("Connecting to:", MONGO);
    await mongoose.connect(MONGO, { serverSelectionTimeoutMS: 5000 });

    const Admin = require("./models/admin.model");

    const result = await Admin.updateOne(
      { restaurantId: "restro10" },
      {
        $set: {
          menu: {
            items: [
              {
                id: "m1",
                name: "Paneer Butter Masala",
                price: 250,
                description: "Rich tomato-cashew gravy",
              },
              {
                id: "m2",
                name: "Gulab Jamun",
                price: 80,
                description: "Sweet dumplings",
              },
            ],
          },
          categories: [
            { name: "Main Course", items: ["m1"] },
            { name: "Desserts", items: ["m2"] },
          ],
          taxes: [{ name: "GST", percent: 5 }],
          serviceCharge: 10,
          branding: { title: "Swad Setu" },
        },
      },
      { upsert: true }
    );

    console.log("✅ Menu upserted for restro10:", result);
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error("❌ Error:", e);
    process.exit(1);
  }
})();
