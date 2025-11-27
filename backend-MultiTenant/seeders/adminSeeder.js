// seeders/adminSeeder.js
const bcrypt = require("bcrypt");
const { connectDB, mongoose } = require("../db/mongoose");
const Admin = require("../models/admin.model");
const config = require("../config");

async function seedAdmin() {
  try {
    await connectDB();

    const existingAdmin = await Admin.findOne({
      restaurantId: config.DEFAULT_RESTAURANT_ID,
    });
    if (existingAdmin) {
      console.log("✅ Admin already exists. Seeder skipped.");
      return;
    }

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);
    const hashedPin = await bcrypt.hash(config.DEFAULT_ADMIN_PIN, saltRounds);

    const admin = new Admin({
      restaurantId: config.DEFAULT_RESTAURANT_ID,
      hashedPin,
      staffAliases: ["Manager", "Waiter", "Chef"],
    });

    await admin.save();
    console.log("🎉 Default admin created successfully!");
  } catch (error) {
    console.error("❌ Seeder error:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedAdmin();
