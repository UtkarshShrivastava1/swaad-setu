// scripts/fix-duplicate-index.js
require("dotenv").config();
const { connectDB, mongoose } = require("../db/mongoose");
const Menu = require("../models/menu.model");

async function dropDuplicateIndex() {
  const indexName = "items.itemId_1";
  try {
    await connectDB();
    console.log(`🚀 Attempting to drop index '${indexName}' from 'menus' collection...`);

    await Menu.collection.dropIndex(indexName);
    console.log(`✅ Successfully dropped index: ${indexName}`);

  } catch (error) {
    if (error.code === 27) { // IndexNotFound
        console.warn(`⚠️ Index not found: '${indexName}'. It may have been dropped already.`);
    } else {
        console.error("❌ Error dropping index:", error.message);
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("🔌 Database connection closed");
    }
  }
}

dropDuplicateIndex();