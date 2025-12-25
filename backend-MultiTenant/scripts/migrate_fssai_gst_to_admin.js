require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/admin.model");

function generateDummyFSSAI() {
  return Math.floor(1e13 + Math.random() * 9e13).toString(); // 14 digits
}

function generateDummyGST() {
  const stateCode = "27"; // Maharashtra example
  const pan = "ABCDE1234F";
  const entity = "1";
  const checksum = "Z5";
  return `${stateCode}${pan}${entity}${checksum}`; // 15 chars
}

async function injectDummyData() {
  console.log("Injecting dummy FSSAI & GST data...");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");

    const admins = await Admin.find({
      $or: [{ fssaiNumber: null }, { gstNumber: null }],
    });

    let updated = 0;

    for (const admin of admins) {
      let modified = false;

      if (!admin.fssaiNumber) {
        admin.fssaiNumber = generateDummyFSSAI();
        modified = true;
      }

      if (!admin.gstNumber) {
        admin.gstNumber = generateDummyGST();
        modified = true;
      }

      if (modified) {
        await admin.save();
        updated++;
        console.log(`Updated ${admin.restaurantId}`);
      }
    }

    console.log(`Dummy data injected for ${updated} admins`);
  } catch (err) {
    console.error("Injection failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
    process.exit(0);
  }
}

injectDummyData();
