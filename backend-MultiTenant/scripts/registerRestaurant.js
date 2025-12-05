// scripts/registerRestaurant.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const { connectDB } = require("../db/mongoose");
const Admin = require("../models/admin.model");
const Menu = require("../models/menu.model");
const Table = require("../models/table.model");

// -------------------------------------------------------
// Utility: Generate a unique restaurantId from the restaurant name
// This creates a URL-friendly slug and appends a random 4-digit number.
// -------------------------------------------------------
function generateRestaurantId(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // Sanitize name
      .replace(/-+/g, "-") // Remove duplicate hyphens
      .replace(/^-|-$/g, "") + // Remove leading/trailing hyphens
    "-" +
    Math.floor(1000 + Math.random() * 9000) // Append random 4-digit number
  );
}

// -------------------------------------------------------
// MAIN SEED FUNCTION
// This function orchestrates the creation of a new restaurant tenant.
// It handles database connection, admin creation, and optional seeding of default data.
// -------------------------------------------------------
async function seedRestaurant({
  restaurantName,
  ownerName,
  phone,
  email = null, // New parameter for email
  address = {
    street: null,
    city: null,
    state: null,
    zip: null,
    country: null,
  }, // New parameter for address
  UPISettings = {}, // New parameter for UPI settings
  seedTables = true, // Option to seed default tables
  seedMenu = true, // Option to seed a default menu
}) {
  try {
    // Establish connection to the database
    await connectDB();

    // Generate a unique identifier for the restaurant
    const restaurantId = generateRestaurantId(restaurantName);
    const adminPin = "1111"; // Default PIN, can be changed or made dynamic

    console.log("\n🚀 Creating new restaurant tenant...");
    console.log("Name:", restaurantName);
    console.log("RID:", restaurantId);

    // ---------------------------------------------------
    // 1. Create Admin Document
    // This sets up the primary administrative user for the new restaurant.
    // ---------------------------------------------------
    // Hash the PIN for secure storage
    const hashedPin = await bcrypt.hash(adminPin, 10);

    const adminPayload = {
      restaurantId,
      restaurantName,
      ownerName,
      phone,
      email,
      address,
      UPISettings,
      hashedPin,
      staffHashedPin: "", // Added default staffHashedPin
      pricingConfigs: [
        {
          version: 1,
          active: true,
          effectiveFrom: new Date(),
          globalDiscountPercent: 0,
          serviceChargePercent: 0,
          taxes: [
            { name: "GST", percent: 0, code: "GSTIN", inclusive: false }, // Default tax
          ],
          createdBy: "system",
          reason: "Initial setup",
          createdAt: new Date(),
          offers: [],
        },
      ],
    };

    // Create the admin record in the database
    const admin = await Admin.create(adminPayload);

    console.log("✅ Admin created:", admin._id.toString());

    // ---------------------------------------------------
    // 2. Seed Default Menu (optional)
    // If enabled, this creates a basic menu to get the restaurant started.
    // ---------------------------------------------------
    if (seedMenu) {
      await Menu.create({
        restaurantId,
        isActive: true,
        categories: [
          {
            name: "Sample Category",
            items: [
              {
                itemId: "1001",
                name: "Sample Item 1",
                price: 99,
              },
            ],
          },
        ],
      });

      console.log("📦 Default Menu seeded");
    }

    // ---------------------------------------------------
    // 3. Seed Default Tables (optional)
    // If enabled, this creates a set of default tables for the restaurant.
    // ---------------------------------------------------
    if (seedTables) {
      const tables = [];
      // Create 5 default tables
      for (let i = 1; i <= 5; i++) {
        tables.push({
          restaurantId,
          tableNumber: i, // REQUIRED FIELD
          capacity: 4, // REQUIRED FIELD - choose default like 4
          status: "available",
          currentSessionId: null,
        });
      }

      // Insert the tables into the database
      await Table.insertMany(tables);
      console.log("📦 Default Tables (1–5) seeded");
    }

    // --- Final Success Message ---
    console.log("\n🎉 Restaurant Tenant Created Successfully!");
    console.log("=========================================");
    console.log(" Restaurant Name :", restaurantName);
    console.log(" Restaurant ID   :", restaurantId);
    console.log(" Admin Login PIN :", adminPin);
    console.log("-----------------------------------------");
    console.log(` Login URL: POST /api/${restaurantId}/admin/login`);
    console.log("=========================================\n");

    // Exit the script successfully
    process.exit(0);
  } catch (err) {
    // Log any errors that occur during the process
    console.error("❌ Error creating restaurant:", err);
    process.exit(1);
  }
}

// -------------------------------------------------------
// EXECUTION BLOCK
// To run this script, use the command: `node scripts/registerRestaurant.js`
// Modify the details below to register a new restaurant.
// -------------------------------------------------------
seedRestaurant({
  restaurantName: "Dominos",
  ownerName: "John",
  phone: "9876543210",
  email: "John@dominos.com", // Example email added
  address: {
    street: "123 Main St",
    city: "Someville",
    state: "SomeState",
    zip: "12345",
    country: "USA",
  }, // Example address added
  UPISettings: {
    UPI_ID: "example@upi",
    UPI_NAME: "John Doe",
  },
  seedTables: true, // Set to false to skip creating tables
  seedMenu: true, // Set to false to skip creating a menu
});
