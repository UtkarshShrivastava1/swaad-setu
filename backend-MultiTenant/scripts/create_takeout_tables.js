#!/usr/bin/env node

/**
 * Script to create a dedicated "takeout" table for each restaurant that doesn't already have one.
 * This script is idempotent and can be run multiple times without creating duplicate takeout tables.
 * Usage: node scripts/create_takeout_tables.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/admin.model");
const Table = require("../models/table.model");
const config = require("../config"); // Assuming you have a config file for DB connection

async function createTakeoutTables() {
  console.log("🚀 Starting script to create takeout tables...");

  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongo.uri, config.mongo.options);
    console.log("✅ MongoDB connected successfully.");

    // Fetch all unique restaurant IDs from the Admin model
    const restaurants = await Admin.find({}, "restaurantId").lean();

    if (restaurants.length === 0) {
      console.log("🤷 No restaurants found in the database. Exiting.");
      await mongoose.disconnect();
      return;
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const restaurant of restaurants) {
      const restaurantId = restaurant.restaurantId;
      console.log(`✨ Processing restaurant: ${restaurantId}`);

      // Check if a takeout table already exists for this restaurant
      const existingTakeoutTable = await Table.findOne({
        restaurantId: restaurantId,
        tableType: "takeout",
      });

      if (existingTakeoutTable) {
        console.log(`  ➡️ Takeout table already exists for ${restaurantId}. Skipping.`);
        skippedCount++;
      } else {
        // Create a new takeout table
        await Table.create({
          restaurantId: restaurantId,
          tableNumber: 999, // Unique identifier for takeout table
          capacity: 1, // Satisfy min:1 schema constraint
          tableType: "takeout",
          isSystem: true, // Mark as a system-managed table
          status: "available", // Always available for new takeout orders
        });
        console.log(`  ✅ Created takeout table for ${restaurantId}.`);
        createdCount++;
      }
    }

    console.log(`\n🎉 Script finished!`);
    console.log(`   Created: ${createdCount} new takeout tables.`);
    console.log(`   Skipped: ${skippedCount} restaurants (takeout table already existed).`);
  } catch (error) {
    console.error("❌ An error occurred:", error);
    process.exit(1); // Exit with error code
  } finally {
    await mongoose.disconnect();
    console.log("👋 MongoDB disconnected.");
  }
}

createTakeoutTables();
