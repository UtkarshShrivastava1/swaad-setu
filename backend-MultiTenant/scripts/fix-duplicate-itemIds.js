#!/usr/bin/env node
/**
 * Migration script: fix menus that have items with missing/null itemId
 * - Adds a unique itemId to each item that is missing one
 * - Recreates the unique partial index on { restaurantId:1, "items.itemId":1 }
 *
 * Usage: node scripts/fix-duplicate-itemIds.js
 */

const { connectDB, mongoose } = require("../db/mongoose");
const Menu = require("../models/menu.model");
const crypto = require("crypto");

async function ensureItemId(item) {
  if (!item) return null;
  if (item.itemId && typeof item.itemId === "string" && item.itemId.trim()) {
    return item.itemId;
  }
  // generate compact id
  return crypto.randomBytes(12).toString("hex");
}

async function run() {
  console.log("Starting migration: fix missing menu itemIds...");
  await connectDB();

  const cursor = Menu.find().cursor();
  let touched = 0;
  let modifiedMenus = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    let modified = false;

    if (Array.isArray(doc.items) && doc.items.length > 0) {
      for (let i = 0; i < doc.items.length; i++) {
        const itm = doc.items[i];
        if (!itm.itemId || itm.itemId === null || itm.itemId === "") {
          const newId = await ensureItemId(itm);
          doc.items[i].itemId = newId;
          modified = true;
        }
      }
    }

    if (modified) {
      try {
        await doc.save();
        touched += doc.items.length;
        modifiedMenus += 1;
        console.log(
          `Updated menu ${doc._id} (restaurantId=${doc.restaurantId})`
        );
      } catch (err) {
        console.error(`Failed to save menu ${doc._id}:`, err.message || err);
      }
    }
  }

  console.log(
    `Finished scanning menus. Modified menus: ${modifiedMenus}, items touched: ${touched}`
  );

  // Recreate index: drop old index if exists, then create partial unique index
  const coll = mongoose.connection.collection("menus");
  try {
    // Attempt to drop any existing index on restaurantId + items.itemId
    try {
      await coll.dropIndex({ restaurantId: 1, "items.itemId": 1 });
      console.log("Dropped existing index {restaurantId:1, items.itemId:1}");
    } catch (dropErr) {
      // If not found, ignore
      console.log(
        "No existing index to drop or drop failed (ignored):",
        dropErr.message || dropErr
      );
    }

    await coll.createIndex(
      { restaurantId: 1, "items.itemId": 1 },
      {
        unique: true,
        // Index only when items.itemId is a string to avoid indexing null/other types
        partialFilterExpression: { "items.itemId": { $type: "string" } },
      }
    );

    console.log(
      "Created partial unique index on { restaurantId:1, 'items.itemId':1 }"
    );
  } catch (err) {
    console.error("Error creating index:", err.message || err);
  }

  // Close connection
  await mongoose.connection.close();
  console.log("Migration complete. Connection closed.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err.message || err);
  process.exit(1);
});
