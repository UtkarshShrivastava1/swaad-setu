// scripts/test-migration.js
// Test script to verify migration works with sample data

const { connectDB, mongoose } = require("../db/mongoose");
const Admin = require("../models/admin.model");
const Menu = require("../models/menu.model");
const bcrypt = require("bcrypt");
const { migrateAdminMenuToMenu } = require("./migrate-admin-menu-to-menu");

async function createTestAdminWithMenuData() {
  try {
    await connectDB();
    console.log("🚀 Creating test admin with menu data...");

    // Clear any existing test data
    await Admin.deleteOne({ restaurantId: "test-restro" });
    await Menu.deleteMany({ restaurantId: "test-restro" });

    // Create test admin with menu data using direct MongoDB operations
    // (bypassing Mongoose schema validation since menu fields aren't in schema)
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);
    const hashedPin = await bcrypt.hash("1234", saltRounds);

    const testAdmin = {
      restaurantId: "test-restro",
      hashedPin,
      staffAliases: ["Test Manager", "Test Waiter"],
      // Legacy menu data that would exist in old documents
      menu: [
        {
          itemId: "i_1",
          name: "Test Item 1",
          price: 100,
          description: "Test description 1",
        },
        {
          itemId: "i_2",
          name: "Test Item 2",
          price: 200,
          description: "Test description 2",
        },
      ],
      categories: [
        {
          name: "Test Category",
          itemIds: ["i_1", "i_2"],
        },
      ],
      taxes: [
        {
          name: "GST",
          percent: 18,
        },
      ],
      serviceCharge: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert directly to bypass schema validation
    const result = await mongoose.connection
      .collection("admins")
      .insertOne(testAdmin);
    console.log(`✅ Test admin created with ID: ${result.insertedId}`);

    // Verify the data was inserted
    const insertedAdmin = await mongoose.connection
      .collection("admins")
      .findOne({ _id: result.insertedId });
    console.log(
      "📋 Inserted admin data:",
      JSON.stringify(insertedAdmin, null, 2)
    );

    // Run migration
    console.log("\n🔄 Running migration...");
    await mongoose.connection.close();

    // Run the migration function
    await migrateAdminMenuToMenu();
  } catch (error) {
    console.error("💥 Test setup failed:", error);
    process.exit(1);
  }
}

// Run test if script is called directly
if (require.main === module) {
  createTestAdminWithMenuData();
}
