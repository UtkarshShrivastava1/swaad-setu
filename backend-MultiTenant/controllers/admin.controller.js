// controllers/admin.controller.js
// Hardened admin controller with Menu extraction support and staff/login/config fixes.
// Enhanced with detailed step-by-step logging for easier debugging and data-flow tracing.

const Admin = require("../models/admin.model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../common/libs/jwt");
const Order = require("../models/order.model");
const Bill = require("../models/bill.model");
const crypto = require("crypto");
const mongoose = require("mongoose");

// Defensive logger (fallback to console)
let logger = console;
try {
  logger = require("../common/libs/logger") || console;
} catch (e) {
  console.warn("Logger not found, using console as fallback.");
}

// Defensive publishEvent loader
let publishEvent = null;
try {
  const redisModule =
    require("../db/redis") ||
    require("../db/redis.helpers") ||
    require("../db/redisHelper") ||
    null;
  if (redisModule) {
    publishEvent =
      redisModule.publishEvent ||
      redisModule.publish ||
      (typeof redisModule === "function" ? redisModule : null);
  }
  if (typeof publishEvent !== "function") {
    publishEvent = null;
    logger &&
      logger.warn &&
      logger.warn("publishEvent not available — realtime publish no-op.");
  } else {
    logger && logger.info && logger.info("publishEvent loaded successfully.");
  }
} catch (e) {
  publishEvent = null;
  logger &&
    logger.warn &&
    logger.warn("Redis publish helper load failed:", e && e.message);
}

function safePublish(channel, message) {
  if (typeof publishEvent !== "function") {
    logger &&
      logger.debug &&
      logger.debug("safePublish: publishEvent not configured.");
    return;
  }
  try {
    logger &&
      logger.debug &&
      logger.debug("safePublish: publishing", { channel, message });
    const res = publishEvent(channel, message);
    if (res && typeof res.then === "function")
      res.catch((err) => {
        logger &&
          logger.error &&
          logger.error("publishEvent promise rejected:", err && err.message);
      });
  } catch (err) {
    logger &&
      logger.error &&
      logger.error("publishEvent error:", err && err.message);
  }
}

function sanitizeAdmin(adminDoc) {
  if (!adminDoc) return null;
  const obj = adminDoc.toObject ? adminDoc.toObject() : { ...adminDoc };
  // remove all sensitive fields
  delete obj.hashedPin;
  delete obj.staffHashedPin;
  delete obj.overrideTokens;
  return obj;
}

function getBcryptRounds() {
  const env = parseInt(process.env.BCRYPT_ROUNDS || "", 10);
  const rounds = Number.isFinite(env) && env > 0 ? env : 10;
  logger && logger.debug && logger.debug("Using bcrypt rounds:", rounds);
  return rounds;
}

// Defensive Menu model require (may not exist during migration)
let Menu = null;
try {
  Menu = require("../models/menu.model");
  logger && logger.info && logger.info("Menu model loaded.");
} catch (e) {
  Menu = null;
  logger &&
    logger.info &&
    logger.info("Menu model not found — menus unavailable until migrated.");
}

/**
 * Helper to parse item data from form-data.
 * If 'itemData' field is a JSON string, it parses it. Otherwise, it checks 'item' field.
 * If neither is a JSON string, it returns the body directly.
 * This handles cases where multipart/form-data sends complex objects as JSON strings.
 * @param {object} body - The request body.
 * @returns {object} The parsed item data.
 */
function parseFormData(body) {
  if (body.itemData && typeof body.itemData === "string") {
    try {
      return JSON.parse(body.itemData);
    } catch (e) {
      logger?.warn?.(
        "Failed to parse 'itemData' field as JSON string, falling back to other fields.",
        { error: e.message }
      );
      // Fallback to other fields or raw body if parsing fails
    }
  }

  // Fallback to 'item' if 'itemData' was not found or failed to parse
  if (body.item && typeof body.item === "string") {
    try {
      return JSON.parse(body.item);
    } catch (e) {
      logger?.warn?.(
        "Failed to parse 'item' field as JSON string, using raw body.",
        { error: e.message }
      );
      return body; // Fallback to raw body if parsing fails
    }
  }
  return body;
}

// ----------------------- Controllers -----------------------

/**
 * Admin login (admin PIN)
 * POST /api/:rid/admin/login
 */
async function login(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter admin.login", { params: req.params });
  try {
    const { rid } = req.params;
    const { pin } = req.body || {};

    if (!rid) {
      logger && logger.warn && logger.warn("admin.login missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }
    if (!pin || typeof pin !== "string") {
      logger &&
        logger.warn &&
        logger.warn("admin.login missing or invalid pin (redacted)");
      return res.status(400).json({ error: "PIN required" });
    }

    logger &&
      logger.debug &&
      logger.debug("admin.login looking up Admin", { restaurantId: rid });
    let admin = await Admin.findOne({ restaurantId: rid });

    if (!admin) {
      logger &&
        logger.warn &&
        logger.warn("admin.login admin not found", { restaurantId: rid });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Admin exists, validate PIN
    logger &&
      logger.debug &&
      logger.debug("admin.login comparing PIN (redacted)");
    const isMatch = await bcrypt.compare(pin, admin.hashedPin || "");
    if (!isMatch) {
      logger &&
        logger.warn &&
        logger.warn("admin.login invalid PIN attempt", { restaurantId: rid });
      return res.status(401).json({ error: "Invalid PIN" });
    }

    logger &&
      logger.info &&
      logger.info("admin.login PIN validated, issuing token", {
        restaurantId: rid,
      });
    const token = generateToken(
      { restaurantId: rid, role: "admin" },
      { expiresIn: "1h" }
    );

    logger &&
      logger.debug &&
      logger.debug("admin.login token generated (redacted)", {
        restaurantId: rid,
      });
    return res.json({ token });
  } catch (err) {
    logger &&
      logger.error &&
      logger.error("Admin login error:", err && err.stack ? err.stack : err);
    return next(err);
  }
}
/**
 * Staff login (shared staff PIN or fallback to admin PIN)
 * POST /api/:rid/auth/staff-login
 */
async function staffLogin(req, res, next) {
  console.log("[staffLogin] >>> ENTER", {
    params: req.params,
    body: req.body,
    headers: {
      "content-type": req.get("content-type"),
    },
  });

  try {
    const rid = req.params.rid;
    const { pin } = req.body || {};

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid) {
      console.warn("[staffLogin] Missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }
    if (!pin || typeof pin !== "string") {
      console.warn("[staffLogin] Missing or invalid pin");
      return res.status(400).json({ error: "PIN required" });
    }

    console.log("[staffLogin] Looking up Admin", { restaurantId: rid });
    const admin = await Admin.findOne({ restaurantId: rid }).lean();
    console.log("[staffLogin] Admin lookup result", {
      found: !!admin,
      adminId: admin ? admin._id : null,
    });

    if (!admin) {
      return res.status(404).json({ error: "Admin configuration not found" });
    }

    const staffHash = admin.staffHashedPin || "";
    const adminHash = admin.hashedPin || "";
    console.log("[staffLogin] Hashes presence", {
      hasStaffHash: !!staffHash,
      hasAdminHash: !!adminHash,
    });

    // Check staff PIN if exists
    let matched = false;
    if (staffHash) {
      console.log("[staffLogin] Comparing staff PIN...");
      matched = await bcrypt.compare(pin, staffHash);
      console.log("[staffLogin] Staff PIN match result", { matched });
    }

    // If no staff PIN configured, or if staff PIN exists but didn't match
    if (!matched) {
      if (adminHash && !staffHash) {
        console.log(
          "[staffLogin] No staff PIN configured - comparing admin PIN..."
        );
        matched = await bcrypt.compare(pin, adminHash);
        console.log("[staffLogin] Admin PIN comparison result", { matched });
      }
    }

    if (!matched) {
      console.warn("[staffLogin] Invalid PIN", { restaurantId: rid });
      return res.status(401).json({ error: "Invalid PIN" });
    }

    console.log("[staffLogin] PIN validated → issuing staff token", {
      restaurantId: rid,
    });
    const token = generateToken(
      { restaurantId: rid, role: "staff" },
      { expiresIn: "8h" }
    );

    return res.json({ token });
  } catch (err) {
    console.error("[staffLogin] ERROR", err);
    return next(err);
  }
}

/**
 * Generate short-lived override token (admin PIN required)
 * POST /api/:rid/admin/overrides
 */
async function generateOverrideToken(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter generateOverrideToken", { params: req.params });
  try {
    const { rid } = req.params;
    const { pin } = req.body || {};

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid) {
      logger && logger.warn && logger.warn("generateOverrideToken missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }
    if (!pin || typeof pin !== "string") {
      logger &&
        logger.warn &&
        logger.warn("generateOverrideToken missing or invalid pin (redacted)");
      return res.status(400).json({ error: "PIN required" });
    }

    logger &&
      logger.debug &&
      logger.debug("generateOverrideToken finding admin", {
        restaurantId: rid,
      });
    const admin = await Admin.findOne({ restaurantId: rid });
    if (!admin) {
      logger &&
        logger.warn &&
        logger.warn("generateOverrideToken admin not found", {
          restaurantId: rid,
        });
      return res.status(404).json({ error: "Admin configuration not found" });
    }

    logger &&
      logger.debug &&
      logger.debug("generateOverrideToken comparing PIN (redacted)");
    const isMatch = await bcrypt.compare(pin, admin.hashedPin || "");
    if (!isMatch) {
      logger &&
        logger.warn &&
        logger.warn("generateOverrideToken invalid current PIN", {
          restaurantId: rid,
        });
      return res.status(401).json({ error: "Invalid PIN" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const ttlMinutes =
      parseInt(process.env.OVERRIDE_TOKEN_TTL_MIN || "10", 10) || 10;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    logger &&
      logger.debug &&
      logger.debug("generateOverrideToken normalizing existing tokens");
    admin.overrideTokens = (admin.overrideTokens || []).filter((t) => {
      try {
        if (!t) return false;
        // If legacy stored as string skip it (we won't accept legacy format)
        if (typeof t === "string") return false;
        if (!t.expiresAt) return false;
        return new Date(t.expiresAt) > new Date();
      } catch (e) {
        return false;
      }
    });

    admin.overrideTokens = admin.overrideTokens || [];
    admin.overrideTokens.push({ token, createdAt: new Date(), expiresAt });
    logger &&
      logger.info &&
      logger.info(
        "generateOverrideToken saving admin with new override token (redacted)",
        { restaurantId: rid, expiresAt }
      );
    await admin.save();

    safePublish(`restaurant:${rid}:staff`, {
      event: "overrideTokenCreated",
      data: { expiresAt },
    });

    logger &&
      logger.debug &&
      logger.debug("generateOverrideToken completed", { restaurantId: rid });
    // Do NOT return the raw token in logs - but we must in API response for client use.
    return res.json({ token, expiresAt });
  } catch (err) {
    logger &&
      logger.error &&
      logger.error(
        "Generate override token error:",
        err && err.stack ? err.stack : err
      );
    return next(err);
  }
}
//========================================================================================================
//========================================================================================================
//========================================================================================================
//========================================================================================================
// ----------------------- Menu Controllers -----------------------

/**
 * Get Menu (public)
 * GET /api/:rid/admin/menu
 *
 * NOTE: Menu is sourced from the Menu collection (single source of truth).
 * If Menu collection/document isn't present, return 404 with guidance.
 */
async function getMenu(req, res, next) {
  logger && logger.info && logger.info("Enter getMenu", { params: req.params });
  try {
    const { rid } = req.params;
    if (!rid) {
      logger && logger.warn && logger.warn("getMenu missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }

    // Try Menu collection (preferred)
    if (Menu) {
      logger &&
        logger.debug &&
        logger.debug("getMenu querying Menu collection", { restaurantId: rid });
      const menuDoc = await Menu.findOne({
        restaurantId: rid,
        isActive: true,
      }).lean();
      if (menuDoc) {
        logger &&
          logger.info &&
          logger.info("getMenu found active menu", {
            restaurantId: rid,
            version: menuDoc.version,
          });
        return res.json({
          menu: menuDoc.items || [],
          categories: menuDoc.categories || [],
          taxes: menuDoc.taxes || [],
          serviceCharge: menuDoc.serviceCharge || 0,
          branding: menuDoc.branding || {},
        });
      } else {
        logger &&
          logger.info &&
          logger.info("getMenu no active menu found", { restaurantId: rid });
      }
    } else {
      logger && logger.info && logger.info("getMenu Menu model not available");
    }

    // No menu found
    return res.status(404).json({
      error:
        "Menu not configured for this restaurant. Please create an admin menu via POST /api/:rid/admin/menu",
    });
  } catch (err) {
    logger &&
      logger.error &&
      logger.error("Get menu error:", err && err.stack ? err.stack : err);
    return next(err);
  }
}

/*/**
 * Create/Update Menu (admin protected)
 * POST /api/:rid/admin/menu
 *
 * Supports normal menu + combo categories.
 * Writes to Menu collection only. Admin document is ensured to exist (no menu copy).
 */
async function updateMenu(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter updateMenu", { params: req.params });

  try {
    const { rid } = req.params;
    const incoming = req.body || {};

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid) {
      logger && logger.warn && logger.warn("updateMenu missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }

    logger &&
      logger.debug &&
      logger.debug("updateMenu incoming body keys", Object.keys(incoming));

    // ------------------------------
    // Normalize incoming data
    // ------------------------------
    const updateFields = {};

    if (typeof incoming.menu !== "undefined") {
      updateFields.items = incoming.menu;
    }

    if (typeof incoming.categories !== "undefined") {
      // Normalize each category — now supports comboMeta
      updateFields.categories = incoming.categories.map((cat) => {
        const comboMeta = cat.comboMeta || {};
        const originalPrice = Number(comboMeta.originalPrice || 0);
        const discountedPrice = Number(comboMeta.discountedPrice || 0);
        const saveAmount = Math.max(originalPrice - discountedPrice, 0);

        return {
          name: cat.name,
          itemIds: Array.isArray(cat.itemIds) ? cat.itemIds : [],
          isMenuCombo: !!cat.isMenuCombo,
          comboMeta: {
            originalPrice,
            discountedPrice,
            saveAmount,
            description: comboMeta.description || "",
            image: comboMeta.image || null,
          },
        };
      });
    }

    if (typeof incoming.taxes !== "undefined")
      updateFields.taxes = incoming.taxes;
    if (typeof incoming.serviceCharge !== "undefined")
      updateFields.serviceCharge = incoming.serviceCharge;
    if (typeof incoming.branding !== "undefined")
      updateFields.branding = incoming.branding;

    logger &&
      logger.debug &&
      logger.debug(
        "updateMenu prepared updateFields keys",
        Object.keys(updateFields)
      );

    // ------------------------------
    // Create or Update Menu
    // ------------------------------
    let menuResult = null;

    if (Menu) {
      logger &&
        logger.debug &&
        logger.debug("updateMenu searching for existing active menu", {
          restaurantId: rid,
        });

      let menuDoc = await Menu.findOne({ restaurantId: rid, isActive: true });

      if (menuDoc) {
        // ✅ UPDATE EXISTING MENU
        logger &&
          logger.info &&
          logger.info("updateMenu found active menu, applying updates", {
            menuId: menuDoc._id,
          });

        Object.assign(menuDoc, updateFields);
        menuDoc.updatedAt = Date.now();
        menuResult = await menuDoc.save();

        logger &&
          logger.info &&
          logger.info("updateMenu saved updated menu", {
            menuId: menuResult._id,
          });
      } else {
        // 🆕 CREATE NEW MENU VERSION
        logger &&
          logger.info &&
          logger.info("updateMenu no active menu found, creating new menu", {
            restaurantId: rid,
          });

        const last = await Menu.findOne({ restaurantId: rid })
          .sort({ version: -1 })
          .lean();
        const version = last && last.version ? last.version + 1 : 1;

        const newDoc = {
          restaurantId: rid,
          version,
          isActive: true,
          title: incoming.title || `${rid} menu`,
          items: updateFields.items || [],
          categories: updateFields.categories || [],
          taxes: updateFields.taxes || [],
          serviceCharge:
            typeof updateFields.serviceCharge !== "undefined"
              ? updateFields.serviceCharge
              : 0,
          branding: updateFields.branding || {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        menuResult = await Menu.create(newDoc);

        logger &&
          logger.info &&
          logger.info("updateMenu created new menu", {
            menuId: menuResult._id,
            version,
          });
      }
    } else {
      logger &&
        logger.warn &&
        logger.warn("updateMenu failed: Menu model not available");
      return res
        .status(501)
        .json({ error: "Menu collection not available on server." });
    }

    // ------------------------------
    // Ensure Admin Document Exists
    // ------------------------------
    logger &&
      logger.debug &&
      logger.debug("updateMenu ensuring admin exists for restaurant", {
        restaurantId: rid,
      });

    await Admin.updateOne(
      { restaurantId: rid },
      {
        $setOnInsert: { restaurantId: rid, hashedPin: "" },
        $set: { updatedAt: Date.now() },
      },
      { upsert: true }
    );

    // ------------------------------
    // Publish Realtime Update Event
    // ------------------------------
    safePublish(`restaurant:${rid}:staff`, {
      event: "menuUpdated",
      data: { timestamp: new Date() },
    });

    // ------------------------------
    // Respond to Client
    // ------------------------------
    logger &&
      logger.info &&
      logger.info("updateMenu returning updated menu to client", {
        restaurantId: rid,
      });

    return res.json({
      menu: menuResult.items || [],
      categories: menuResult.categories || [],
      taxes: menuResult.taxes || [],
      serviceCharge: menuResult.serviceCharge || 0,
      branding: menuResult.branding || {},
    });
  } catch (err) {
    logger &&
      logger.error &&
      logger.error("Update menu error:", err && err.stack ? err.stack : err);
    return next(err);
  }
}

/**
 * Add a single menu item (admin)
 * POST /api/:rid/admin/menu/items
 */
async function addMenuItem(req, res, next) {
  logger?.info?.("Enter addMenuItem", { params: req.params });

  try {
    const { rid } = req.params;
    const parsedBody = parseFormData(req.body);
    const item = parsedBody.item || parsedBody;

    if (!rid) {
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }

    if (!item || typeof item !== "object") {
      return res.status(400).json({ error: "Valid menu item required" });
    }

    // ✅ Strong validation
    if (
      !item.name ||
      typeof item.name !== "string" ||
      item.name.trim() === ""
    ) {
      return res
        .status(400)
        .json({ error: "Item name is required and cannot be empty." });
    }

    if (typeof item.price !== "number" || item.price <= 0) {
      return res
        .status(400)
        .json({ error: "Item price must be a positive number." });
    }

    if (
      !item.category ||
      typeof item.category !== "string" ||
      item.category.trim() === ""
    ) {
      return res
        .status(400)
        .json({ error: "Item category is required and cannot be empty." });
    }

    const categoryName = item.category.trim();

    // ✅ Reject frontend itemId
    if (item.itemId) {
      logger?.warn?.("addMenuItem: Frontend attempted to supply itemId", {
        rid,
        suppliedItemId: item.itemId,
      });
      return res.status(400).json({
        error: "itemId is auto-generated and cannot be supplied.",
      });
    }

    // ✅ 1. Load active menu
    const menuDoc = await Menu.findOne({
      restaurantId: rid,
      isActive: true,
    });

    if (!menuDoc) {
      logger?.warn?.("addMenuItem: Menu not found", { rid });
      return res.status(404).json({
        error:
          "Menu not found for this restaurant. Please create a menu first.",
      });
    }

    // ✅ 2. Generate next itemId
    let highestNum = 0;

    if (Array.isArray(menuDoc.items)) {
      menuDoc.items.forEach((existingItem) => {
        if (existingItem.itemId) {
          const match = existingItem.itemId.match(/^m(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > highestNum) highestNum = num;
          }
        }
      });
    }

    const newItemId = `m${highestNum + 1}`;

    logger?.debug?.("addMenuItem: Generated itemId", { rid, newItemId });

    // ✅ 3. Ensure no duplicate
    if (menuDoc.items.some((i) => i.itemId === newItemId)) {
      return res.status(409).json({
        error: "Generated itemId already exists. Please retry.",
      });
    }

    // ✅ 4. Find category
    const categoryIndex = menuDoc.categories.findIndex(
      (cat) => cat.name === categoryName
    );

    if (categoryIndex === -1) {
      return res.status(400).json({
        error: `Category '${categoryName}' not found in the menu.`,
      });
    }

    // Parse metadata if it's a JSON string
    if (item.metadata && typeof item.metadata === 'string') {
      try {
        item.metadata = JSON.parse(item.metadata);
      } catch (e) {
        logger?.error?.("addMenuItem: Failed to parse metadata JSON:", { error: e.message });
        item.metadata = {}; // Default to empty object on parse error
      }
    }

    // ✅ 5. Build new item
    const newItem = {
      _id: new mongoose.Types.ObjectId(),
      itemId: newItemId,
      name: item.name.trim(),
      description: item.description || "",
      price: item.price,
      currency: item.currency || "INR",
      image: req.file ? req.file.path : item.image || null,
      isActive: typeof item.isActive === "boolean" ? item.isActive : true,
      isVegetarian: !!item.isVegetarian,
      preparationTime:
        typeof item.preparationTime === "number" ? item.preparationTime : null,
      metadata: item.metadata || {},
    };

    // ✅ 6. Atomic single-document update (NO TRANSACTION NEEDED)
    const updatedMenuDoc = await Menu.findOneAndUpdate(
      {
        _id: menuDoc._id,
        restaurantId: rid,
        isActive: true,
        "items.itemId": { $ne: newItemId },
      },
      {
        $push: {
          items: newItem,
          [`categories.${categoryIndex}.itemIds`]: newItemId,
        },
        $set: { updatedAt: new Date() },
      },
      { new: true, runValidators: true }
    );

    if (!updatedMenuDoc) {
      return res.status(409).json({
        error:
          "Failed to add item due to concurrent modification. Please retry.",
      });
    }

    // ✅ 7. Ensure only one active menu
    await Menu.updateMany(
      { restaurantId: rid, _id: { $ne: updatedMenuDoc._id } },
      { $set: { isActive: false } }
    );

    // ✅ 8. Ensure Admin record
    await Admin.updateOne(
      { restaurantId: rid },
      {
        $setOnInsert: { restaurantId: rid, hashedPin: "" },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    // ✅ 9. Publish event
    safePublish(`restaurant:${rid}:staff`, {
      event: "menuItemAdded",
      data: {
        itemId: newItemId,
        name: newItem.name,
        category: categoryName,
        createdAt: new Date(),
      },
    });

    logger?.info?.("addMenuItem completed successfully", {
      rid,
      newItemId,
    });

    return res.status(201).json(newItem);
  } catch (err) {
    logger?.error?.("Add menu item error", err);
    return next(err);
  }
}

/**
 * Update a specific menu item
 * PATCH /api/:rid/admin/menu/items/:itemId
 */
async function updateMenuItem(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter updateMenuItem", { params: req.params });
  try {
    const { rid, itemId } = req.params;
    const parsedBody = parseFormData(req.body); // Use the helper
    const updates = parsedBody || {};

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid || !itemId) {
      return res.status(400).json({ error: "Missing restaurant id or itemId" });
    }
    if (!Menu) {
      return res.status(501).json({ error: "Menu collection not available" });
    }

    const menu = await Menu.findOne({ restaurantId: rid, isActive: true });
    if (!menu) return res.status(404).json({ error: "Menu not found" });

    const item = menu.items.find((i) => i.itemId === itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Handle image update
    if (req.file) {
      updates.image = req.file.path;
    } else if (updates.image === null) {
      // If client explicitly sends image: null, then clear it.
      // Otherwise, if no file is uploaded, do not touch the existing image.
      item.image = null;
    } else if (updates.image === undefined) {
      // If image field is not present in updates (no file uploaded and no explicit null),
      // ensure existing image is not overwritten (this implicitly happens with Object.assign)
    }

    // Assume `updates.metadata` might be a JSON string from frontend FormData
    // Needs to be parsed to an object before Object.assign or saving
    if (updates.metadata && typeof updates.metadata === 'string') {
      try {
        updates.metadata = JSON.parse(updates.metadata);
      } catch (e) {
        logger && logger.error && logger.error("Failed to parse metadata JSON:", e);
        // Handle parsing error by setting metadata to an empty object
        updates.metadata = {};
      }
    }

    Object.assign(item, updates);
    menu.updatedAt = new Date();

    await menu.save();

    safePublish(`restaurant:${rid}:staff`, {
      event: "menuItemUpdated",
      data: { itemId, updates },
    });

    logger &&
      logger.info &&
      logger.info("updateMenuItem success", { restaurantId: rid, itemId });
    return res.json({ item });
  } catch (err) {
    logger && logger.error && logger.error("updateMenuItem error:", err);
    return next(err);
  }
}

/**
 * Delete (or disable) a specific menu item
 * DELETE /api/:rid/admin/menu/items/:itemId
 */
async function deleteMenuItem(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter deleteMenuItem", { params: req.params });
  try {
    const { rid, itemId } = req.params;

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid || !itemId)
      return res.status(400).json({ error: "Missing restaurant id or itemId" });

    const menu = await Menu.findOne({ restaurantId: rid, isActive: true });
    if (!menu) return res.status(404).json({ error: "Menu not found" });

    const item = menu.items.find((i) => i.itemId === itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    item.isActive = false;
    menu.updatedAt = new Date();
    await menu.save();

    safePublish(`restaurant:${rid}:staff`, {
      event: "menuItemDeleted",
      data: { itemId },
    });

    logger &&
      logger.info &&
      logger.info("deleteMenuItem success", { restaurantId: rid, itemId });
    return res.json({ success: true });
  } catch (err) {
    logger && logger.error && logger.error("deleteMenuItem error:", err);
    return next(err);
  }
}
/**
 * Restore (re-enable) a soft-deleted item
 * PATCH /api/:rid/admin/menu/items/:itemId/restore
 */
async function restoreMenuItem(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter restoreMenuItem", { params: req.params });

  try {
    const { rid, itemId } = req.params;

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid || !itemId) {
      logger && logger.warn && logger.warn("restoreMenuItem missing params");
      return res
        .status(400)
        .json({ error: "Missing restaurant id (rid) or item id" });
    }

    // find menu
    const menuDoc = await Menu.findOne({ restaurantId: rid, isActive: true });
    if (!menuDoc) {
      logger &&
        logger.warn &&
        logger.warn("restoreMenuItem no menu found", { rid });
      return res.status(404).json({ error: "Menu not found for restaurant" });
    }

    // find item
    const itemIndex = menuDoc.items.findIndex((i) => i.itemId === itemId);
    if (itemIndex === -1) {
      logger &&
        logger.warn &&
        logger.warn("restoreMenuItem item not found", { rid, itemId });
      return res.status(404).json({ error: "Item not found" });
    }

    // already active?
    if (menuDoc.items[itemIndex].isActive) {
      return res.status(200).json({
        success: true,
        message: `Item ${itemId} is already active.`,
      });
    }

    // ✅ Restore the item
    menuDoc.items[itemIndex].isActive = true;
    menuDoc.updatedAt = new Date();

    await menuDoc.save();

    safePublish(`restaurant:${rid}:staff`, {
      event: "menuItemRestored",
      data: {
        itemId,
        name: menuDoc.items[itemIndex].name,
        timestamp: new Date(),
      },
    });

    logger &&
      logger.info &&
      logger.info("restoreMenuItem successful", { rid, itemId });

    return res.status(200).json({
      success: true,
      message: `Item ${itemId} restored and available again.`,
      item: {
        itemId: menuDoc.items[itemIndex].itemId,
        name: menuDoc.items[itemIndex].name,
        isActive: true,
      },
    });
  } catch (err) {
    logger &&
      logger.error &&
      logger.error(
        "restoreMenuItem error:",
        err && err.stack ? err.stack : err
      );
    return next(err);
  }
}

/**
 * Update a category
 * PATCH /api/:rid/admin/menu/categories/:categoryId
 */
async function updateCategory(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter updateCategory", { params: req.params });
  try {
    const { rid, categoryId } = req.params;
    const updates = req.body || {};

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid || !categoryId)
      return res
        .status(400)
        .json({ error: "Missing restaurant id or categoryId" });

    const menu = await Menu.findOne({ restaurantId: rid, isActive: true });
    if (!menu) return res.status(404).json({ error: "Menu not found" });

    const cat =
      menu.categories.id(categoryId) ||
      menu.categories.find((c) => c._id?.toString() === categoryId);

    if (!cat) return res.status(404).json({ error: "Category not found" });

    Object.assign(cat, updates);
    menu.updatedAt = new Date();
    await menu.save();

    safePublish(`restaurant:${rid}:staff`, {
      event: "menuCategoryUpdated",
      data: { categoryId, updates },
    });

    logger &&
      logger.info &&
      logger.info("updateCategory success", { restaurantId: rid, categoryId });
    return res.json({ success: true, category: cat });
  } catch (err) {
    logger && logger.error && logger.error("updateCategory error:", err);
    return next(err);
  }
}

/**
 * Delete a category
 * DELETE /api/:rid/admin/menu/categories/:categoryId
 */
async function deleteCategory(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter deleteCategory", { params: req.params });
  try {
    const { rid, categoryId } = req.params;

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid || !categoryId)
      return res
        .status(400)
        .json({ error: "Missing restaurant id or categoryId" });

    const menu = await Menu.findOne({ restaurantId: rid, isActive: true });
    if (!menu) return res.status(404).json({ error: "Menu not found" });

    const initialCount = menu.categories.length;
    menu.categories = menu.categories.filter(
      (c) => c._id?.toString() !== categoryId
    );

    if (menu.categories.length === initialCount)
      return res.status(404).json({ error: "Category not found" });

    menu.updatedAt = new Date();
    await menu.save();

    safePublish(`restaurant:${rid}:staff`, {
      event: "menuCategoryDeleted",
      data: { categoryId },
    });

    logger &&
      logger.info &&
      logger.info("deleteCategory success", { restaurantId: rid, categoryId });
    return res.json({ success: true });
  } catch (err) {
    logger && logger.error && logger.error("deleteCategory error:", err);
    return next(err);
  }
}

/**
 * Get all categories for a restaurant
 * GET /api/:rid/admin/menu/categories
 */
async function getAllCategories(req, res, next) {
  const { rid } = req.params;

  // Remove any client-provided restaurantId
  delete req.body.restaurantId;

  try {
    if (!rid) {
      return res.status(400).json({ error: "Missing restaurant ID (rid)" });
    }

    const menuDoc = await Menu.findOne(
      { restaurantId: rid, isActive: true },
      { categories: 1, _id: 0 }
    );

    if (!menuDoc || !menuDoc.categories) {
      return res.status(404).json({ error: "No categories found" });
    }

    // Clean minimal payload
    const categories = menuDoc.categories.map((cat) => ({
      name: cat.name,
      itemCount: Array.isArray(cat.itemIds) ? cat.itemIds.length : 0,
      isMenuCombo: !!cat.isMenuCombo,
      comboMeta: cat.comboMeta || {},
    }));

    return res.status(200).json({ categories });
  } catch (err) {
    console.error("❌ getAllCategories error:", err);
    next(err);
  }
}

/**
 * Add a single menu category
 * POST /api/:rid/admin/menu/categories
 * Input: { name, isMenuCombo, comboMeta }
 */
async function addCategory(req, res, next) {
  logger?.info?.("Enter addCategory", { params: req.params, body: req.body });
  try {
    const { rid } = req.params;
    const { name, isMenuCombo, comboMeta } = req.body;

    if (!rid) {
      logger?.warn?.("addCategory missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }

    if (!name || typeof name !== "string" || name.trim() === "") {
      logger?.warn?.("addCategory missing or invalid category name");
      return res.status(400).json({ error: "Category name is required" });
    }

    if (!Menu) {
      logger?.warn?.("addCategory failed: Menu model not available");
      return res
        .status(501)
        .json({ error: "Menu collection not available on server." });
    }

    logger?.debug?.("addCategory finding active menu", { restaurantId: rid });
    let menu = await Menu.findOne({ restaurantId: rid, isActive: true });

    if (!menu) {
      logger?.warn?.("addCategory menu not found", { restaurantId: rid });
      return res
        .status(404)
        .json({ error: "Menu not found for this restaurant." });
    }

    const newCategory = {
      _id: new mongoose.Types.ObjectId(), // Generate a new ObjectId for the embedded document
      name: name.trim(),
      itemIds: [], // Ensure itemIds initializes as an empty array
      isMenuCombo: !!isMenuCombo,
    };

    if (newCategory.isMenuCombo && comboMeta) {
      newCategory.comboMeta = {
        originalPrice: Number(comboMeta.originalPrice || 0),
        discountedPrice: Number(comboMeta.discountedPrice || 0),
        saveAmount: Math.max(
          Number(comboMeta.originalPrice || 0) -
            Number(comboMeta.discountedPrice || 0),
          0
        ),
        description: comboMeta.description || "",
        image: comboMeta.image || null,
      };
    } else {
      // Ensure comboMeta is not present or is an empty object if not a combo
      newCategory.comboMeta = {};
      newCategory.isMenuCombo = false; // Override if comboMeta is missing but isMenuCombo was true
    }

    logger?.debug?.("addCategory pushing new category", {
      restaurantId: rid,
      categoryName: newCategory.name,
    });

    const updatedMenu = await Menu.findOneAndUpdate(
      { restaurantId: rid, isActive: true },
      {
        $push: { categories: newCategory },
        $set: { updatedAt: new Date() },
      },
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedMenu) {
      // This case should ideally not happen if 'menu' was found above, but good for robustness
      logger?.error?.("addCategory failed to update menu after finding it", {
        restaurantId: rid,
      });
      return res.status(500).json({ error: "Failed to add category to menu." });
    }

    safePublish(`restaurant:${rid}:staff`, {
      event: "menuCategoryAdded",
      data: {
        categoryId: newCategory._id,
        name: newCategory.name,
        timestamp: new Date(),
      },
    });

    logger?.info?.("addCategory completed successfully", {
      restaurantId: rid,
      categoryId: newCategory._id,
    });
    return res.status(201).json(newCategory);
  } catch (err) {
    logger?.error?.("Add category error:", err && err.stack ? err.stack : err);
    return next(err);
  }
}

//========================================================================================================
//========================================================================================================
//========================================================================================================
//========================================================================================================

// ----------------------- Analytics & Reports Controllers -----------------------
/**
 * Analytics (keeps your previous logic)
 * GET /api/:rid/admin/analytics?period=daily|weekly|monthly
 */
async function getAnalytics(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter getAnalytics", { params: req.params, query: req.query });
  try {
    const { rid } = req.params;
    const period = (req.query.period || "daily").toLowerCase();

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid) {
      logger && logger.warn && logger.warn("getAnalytics missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }

    const now = new Date();
    let startDate;
    switch (period) {
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate()
        );
        break;
      case "daily":
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }
    logger &&
      logger.debug &&
      logger.debug("getAnalytics computed startDate", { period, startDate });

    const billMatch = {
      $match: {
        restaurantId: rid,
        paymentStatus: "paid",
        createdAt: { $gte: startDate },
      },
    };
    logger &&
      logger.debug &&
      logger.debug("getAnalytics running Bill.aggregate", {
        restaurantId: rid,
      });
    const billAgg = await Bill.aggregate([
      billMatch,
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
          paidCount: { $sum: 1 },
        },
      },
    ]);
    const totalRevenue = (billAgg[0] && billAgg[0].totalRevenue) || 0;
    logger &&
      logger.debug &&
      logger.debug("getAnalytics billAgg result", { totalRevenue });

    const orderMatch = {
      $match: { restaurantId: rid, createdAt: { $gte: startDate } },
    };
    logger &&
      logger.debug &&
      logger.debug("getAnalytics running Order.aggregate for counts", {
        restaurantId: rid,
      });
    const orderCountAgg = await Order.aggregate([
      orderMatch,
      { $count: "count" },
    ]);
    const orderCount = (orderCountAgg[0] && orderCountAgg[0].count) || 0;
    logger &&
      logger.debug &&
      logger.debug("getAnalytics order count", { orderCount });

    logger &&
      logger.debug &&
      logger.debug("getAnalytics computing topItems", { restaurantId: rid });
    const topItemsAgg = await Order.aggregate([
      orderMatch,
      { $unwind: { path: "$items", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: "$items.name",
          quantity: { $sum: { $ifNull: ["$items.quantity", 0] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
      { $project: { name: "$_id", quantity: 1, _id: 0 } },
    ]);
    const topItems = topItemsAgg || [];
    logger &&
      logger.debug &&
      logger.debug("getAnalytics topItems", { topItems });

    logger &&
      logger.debug &&
      logger.debug("getAnalytics computing peakHours", { restaurantId: rid });
    const peakHoursAgg = await Order.aggregate([
      orderMatch,
      { $project: { hour: { $hour: "$createdAt" } } },
      { $group: { _id: "$hour", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      { $project: { hour: "$_id", count: 1, _id: 0 } },
    ]);
    const peakHours = peakHoursAgg || [];
    logger &&
      logger.debug &&
      logger.debug("getAnalytics peakHours", { peakHours });

    const [unpaidBills, voidedBills] = await Promise.all([
      Bill.countDocuments({
        restaurantId: rid,
        paymentStatus: "unpaid",
        createdAt: { $gte: startDate },
      }),
      Bill.countDocuments({
        restaurantId: rid,
        status: "cancelled",
        createdAt: { $gte: startDate },
      }),
    ]);

    logger &&
      logger.info &&
      logger.info("getAnalytics completed", { restaurantId: rid });
    return res.json({
      period,
      totalRevenue,
      orderCount,
      topItems,
      peakHours,
      unpaidBills,
      voidedBills,
    });
  } catch (err) {
    logger &&
      logger.error &&
      logger.error("Get analytics error:", err && err.stack ? err.stack : err);
    return next(err);
  }
}

/**
 * Export report (keeps existing behavior)
 * POST /api/:rid/admin/export
 */
async function exportReport(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter exportReport", { params: req.params, body: req.body });
  try {
    const { rid } = req.params;
    const { format, period } = req.body || {};

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid) {
      logger && logger.warn && logger.warn("exportReport missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }
    if (!["csv", "pdf"].includes(format)) {
      logger &&
        logger.warn &&
        logger.warn("exportReport invalid format", { format });
      return res.status(400).json({ error: "Invalid format" });
    }

    const reportId = crypto.randomBytes(16).toString("hex");
    const job = {
      reportId,
      format,
      period: period || "custom",
      status: "processing",
      createdAt: new Date(),
    };

    logger &&
      logger.info &&
      logger.info("exportReport publishing event", {
        restaurantId: rid,
        reportId,
        format,
        period,
      });
    safePublish(`restaurant:${rid}:staff`, {
      event: "reportRequested",
      data: { reportId, format, period },
    });

    logger &&
      logger.debug &&
      logger.debug("exportReport returning job metadata", { reportId });
    return res.json({
      ...job,
      downloadUrl: `/api/${rid}/admin/reports/${reportId}`,
    });
  } catch (err) {
    logger &&
      logger.error &&
      logger.error("Export report error:", err && err.stack ? err.stack : err);
    return next(err);
  }
}

/**
 * Update table (admin)
 * PATCH /api/:rid/admin/tables/:id
 */
async function updateTable(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter updateTable", {
      params: req.params,
      bodyKeys: Object.keys(req.body || {}),
    });
  try {
    const { rid, id } = req.params;
    const { capacity, isActive } = req.body || {};

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid) {
      logger && logger.warn && logger.warn("updateTable missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }
    if (!id) {
      logger && logger.warn && logger.warn("updateTable missing id");
      return res.status(400).json({ error: "Missing table id" });
    }

    let Table;
    try {
      Table = require("../models/table.model");
      logger && logger.debug && logger.debug("updateTable loaded Table model");
    } catch (e) {
      Table = null;
      logger &&
        logger.debug &&
        logger.debug("updateTable Table model not available");
    }

    if (!Table) {
      logger &&
        logger.info &&
        logger.info(
          "updateTable Table model missing - returning simulated response",
          { tableId: id }
        );
      return res.json({
        tableId: id,
        capacity,
        isActive,
        updatedAt: new Date(),
      });
    }

    const update = {};
    if (typeof capacity !== "undefined") update.capacity = capacity;
    if (typeof isActive !== "undefined") update.isActive = isActive;
    if (isActive === false) {
      update.currentSessionId = null;
      update.staffAlias = null;
    }
    update.updatedAt = Date.now();

    logger &&
      logger.debug &&
      logger.debug("updateTable performing findOneAndUpdate", {
        tableId: id,
        restaurantId: rid,
        update,
      });
    const table = await Table.findOneAndUpdate(
      { _id: id, restaurantId: rid },
      update,
      { new: true }
    );
    if (!table) {
      logger &&
        logger.warn &&
        logger.warn("updateTable table not found or inactive", {
          tableId: id,
          restaurantId: rid,
        });
      return res.status(404).json({ error: "Table not found or inactive" });
    }

    safePublish(`restaurant:${rid}:staff`, {
      event: "tableStatusUpdated",
      data: { tableId: id, isActive },
    });

    logger &&
      logger.info &&
      logger.info("updateTable completed successfully", {
        tableId: id,
        restaurantId: rid,
      });
    return res.json(table);
  } catch (err) {
    logger &&
      logger.error &&
      logger.error("Update table error:", err && err.stack ? err.stack : err);
    return next(err);
  }
}

/**
 * Update admin PIN (admin only)
 * PATCH /api/:rid/admin/pin
 */
async function updateAdminPin(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter updateAdminPin", { params: req.params });
  try {
    const { rid } = req.params;
    const { currentPin, newPin } = req.body || {};

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid) {
      logger && logger.warn && logger.warn("updateAdminPin missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }
    if (!currentPin || !newPin) {
      logger &&
        logger.warn &&
        logger.warn("updateAdminPin missing currentPin or newPin (redacted)");
      return res.status(400).json({ error: "Current and new PIN required" });
    }
    if (typeof newPin !== "string" || newPin.length < 4) {
      logger &&
        logger.warn &&
        logger.warn("updateAdminPin invalid newPin length");
      return res
        .status(400)
        .json({ error: "New PIN must be at least 4 characters" });
    }

    logger &&
      logger.debug &&
      logger.debug("updateAdminPin finding admin", { restaurantId: rid });
    const admin = await Admin.findOne({ restaurantId: rid });
    if (!admin) {
      logger &&
        logger.warn &&
        logger.warn("updateAdminPin admin not found", { restaurantId: rid });
      return res.status(404).json({ error: "Admin configuration not found" });
    }

    logger &&
      logger.debug &&
      logger.debug("updateAdminPin comparing current PIN (redacted)");
    const isMatch = await bcrypt.compare(currentPin, admin.hashedPin || "");
    if (!isMatch) {
      logger &&
        logger.warn &&
        logger.warn("updateAdminPin invalid current PIN", {
          restaurantId: rid,
        });
      return res.status(401).json({ error: "Invalid current PIN" });
    }

    const saltRounds = getBcryptRounds();
    logger &&
      logger.debug &&
      logger.debug("updateAdminPin hashing new PIN", { saltRounds });
    const newHash = await bcrypt.hash(newPin, saltRounds);
    admin.hashedPin = newHash;
    admin.overrideTokens = [];
    await admin.save();

    safePublish(`restaurant:${rid}:staff`, {
      event: "adminPinUpdated",
      data: { updatedAt: new Date() },
    });

    logger &&
      logger.info &&
      logger.info("updateAdminPin completed successfully", {
        restaurantId: rid,
      });
    return res.json({ message: "PIN updated successfully" });
  } catch (err) {
    logger &&
      logger.error &&
      logger.error("Update PIN error:", err && err.stack ? err.stack : err);
    return next(err);
  }
}
/**
 * Update the single, shared Staff PIN (admin protected)
 * PATCH /api/:rid/admin/staff-pin
 */
async function updateStaffPin(req, res, next) {
  logger?.info?.("Enter updateStaffPin", { params: req.params });
  try {
    const { rid } = req.params;
    const { adminPin, newStaffPin } = req.body || {};

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid) {
      logger?.warn?.("updateStaffPin missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }
    if (!adminPin || !newStaffPin) {
      logger?.warn?.("updateStaffPin missing adminPin or newStaffPin");
      return res
        .status(400)
        .json({ error: "Admin PIN and new Staff PIN required" });
    }
    if (typeof newStaffPin !== "string" || newStaffPin.length < 4) {
      logger?.warn?.("updateStaffPin invalid newStaffPin length");
      return res
        .status(400)
        .json({ error: "New Staff PIN must be at least 4 characters" });
    }

    const admin = await Admin.findOne({ restaurantId: rid });
    if (!admin) {
      logger?.warn?.("updateStaffPin admin not found", { restaurantId: rid });
      return res.status(404).json({ error: "Admin configuration not found" });
    }

    // 1. Verify the admin's PIN to authorize this change
    const isMatch = await bcrypt.compare(adminPin, admin.hashedPin || "");
    if (!isMatch) {
      logger?.warn?.("updateStaffPin invalid admin PIN", { restaurantId: rid });
      return res.status(401).json({ error: "Invalid Admin PIN. You are not authorized to change the Staff PIN." });
    }
    
    // 2. Hash and save the new SHARED staff pin
    const saltRounds = getBcryptRounds();
    const newHash = await bcrypt.hash(newStaffPin, saltRounds);

    // This is the correct field used by the staffLogin function
    admin.staffHashedPin = newHash;
    
    // This field is now obsolete and should be removed to prevent confusion
    admin.staffPins = undefined;

    await admin.save();

    safePublish(`restaurant:${rid}:staff`, {
      event: "staffPinUpdated",
      data: { updatedAt: new Date() },
    });

    logger?.info?.("updateStaffPin completed successfully", {
      restaurantId: rid,
    });
    return res.json({ message: "Shared Staff PIN updated successfully" });
  } catch (err) {
    logger?.error?.(
      "Update staff PIN error:",
      err && err.stack ? err.stack : err
    );
    return next(err);
  }
}

/**
 * Update staff aliases (admin)
 * PATCH /api/:rid/admin/staff-aliases
 */
async function updateStaffAliases(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter updateStaffAliases", {
      params: req.params,
      body: req.body,
    });
  try {
    const { rid } = req.params;
    const { staffAliases } = req.body || {};

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid) {
      logger && logger.warn && logger.warn("updateStaffAliases missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }
    if (!Array.isArray(staffAliases) || staffAliases.length === 0) {
      logger &&
        logger.warn &&
        logger.warn("updateStaffAliases invalid staffAliases");
      return res.status(400).json({ error: "Valid staff aliases required" });
    }

    logger &&
      logger.debug &&
      logger.debug("updateStaffAliases finding admin", { restaurantId: rid });
    let admin = await Admin.findOne({ restaurantId: rid });
    if (!admin) {
      logger &&
        logger.info &&
        logger.info(
          "updateStaffAliases admin not found, creating minimal admin doc",
          { restaurantId: rid }
        );
      admin = new Admin({ restaurantId: rid, staffAliases, hashedPin: "" });
    } else {
      logger &&
        logger.debug &&
        logger.debug(
          "updateStaffAliases setting staffAliases on existing admin",
          { restaurantId: rid }
        );
      admin.staffAliases = staffAliases;
    }

    await admin.save();

    safePublish(`restaurant:${rid}:staff`, {
      event: "staffAliasesUpdated",
      data: { staffAliases },
    });

    logger &&
      logger.info &&
      logger.info("updateStaffAliases completed", { restaurantId: rid });
    return res.json(sanitizeAdmin(admin));
  } catch (err) {
    logger &&
      logger.error &&
      logger.error(
        "Update staff aliases error:",
        err && err.stack ? err.stack : err
      );
    return next(err);
  }
}

/**
 * Reopen a finalized bill (admin override)
 * POST /api/:rid/admin/bills/:billId/reopen
 */
async function reopenBill(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter reopenBill", {
      params: req.params,
      bodyKeys: Object.keys(req.body || {}),
    });
  try {
    const { rid, billId } = req.params;
    const { reason } = req.body || {};

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid || !billId) {
      logger &&
        logger.warn &&
        logger.warn("reopenBill missing params", { rid, billId });
      return res.status(400).json({ error: "Missing params" });
    }

    logger &&
      logger.debug &&
      logger.debug("reopenBill finding bill", { billId, restaurantId: rid });
    const bill = await Bill.findOne({ _id: billId, restaurantId: rid });
    if (!bill) {
      logger &&
        logger.warn &&
        logger.warn("reopenBill bill not found", { billId, restaurantId: rid });
      return res.status(404).json({ error: "Bill not found" });
    }

    if (bill.status !== "finalized") {
      logger &&
        logger.warn &&
        logger.warn("reopenBill bill not finalized", {
          billId,
          status: bill.status,
        });
      return res.status(400).json({ error: "Bill is not finalized" });
    }

    // record audit metadata
    bill.status = "draft";
    bill.adminReopened = {
      by: req.user ? req.user.restaurantId || "admin" : "admin",
      reason: reason || "admin reopen",
      at: new Date(),
    };
    await bill.save();

    safePublish(`restaurant:${rid}:staff`, {
      event: "billReopened",
      data: { billId },
    });

    logger &&
      logger.info &&
      logger.info("reopenBill completed successfully", {
        billId,
        restaurantId: rid,
      });
    return res.json({ success: true, data: bill });
  } catch (err) {
    logger &&
      logger.error &&
      logger.error("Reopen bill error:", err && err.stack ? err.stack : err);
    return next(err);
  }
}
//======================================================================================================\
//Waiter Names Addition
/**
 * Add a waiter name
 * POST /api/:rid/admin/waiters
 * body: { name: "Ramesh" }
 */
async function addWaiterName(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter addWaiterName", { params: req.params });
  try {
    const { rid } = req.params;
    const { name } = req.body || {};

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid) {
      logger && logger.warn && logger.warn("addWaiterName missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }
    if (!name || typeof name !== "string") {
      logger &&
        logger.warn &&
        logger.warn("addWaiterName missing or invalid name");
      return res.status(400).json({ error: "Waiter name required" });
    }

    const trimmed = name.trim();
    if (!trimmed) {
      return res.status(400).json({ error: "Waiter name cannot be empty" });
    }

    // Ensure admin exists; use upsert to create minimal admin doc if needed
    logger &&
      logger.debug &&
      logger.debug("addWaiterName upserting admin", { restaurantId: rid });
    const update = {
      $addToSet: { waiterNames: trimmed },
      $setOnInsert: { restaurantId: rid, hashedPin: "" },
      $set: { updatedAt: Date.now() },
    };

    const admin = await Admin.findOneAndUpdate({ restaurantId: rid }, update, {
      new: true,
      upsert: true,
    }).lean();

    safePublish(`restaurant:${rid}:staff`, {
      event: "waiterAdded",
      data: { name: trimmed, createdAt: new Date() },
    });

    logger &&
      logger.info &&
      logger.info("addWaiterName completed", {
        restaurantId: rid,
        name: trimmed,
      });
    return res.status(201).json(sanitizeAdmin(admin));
  } catch (err) {
    logger &&
      logger.error &&
      logger.error("addWaiterName error:", err && err.stack ? err.stack : err);
    return next(err);
  }
}

/**
 * Update (rename) a waiter name
 * PATCH /api/:rid/admin/waiters
 * body: { oldName: "Ramesh", newName: "Ramu" }
 */
async function updateWaiterName(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter updateWaiterName", {
      params: req.params,
      body: req.body,
    });
  try {
    const { rid } = req.params;
    const { oldName, newName } = req.body || {};

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid) {
      logger && logger.warn && logger.warn("updateWaiterName missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }
    if (
      !oldName ||
      typeof oldName !== "string" ||
      !newName ||
      typeof newName !== "string"
    ) {
      logger &&
        logger.warn &&
        logger.warn("updateWaiterName missing oldName or newName");
      return res
        .status(400)
        .json({ error: "oldName and newName are required" });
    }

    const oldTrim = oldName.trim();
    const newTrim = newName.trim();
    if (!oldTrim || !newTrim) {
      return res.status(400).json({ error: "Names cannot be empty" });
    }
    if (oldTrim === newTrim) {
      return res
        .status(400)
        .json({ error: "oldName and newName must be different" });
    }

    // Load admin
    logger &&
      logger.debug &&
      logger.debug("updateWaiterName finding admin", { restaurantId: rid });
    let admin = await Admin.findOne({ restaurantId: rid });
    if (!admin) {
      logger &&
        logger.warn &&
        logger.warn("updateWaiterName admin not found", { restaurantId: rid });
      return res.status(404).json({ error: "Admin configuration not found" });
    }

    // Ensure waiterNames exists
    admin.waiterNames = admin.waiterNames || [];

    const idx = admin.waiterNames.findIndex(
      (n) => (n || "").trim() === oldTrim
    );
    if (idx === -1) {
      logger &&
        logger.warn &&
        logger.warn("updateWaiterName oldName not found", {
          restaurantId: rid,
          oldName: oldTrim,
        });
      return res.status(404).json({ error: "Waiter name not found" });
    }

    // Prevent duplicate of new name
    const already = admin.waiterNames.some((n) => (n || "").trim() === newTrim);
    if (already) {
      logger &&
        logger.warn &&
        logger.warn("updateWaiterName newName already exists", {
          restaurantId: rid,
          newName: newTrim,
        });
      return res.status(409).json({ error: "New waiter name already exists" });
    }

    admin.waiterNames[idx] = newTrim;
    admin.updatedAt = Date.now();
    await admin.save();

    safePublish(`restaurant:${rid}:staff`, {
      event: "waiterRenamed",
      data: { oldName: oldTrim, newName: newTrim, at: new Date() },
    });

    logger &&
      logger.info &&
      logger.info("updateWaiterName completed", {
        restaurantId: rid,
        oldName: oldTrim,
        newName: newTrim,
      });
    return res.json(sanitizeAdmin(admin));
  } catch (err) {
    logger &&
      logger.error &&
      logger.error(
        "updateWaiterName error:",
        err && err.stack ? err.stack : err
      );
    return next(err);
  }
}

/** Get all waiter names
 * GET /api/:rid/admin/waiters
 */
async function getWaiterNames(req, res) {
  try {
    const { rid } = req.params;

    const Admin = require("../models/admin.model");
    const admin = await Admin.findOne({ restaurantId: rid })
      .select("waiterNames")
      .lean();

    if (!admin) {
      return res.status(404).json({ waiterNames: [] });
    }

    return res.json({ waiterNames: admin.waiterNames || [] });
  } catch (err) {
    console.error("getWaiterNames error", err);
    return res.status(500).json({ error: "Failed to fetch waiter names" });
  }
}

/**
 * Delete a waiter name
 * DELETE /api/:rid/admin/waiters
 * body: { name: "Ramesh" }
 *
 * (Alternatively you can send name as query param; body is used here.)
 */
async function deleteWaiterName(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter deleteWaiterName", {
      params: req.params,
      body: req.body,
    });
  try {
    const { rid } = req.params;
    const { name } = req.body || {};

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid) {
      logger && logger.warn && logger.warn("deleteWaiterName missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }
    if (!name || typeof name !== "string") {
      logger &&
        logger.warn &&
        logger.warn("deleteWaiterName missing or invalid name");
      return res.status(400).json({ error: "Waiter name required" });
    }

    const trimmed = name.trim();
    if (!trimmed) {
      return res.status(400).json({ error: "Waiter name cannot be empty" });
    }

    // Pull the name from array
    logger &&
      logger.debug &&
      logger.debug("deleteWaiterName pulling name", {
        restaurantId: rid,
        name: trimmed,
      });
    const result = await Admin.findOneAndUpdate(
      { restaurantId: rid },
      { $pull: { waiterNames: trimmed }, $set: { updatedAt: Date.now() } },
      { new: true }
    ).lean();

    if (!result) {
      logger &&
        logger.warn &&
        logger.warn("deleteWaiterName admin not found", { restaurantId: rid });
      return res.status(404).json({ error: "Admin configuration not found" });
    }

    safePublish(`restaurant:${rid}:staff`, {
      event: "waiterRemoved",
      data: { name: trimmed, removedAt: new Date() },
    });

    logger &&
      logger.info &&
      logger.info("deleteWaiterName completed", {
        restaurantId: rid,
        name: trimmed,
      });
    return res.json(sanitizeAdmin(result));
  } catch (err) {
    logger &&
      logger.error &&
      logger.error(
        "deleteWaiterName error:",
        err && err.stack ? err.stack : err
      );
    return next(err);
  }
}
//=====================================================================================================
// Admin Pricing Controller — with integrated Offers (Promo Code) Support
//=====================================================================================================
// ----------------------- Config Controllers -----------------------

/**
 * Update global config (restaurantName, address, UPISettings, etc.)
 * PATCH /api/:rid/admin/config
 */
async function updateConfig(req, res, next) {
  logger?.info?.("Enter updateConfig", { params: req.params, body: req.body });
  try {
    const { rid } = req.params;
    const updates = req.body || {};

    if (req.body) {
      delete req.body.restaurantId; // Prevent changing the restaurantId
    }

    if (!rid) {
      logger?.warn?.("updateConfig missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }

    const updateFields = {};
    const allowedUpdates = [
      "restaurantName",
      "ownerName",
      "phone",
      "email",
      "address",
      "UPISettings",
    ];

    // Build a dynamic $set object based on provided fields
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        if (typeof updates[key] === 'object' && !Array.isArray(updates[key]) && updates[key] !== null) {
          // For nested objects like address and UPISettings, update individual fields
          // This allows PATCH-like behavior, e.g., updating only UPISettings.UPI_ID
          for (const nestedKey in updates[key]) {
            if (Object.prototype.hasOwnProperty.call(updates[key], nestedKey)) {
              updateFields[`${key}.${nestedKey}`] = updates[key][nestedKey];
            }
          }
        } else {
          // For simple top-level fields
          updateFields[key] = updates[key];
        }
      }
    }

    if (Object.keys(updateFields).length === 0) {
      logger?.warn?.("updateConfig no valid fields provided");
      return res.status(400).json({ error: "No valid config fields provided for update." });
    }

    updateFields.updatedAt = new Date();

    const admin = await Admin.findOneAndUpdate(
      { restaurantId: rid },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    if (!admin) {
        return res.status(404).json({ error: "Admin configuration not found" });
    }

    safePublish(`restaurant:${rid}:staff`, {
      event: "configUpdated",
      data: { updates: updateFields },
    });

    logger?.info?.("updateConfig completed successfully", { restaurantId: rid });
    return res.json(sanitizeAdmin(admin));

  } catch (err) {
    logger?.error?.("Update config error:", err?.stack || err);
    return next(err);
  }
}
/**
 * Get pricing configs (active + history)
 * GET /api/:rid/admin/pricing
 */
async function getPricingConfigs(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter getPricingConfigs", { params: req.params });

  try {
    const { rid } = req.params;

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid) {
      logger && logger.warn && logger.warn("getPricingConfigs missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }

    const admin = await Admin.findOne({ restaurantId: rid }).lean();
    if (!admin) {
      logger &&
        logger.warn &&
        logger.warn("getPricingConfigs admin not found", { restaurantId: rid });
      return res.status(404).json({ error: "Admin configuration not found" });
    }

    // Normalize pricing configs and determine active
    const pricingConfigs = Array.isArray(admin.pricingConfigs)
      ? admin.pricingConfigs
      : [];

    const active = pricingConfigs.find((c) => !!c.active) || null;

    logger &&
      logger.debug &&
      logger.debug("getPricingConfigs returning configs", {
        restaurantId: rid,
        count: pricingConfigs.length,
        activeVersion: active ? active.version : null,
      });

    // Include active offers directly for frontend ease
    const activeOffers =
      active && Array.isArray(active.offers)
        ? active.offers.filter((o) => o.isActive)
        : [];

    return res.json({
      active,
      history: pricingConfigs,
      offers: activeOffers,
    });
  } catch (err) {
    logger &&
      logger.error &&
      logger.error(
        "Get pricing configs error:",
        err && err.stack ? err.stack : err
      );
    return next(err);
  }
}

//=====================================================================================================
/**
 * Create a new pricing config (admin-only)
 * POST /api/:rid/admin/pricing
 *
 * Example Body:
 * {
 *   "taxes": [{ "name": "GST", "percent": 5 }],
 *   "globalDiscountPercent": 10,
 *   "serviceChargePercent": 5,
 *   "createdBy": "manager",
 *   "reason": "Diwali promo",
 *   "activate": true,
 *   "offers": [
 *     {
 *       "code": "FIRST20",
 *       "title": "Welcome Offer",
 *       "description": "20% off on first order",
 *       "discountType": "percent",
 *       "discountValue": 20,
 *       "minOrderValue": 300,
 *       "maxDiscountValue": 100,
 *       "validFrom": "2025-10-15T00:00:00Z",
 *       "validTill": "2025-12-31T23:59:59Z"
 *     }
 *   ]
 * }
 */
async function createPricingConfig(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter createPricingConfig", {
      params: req.params,
      bodyKeys: Object.keys(req.body || {}),
    });

  try {
    const { rid } = req.params;
    const body = req.body || {};

    if (req.body) {
      // Remove any client-provided restaurantId
      delete req.body.restaurantId;
    }

    if (!rid) {
      logger && logger.warn && logger.warn("createPricingConfig missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }

    // -------------------------
    // Normalize & Validate Body
    // -------------------------
    const cfg = {};

    if (typeof body.globalDiscountPercent !== "undefined")
      cfg.globalDiscountPercent = Number(body.globalDiscountPercent);

    if (typeof body.serviceChargePercent !== "undefined")
      cfg.serviceChargePercent = Number(body.serviceChargePercent);

    if (Array.isArray(body.taxes)) {
      cfg.taxes = body.taxes.map((t) => ({
        name: t.name || "Tax",
        percent: Number(t.percent || 0),
        code: t.code || "",
        inclusive: !!t.inclusive,
      }));
    }

    if (body.createdBy) cfg.createdBy = String(body.createdBy);
    if (body.reason) cfg.reason = String(body.reason);
    if (body.effectiveFrom) cfg.effectiveFrom = new Date(body.effectiveFrom);
    cfg.activate = !!body.activate;

    // -------------------------
    // Validate numeric fields
    // -------------------------
    if (
      typeof cfg.globalDiscountPercent === "number" &&
      cfg.globalDiscountPercent < 0
    )
      return res
        .status(400)
        .json({ error: "globalDiscountPercent must be >= 0" });

    if (
      typeof cfg.serviceChargePercent === "number" &&
      cfg.serviceChargePercent < 0
    )
      return res
        .status(400)
        .json({ error: "serviceChargePercent must be >= 0" });

    if (Array.isArray(cfg.taxes)) {
      for (const t of cfg.taxes) {
        if (typeof t.percent !== "number" || t.percent < 0)
          return res
            .status(400)
            .json({ error: "Each tax.percent must be a non-negative number" });
      }
    }

    // -------------------------
    // 🆕 Normalize Offers (if any)
    // -------------------------
    if (Array.isArray(body.offers)) {
      cfg.offers = body.offers.map((offer) => ({
        code: offer.code?.toUpperCase().trim() || "",
        title: offer.title || "",
        description: offer.description || "",
        discountType: offer.discountType === "flat" ? "flat" : "percent", // default: percent
        discountValue: Number(offer.discountValue || 0),
        minOrderValue: Number(offer.minOrderValue || 0),
        maxDiscountValue: Number(offer.maxDiscountValue || 0),
        isActive: typeof offer.isActive === "boolean" ? offer.isActive : true,
        validFrom: offer.validFrom ? new Date(offer.validFrom) : new Date(),
        validTill: offer.validTill ? new Date(offer.validTill) : null,
      }));

      logger &&
        logger.debug &&
        logger.debug("createPricingConfig normalized offers", {
          count: cfg.offers.length,
          codes: cfg.offers.map((o) => o.code),
        });
    }

    // -------------------------
    // Ensure Admin Doc Exists
    // -------------------------
    logger &&
      logger.debug &&
      logger.debug("createPricingConfig fetching Admin doc", {
        restaurantId: rid,
      });

    let adminDoc = await Admin.findOne({ restaurantId: rid });
    if (!adminDoc) {
      logger &&
        logger.warn &&
        logger.warn("createPricingConfig admin not found", {
          restaurantId: rid,
        });
      return res.status(404).json({ error: "Admin not found" });
    }

    // -------------------------
    // Add pricing config (via static helper)
    // -------------------------
    logger &&
      logger.debug &&
      logger.debug("createPricingConfig calling Admin.addPricingConfig", {
        restaurantId: rid,
      });

    const updatedAdmin = await Admin.addPricingConfig(rid, cfg);

    // -------------------------
    // Publish and Return
    // -------------------------
    const out = sanitizeAdmin(updatedAdmin);
    safePublish(`restaurant:${rid}:staff`, {
      event: "pricingConfigCreated",
      data: {
        version:
          (cfg && cfg.version) ||
          (updatedAdmin &&
            updatedAdmin.pricingConfigs &&
            updatedAdmin.pricingConfigs.slice(-1)[0]?.version) ||
          null,
      },
    });

    logger &&
      logger.info &&
      logger.info("createPricingConfig completed", { restaurantId: rid });
    return res.status(201).json({ admin: out });
  } catch (err) {
    logger &&
      logger.error &&
      logger.error(
        "Create pricing config error:",
        err && err.stack ? err.stack : err
      );
    return next(err);
  }
}

//=====================================================================================================
/**
 * Activate an existing pricing config version
 * PATCH /api/:rid/admin/pricing/:version/activate
 *
 * Body: {} (no body required)
 */
async function activatePricingVersion(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter activatePricingVersion", { params: req.params });

  try {
    if (req.body) {
      delete req.body.restaurantId;
    }

    if (!rid || !version) {
      logger &&
        logger.warn &&
        logger.warn("activatePricingVersion missing params", { rid, version });
      return res
        .status(400)
        .json({ error: "Missing restaurant id (rid) or version" });
    }

    const verNum = Number(version);
    if (!Number.isFinite(verNum) || verNum <= 0)
      return res.status(400).json({ error: "Invalid version" });

    logger &&
      logger.debug &&
      logger.debug(
        "activatePricingVersion calling Admin.activatePricingVersion",
        { restaurantId: rid, version: verNum }
      );

    const updatedAdmin = await Admin.activatePricingVersion(rid, verNum);

    safePublish(`restaurant:${rid}:staff`, {
      event: "pricingConfigActivated",
      data: { version: verNum },
    });

    logger &&
      logger.info &&
      logger.info("activatePricingVersion completed", {
        restaurantId: rid,
        version: verNum,
      });

    return res.json(sanitizeAdmin(updatedAdmin));
  } catch (err) {
    logger &&
      logger.error &&
      logger.error(
        "Activate pricing version error:",
        err && err.stack ? err.stack : err
      );
    return next(err);
  }
}
//======================================================================================================
//=====================================================================================================

// Pricing Subscription Status Endpoint

/**
 * GET /api/:rid/admin/subscription/status
 * Returns current subscription plan, limits and features
 */
/**
 * GET /api/:rid/admin/subscription/status
 */
const getSubscriptionStatus = async (req, res) => {
  const { rid } = req.params;

  try {
    logger.info("admin.getSubscriptionStatus invoked", { rid });

    const admin = await Admin.findOne(
      { restaurantId: rid },
      { subscription: 1 }
    ).lean();

    if (!admin) {
      logger.warn("admin.getSubscriptionStatus → Admin not found", { rid });
      return res.status(404).json({ error: "Admin not found" });
    }

    const sub = admin.subscription || {};

    return res.json({
      success: true,
      plan: sub.plan || "FREE",
      expiry: sub.expiry || null,
      limits: sub.limits || {},
      features: sub.features || {},
    });
  } catch (err) {
    logger.error("admin.getSubscriptionStatus error", {
      rid,
      error: err?.message,
    });
    return res.status(500).json({ error: "Failed to fetch subscription" });
  }
};

//======================================================================================================
//======================================================================================================

// Pricing Subscription Upgrade Endpoint
/**
 * POST /api/:rid/admin/subscription/upgrade
 * Upgrades subscription plan for a restaurant (admin only)
 */
/**
 * POST /api/:rid/admin/subscription/upgrade
 */
const upgradeSubscription = async (req, res) => {
  const { rid } = req.params;
  const { plan } = req.body;

  try {
    logger.info("admin.upgradeSubscription invoked", {
      rid,
      requestedPlan: plan,
    });

    const allowedPlans = ["FREE", "STANDARD", "PRO"];
    if (!allowedPlans.includes(plan)) {
      logger.warn("admin.upgradeSubscription invalid plan", { rid, plan });
      return res.status(400).json({ error: "Invalid subscription plan" });
    }

    const {
      SUBSCRIPTIONS,
      getPlan,
      validateUpgrade,
    } = require("../config/subscriptions");

    const targetPlan = getPlan(plan);

    const admin = await Admin.findOne({ restaurantId: rid });
    if (!admin) {
      logger.warn("admin.upgradeSubscription admin not found", { rid });
      return res.status(404).json({ error: "Admin not found" });
    }

    // Prevent “upgrade” to same plan
    if (admin.subscription?.plan === plan) {
      return res.status(400).json({
        error: `Already on ${plan} plan`,
      });
    }

    // Snapshot tenant usage
    const menuCount = await Menu.aggregate([
      { $match: { restaurantId: rid } },
      { $unwind: "$categories" },
      { $unwind: "$categories.items" },
      { $count: "count" },
    ]);

    const tableCount = await Table.countDocuments({ restaurantId: rid });
    const staffCount = admin.staffAliases?.length || 0;

    const snapshot = {
      tables: tableCount,
      staff: staffCount,
      menuItems: menuCount[0]?.count || 0,
    };

    // Validate upgrade/downgrade
    const validation = validateUpgrade(
      admin.subscription?.plan || "FREE",
      plan,
      snapshot
    );

    if (!validation.allowed) {
      logger.warn("admin.upgradeSubscription downgrade blocked", {
        rid,
        errors: validation.errors,
      });

      return res.status(400).json({
        error: "Cannot downgrade due to usage exceeding plan limits",
        details: validation.errors,
      });
    }

    // APPLY NEW PLAN
    admin.subscription = {
      plan,
      limits: targetPlan.limits,
      features: targetPlan.features,
      expiry: null, // or billing-based date
      createdAt: new Date(),
    };

    await admin.save();

    logger.info("admin.upgradeSubscription SUCCESS", { rid, newPlan: plan });

    return res.json({
      success: true,
      message: `Subscription upgraded to ${plan}`,
      plan,
    });
  } catch (err) {
    logger.error("admin.upgradeSubscription error", {
      rid,
      error: err?.message,
    });
    return res.status(500).json({ error: "Failed to upgrade subscription" });
  }
};

//======================================================================================================
//======================================================================================================

// Exported functions
module.exports = {
  login,
  staffLogin,
  generateOverrideToken,
  getMenu,
  updateMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  restoreMenuItem,
  updateCategory,
  deleteCategory,
  getAllCategories,
  addCategory,
  getAnalytics,
  exportReport,
  updateTable,
  updateAdminPin,
  updateStaffPin,
  updateStaffAliases,
  updateConfig,
  reopenBill,
  addWaiterName,
  updateWaiterName,
  deleteWaiterName,
  getWaiterNames,
  // Pricing endpoints
  getPricingConfigs,
  createPricingConfig,
  activatePricingVersion,
  // Subscription endpoints
  getSubscriptionStatus,
  upgradeSubscription,
};
