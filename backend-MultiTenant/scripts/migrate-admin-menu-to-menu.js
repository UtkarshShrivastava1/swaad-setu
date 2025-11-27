// scripts/migrate-admin-menu-to-menu.js
// Migration script to move menu data from Admin documents to Menu collection

const { connectDB, mongoose } = require("../db/mongoose");
const Admin = require("../models/admin.model");
const Menu = require("../models/menu.model");
const config = require("../config");

async function migrateAdminMenuToMenu() {
  try {
    await connectDB();
    console.log("🚀 Starting menu migration...");

    // Find all admins that might have menu data
    // Since the current schema doesn't have menu fields, we'll look for any
    // admins that might have been created with legacy schema
    const admins = await Admin.find({});
    console.log(`📋 Found ${admins.length} admin documents`);

    const migrationReport = {
      totalRestaurants: admins.length,
      migratedRestaurants: 0,
      skippedRestaurants: 0,
      errors: [],
    };

    for (const admin of admins) {
      try {
        console.log(`\n🔍 Processing restaurant: ${admin.restaurantId}`);

        // Check if admin has any menu-related data in dynamic fields
        // (fields that might exist in legacy documents but not in schema)
        const adminDoc = admin.toObject ? admin.toObject() : admin;

        // Look for menu data in dynamic fields
        const menuData = adminDoc.menu || adminDoc.items || adminDoc.dishes;
        const categoriesData = adminDoc.categories;
        const taxesData = adminDoc.taxes || adminDoc.taxPercent;
        const serviceChargeData = adminDoc.serviceCharge;

        // If no menu data found, skip
        if (!menuData && !categoriesData && !taxesData && !serviceChargeData) {
          console.log(
            `⏭️  No menu data found for restaurant ${admin.restaurantId}`
          );
          migrationReport.skippedRestaurants++;
          continue;
        }

        console.log(`📦 Found menu data for restaurant ${admin.restaurantId}`);

        // Prepare menu document
        const menuDoc = {
          restaurantId: admin.restaurantId,
          version: 1,
          isActive: true,
          title: `${admin.restaurantId} menu`,
          items: Array.isArray(menuData) ? menuData : [],
          categories: Array.isArray(categoriesData) ? categoriesData : [],
          taxes: Array.isArray(taxesData)
            ? taxesData
            : typeof taxesData === "number"
            ? [{ name: "GST", percent: taxesData }]
            : [],
          serviceCharge:
            typeof serviceChargeData === "number" ? serviceChargeData : 0,
          branding: adminDoc.branding || {},
        };

        // Check if menu already exists for this restaurant
        const existingMenu = await Menu.findOne({
          restaurantId: admin.restaurantId,
          isActive: true,
        });

        if (existingMenu) {
          console.log(
            `⚠️  Active menu already exists for restaurant ${admin.restaurantId}. Skipping...`
          );
          migrationReport.skippedRestaurants++;
          continue;
        }

        // Create new menu document
        const newMenu = new Menu(menuDoc);
        await newMenu.save();

        console.log(
          `✅ Successfully migrated menu for restaurant ${admin.restaurantId}`
        );
        migrationReport.migratedRestaurants++;

        // Optionally mark admin document for cleanup (commented out for safety)
        // This would be done after verifying the migration was successful
        /*
        await Admin.updateOne(
          { _id: admin._id },
          { $set: { menuMigrated: true, menuMigratedAt: new Date() } }
        );
        */
      } catch (error) {
        console.error(
          `❌ Error processing restaurant ${admin.restaurantId}:`,
          error.message
        );
        migrationReport.errors.push({
          restaurantId: admin.restaurantId,
          error: error.message,
        });
      }
    }

    // Print migration report
    console.log("\n" + "=".repeat(50));
    console.log("📊 MIGRATION REPORT");
    console.log("=".repeat(50));
    console.log(`Total Restaurants: ${migrationReport.totalRestaurants}`);
    console.log(`Migrated: ${migrationReport.migratedRestaurants}`);
    console.log(`Skipped: ${migrationReport.skippedRestaurants}`);
    console.log(`Errors: ${migrationReport.errors.length}`);

    if (migrationReport.errors.length > 0) {
      console.log("\n❌ ERRORS:");
      migrationReport.errors.forEach((err) => {
        console.log(`  - Restaurant: ${err.restaurantId}, Error: ${err.error}`);
      });
    }

    console.log("=".repeat(50));
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
}

// Run migration if script is called directly
if (require.main === module) {
  migrateAdminMenuToMenu();
}

module.exports = { migrateAdminMenuToMenu };
