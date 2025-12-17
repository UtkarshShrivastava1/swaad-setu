#!/usr/bin/env node

/**
 * Script to normalize existing Table documents by explicitly setting
 * 'tableType: "dine_in"' and 'isSystem: false' for documents that lack these fields.
 * This script ensures all tables conform to the updated schema fields.
 * Usage: node scripts/normalize_table_fields.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Table = require("../models/table.model");
const config = require("../config");

async function normalizeTableFields() {
  console.log("🚀 Starting script to normalize table fields...");

  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongo.uri, config.mongo.options);
    console.log("✅ MongoDB connected successfully.");

    // Find tables that do not have the tableType field or isSystem field explicitly set
    // This targets older documents that predate the schema changes.
    const query = {
      $or: [
        { tableType: { $exists: false } },
        { isSystem: { $exists: false } }
      ]
    };

    const updateResult = await Table.updateMany(
      query,
      {
        $set: {
          tableType: "dine_in",
          isSystem: false,
        },
      }
    );

    console.log(`\n🎉 Script finished!`);
    console.log(`   Matched: ${updateResult.matchedCount} tables.`);
    console.log(`   Modified: ${updateResult.modifiedCount} tables.`);

  } catch (error) {
    console.error("❌ An error occurred:", error);
    process.exit(1); // Exit with error code
  } finally {
    await mongoose.disconnect();
    console.log("👋 MongoDB disconnected.");
  }
}

normalizeTableFields();
