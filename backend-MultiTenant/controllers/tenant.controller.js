const Admin = require("../models/admin.model");
const Menu = require("../models/menu.model");
const Table = require("../models/table.model");
const { SUBSCRIPTIONS } = require("../config/subscriptions");

const crypto = require("crypto");
const bcrypt = require("bcrypt");

// Utility: Slugify restaurant name → RID
function generateRID(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${suffix}`;
}

// Utility: seed 10 default tables
async function seedTables(rid) {
  const tables = [];
  for (let i = 1; i <= 10; i++) {
    tables.push({
      restaurantId: rid,
      tableNumber: i,
      capacity: 4,
    });
  }
  await Table.insertMany(tables);
}

// Utility: seed default menu
async function seedMenu(rid) {
  await Menu.create({
    restaurantId: rid,
    isActive: true,
    categories: [
      {
        name: "Recommended",
        items: [
          {
            name: "Masala Dosa",
            price: 120,
            description: "Crispy dosa with aromatic potato masala.",
            isAvailable: true,
          },
          {
            name: "Paneer Butter Masala",
            price: 180,
            description: "Creamy and rich gravy with paneer cubes.",
            isAvailable: true,
          },
        ],
      },
    ],
  });
}

exports.registerRestaurant = async (req, res, next) => {
  try {
    const { restaurantName, ownerName, phone, email, adminPin, staffPin } =
      req.body;

    // ---------------------------
    //  Basic Validation
    // ---------------------------
    if (!restaurantName || !adminPin || !staffPin) {
      return res.status(400).json({
        error: "restaurantName, adminPin, and staffPin are required",
      });
    }

    if (email) {
      const exists = await Admin.findOne({ email }).lean();
      if (exists) {
        return res.status(400).json({ error: "Email already registered" });
      }
    }

    if (phone) {
      const exists = await Admin.findOne({ phone }).lean();
      if (exists) {
        return res.status(400).json({ error: "Phone already registered" });
      }
    }

    // ---------------------------
    //  Create RID (tenant ID)
    // ---------------------------
    const rid = generateRID(restaurantName);

    // ---------------------------
    //  Create Admin document
    // ---------------------------
    const admin = await Admin.create({
      restaurantId: rid,
      restaurantName,
      ownerName,
      phone,
      email,

      hashedPin: await bcrypt.hash(adminPin, 10),
      staffHashedPin: await bcrypt.hash(staffPin, 10),

      staffAliases: [],
      waiterNames: [],
      pricingConfigs: [],

      // ⭐ Correct FREE Subscription Structure
      subscription: {
        plan: "FREE",
        limits: { ...SUBSCRIPTIONS.FREE.limits },
        features: { ...SUBSCRIPTIONS.FREE.features },
        expiry: null,
        createdAt: new Date(),
      },
    });

    // ---------------------------
    //  Auto-Seed Tables
    // ---------------------------
    await seedTables(rid);

    // ---------------------------
    //  Auto-Seed Menu
    // ---------------------------
    await seedMenu(rid);

    const qrLink = `https://swadsetu.in/${rid}/qrcode`;

    // ---------------------------
    //  Final Response
    // ---------------------------
    return res.status(201).json({
      success: true,
      message: "Restaurant registered successfully",
      data: {
        rid,
        adminId: admin._id,
        adminPin,
        staffPin,
        loginUrl: `/api/${rid}/admin/login`,
        staffLoginUrl: `/api/${rid}/admin/staff/login`,
        qrSetupUrl: qrLink,

        // Return full subscription details
        subscription: {
          plan: admin.subscription.plan,
          limits: admin.subscription.limits,
          features: admin.subscription.features,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getRestaurantByRid = async (req, res, next) => {
  try {
    const { rid } = req.params;

    if (!rid) {
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }

    const restaurant = await Admin.findOne(
      { restaurantId: rid },
      "restaurantId restaurantName ownerName phone email subscription UPISettings"
    ).lean();

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Transform response to use camelCase for frontend consistency
    const { UPISettings, ...rest } = restaurant;
    const response = {
      ...rest,
      upiSettings: UPISettings || { UPI_ID: null, UPI_NAME: null, UPI_CURRENCY: 'INR' },
    };

    return res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
