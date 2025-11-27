// scripts/fix-duplicate-index.js
// Fix duplicate restaurantId index in admins collection

require("dotenv").config();
const mongoose = require("mongoose");

async function fixDuplicateIndex() {
  try {
    // Connect to MongoDB
    const MONGO_URI =
      process.env.MONGO_URI || "mongodb://localhost:27017/swadsetu";
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("admins");

    // Get all indexes
    console.log("\n📋 Current indexes on 'admins' collection:");
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, JSON.stringify(index.key));
    });

    // Check for duplicate restaurantId indexes
    const restaurantIdIndexes = indexes.filter(
      (idx) => idx.key.restaurantId === 1 && Object.keys(idx.key).length === 1
    );

    console.log(
      `\n🔍 Found ${restaurantIdIndexes.length} restaurantId index(es)`
    );

    if (restaurantIdIndexes.length > 1) {
      console.log("\n⚠️  Duplicate indexes detected! Removing duplicates...\n");

      // Keep the explicitly named index, drop the auto-generated one
      for (const idx of restaurantIdIndexes) {
        // Drop the auto-generated index (usually named "restaurantId_1")
        if (idx.name === "restaurantId_1") {
          console.log(`🗑️  Dropping index: ${idx.name}`);
          await collection.dropIndex(idx.name);
          console.log(`✅ Dropped index: ${idx.name}`);
        }
      }
    } else if (restaurantIdIndexes.length === 1) {
      console.log(
        "\n✅ Only one restaurantId index exists - no duplicates to remove"
      );
    } else {
      console.log(
        "\n⚠️  No restaurantId index found - will be created on next server start"
      );
    }

    // Show final state
    console.log("\n📋 Final indexes on 'admins' collection:");
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, JSON.stringify(index.key));
    });

    console.log("\n✅ Index cleanup completed!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the fix
fixDuplicateIndex();
