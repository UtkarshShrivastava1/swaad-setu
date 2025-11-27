const Admin = require("../models/admin.model");
const { connectDB } = require("../db/mongoose");

async function checkAdmin() {
  try {
    await connectDB();
    const admins = await Admin.find({});
    console.log("Admin records:");
    admins.forEach((admin) => {
      console.log({
        restaurantId: admin.restaurantId,
        hashedPin: admin.hashedPin ? "*** (exists)" : "MISSING",
        staffHashedPin: admin.staffHashedPin ? "*** (exists)" : "MISSING",
      });
    });
    process.exit(0);
  } catch (err) {
    console.error("Error checking admin:", err);
    process.exit(1);
  }
}

checkAdmin();
