# MENU SUBSCRIPTION PATCHES

## Subscription Guards for Menu Features in admin.controller.js

Below are the patched menu-related functions with proper subscription checks.

---

### ANALYSIS SUMMARY

**Functions requiring NO guards (FREE plan - basic CRUD):**

- `getMenu` - Read-only
- `deleteMenuItem` - Soft delete (sets isActive=false)
- `restoreMenuItem` - Restore soft-deleted items
- `deleteCategory` - Delete category
- `getAllCategories` - Read-only

**Functions requiring guards:**

- `updateMenu` - Can modify variants, modifiers, dynamic pricing in items
- `addMenuItem` - Can create items with variants/modifiers + needs limit enforcement
- `updateMenuItem` - Can update variants, modifiers, scheduling, automation
- `updateCategory` - Can modify combo pricing (potentially dynamic)

---

## IMPLEMENTATION NOTES

Since the subscription middleware functions return Express middleware (requiring next() calls), we need to implement inline checks within the controller functions. The checks should:

1. Verify the current plan from `req.subscription.plan`
2. Check if incoming data contains advanced features
3. Reject with 403 if feature not allowed in current plan

---

## PATCHED FUNCTIONS

### 1. PATCHED: updateMenu

```javascript
// --- PATCH START (subscription guard added) ---
async function updateMenu(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter updateMenu", { params: req.params });

  try {
    const { rid } = req.params;
    const incoming = req.body || {};

    // Remove any client-provided restaurantId
    delete req.body.restaurantId;

    if (!rid) {
      logger && logger.warn && logger.warn("updateMenu missing rid");
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    }

    // ✅ SUBSCRIPTION GUARDS - Check for advanced features
    const currentPlan = req.subscription?.plan || "FREE";
    const { isFeatureAllowed } = require("../../config/subscriptions");

    // Check if incoming items contain variants
    if (incoming.menu && Array.isArray(incoming.menu)) {
      const hasVariants = incoming.menu.some(item =>
        item.variants && Array.isArray(item.variants) && item.variants.length > 0
      );
      if (hasVariants && !isFeatureAllowed(currentPlan, "variants")) {
        return res.status(403).json({
          error: "Menu variants require STANDARD plan or higher",
          upgrade: true,
          currentPlan,
          requiredFeature: "variants"
        });
      }

      // Check if incoming items contain modifiers
      const hasModifiers = incoming.menu.some(item =>
        item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0
      );
      if (hasModifiers && !isFeatureAllowed(currentPlan, "modifiers")) {
        return res.status(403).json({
          error: "Menu modifiers require STANDARD plan or higher",
          upgrade: true,
          currentPlan,
          requiredFeature: "modifiers"
        });
      }

      // Check for PRO-only features: scheduling, automation, dynamic pricing
      const hasScheduling = incoming.menu.some(item =>
        item.availableFrom || item.availableTo || item.scheduleRules
      );
      const hasAutomation = incoming.menu.some(item =>
        item.autoHide || item.autoRestock || item.automationRules
      );
      const hasDynamicPricing = incoming.menu.some(item =>
        item.dynamicPrice || item.priceRules || item.timeBased Pricing
      );

      if ((hasScheduling || hasAutomation || hasDynamicPricing) && currentPlan !== "PRO") {
        return res.status(403).json({
          error: "Advanced menu features (scheduling, automation, dynamic pricing) require PRO plan",
          upgrade: true,
          currentPlan,
          requiredPlan: "PRO"
        });
      }
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
// --- PATCH END ---
```

---

### 2. PATCHED: addMenuItem

```javascript
// --- PATCH START (subscription guard added) ---
async function addMenuItem(req, res, next) {
  logger?.info?.("Enter addMenuItem", { params: req.params });
  try {
    const { rid } = req.params;
    const { item } = req.body || {};

    // Remove any client-provided restaurantId
    delete req.body.restaurantId;

    if (!rid)
      return res.status(400).json({ error: "Missing restaurant id (rid)" });
    if (!item || typeof item !== "object")
      return res.status(400).json({ error: "Valid menu item required" });
    if (!item.name || typeof item.name !== "string")
      return res.status(400).json({ error: "Item name required" });
    if (typeof item.price !== "number")
      return res.status(400).json({ error: "Item price required (number)" });

    // ✅ SUBSCRIPTION GUARDS
    const currentPlan = req.subscription?.plan || "FREE";
    const {
      isFeatureAllowed,
      getLimit,
    } = require("../../config/subscriptions");

    // Check for variants
    if (
      item.variants &&
      Array.isArray(item.variants) &&
      item.variants.length > 0
    ) {
      if (!isFeatureAllowed(currentPlan, "variants")) {
        return res.status(403).json({
          error: "Menu variants require STANDARD plan or higher",
          upgrade: true,
          currentPlan,
          requiredFeature: "variants",
        });
      }
    }

    // Check for modifiers
    if (
      item.modifiers &&
      Array.isArray(item.modifiers) &&
      item.modifiers.length > 0
    ) {
      if (!isFeatureAllowed(currentPlan, "modifiers")) {
        return res.status(403).json({
          error: "Menu modifiers require STANDARD plan or higher",
          upgrade: true,
          currentPlan,
          requiredFeature: "modifiers",
        });
      }
    }

    // Check for PRO features
    const hasScheduling =
      item.availableFrom || item.availableTo || item.scheduleRules;
    const hasAutomation =
      item.autoHide || item.autoRestock || item.automationRules;
    const hasDynamicPricing =
      item.dynamicPrice || item.priceRules || item.timeBasedPricing;

    if (
      (hasScheduling || hasAutomation || hasDynamicPricing) &&
      currentPlan !== "PRO"
    ) {
      return res.status(403).json({
        error:
          "Advanced menu features (scheduling, automation, dynamic pricing) require PRO plan",
        upgrade: true,
        currentPlan,
        requiredPlan: "PRO",
      });
    }

    // ✅ CHECK MENU ITEM LIMIT
    if (!Menu) {
      return res.status(501).json({ error: "Menu collection not available" });
    }

    const existingMenu = await Menu.findOne({ restaurantId: rid });
    const currentCount = existingMenu?.items?.length || 0;
    const allowedLimit = getLimit(currentPlan, "menuItems");

    if (currentCount >= allowedLimit) {
      return res.status(403).json({
        error: `Menu item limit exceeded: ${currentCount}/${allowedLimit}. Upgrade your plan.`,
        upgrade: true,
        currentPlan,
        limitKey: "menuItems",
        allowed: allowedLimit,
      });
    }

    const categoryName =
      typeof item.category === "string" && item.category.trim() !== ""
        ? item.category
        : "Uncategorized";

    // Stable business id
    const itemId =
      typeof item.itemId === "string"
        ? item.itemId
        : `i_${new mongoose.Types.ObjectId().toHexString()}`;

    const newItem = {
      itemId,
      name: item.name.trim(),
      description: item.description || "",
      price: item.price,
      currency: item.currency || "INR",
      image: item.image || null,
      isActive: typeof item.isActive === "boolean" ? item.isActive : true,
      isVegetarian: !!item.isVegetarian,
      preparationTime:
        typeof item.preparationTime === "number" ? item.preparationTime : null,
      metadata: item.metadata || {},
    };

    logger?.debug?.("addMenuItem prepared", {
      rid,
      itemId,
      name: newItem.name,
    });

    // Ensure single source of truth menu (no duplicate)
    const upsertUpdate = {
      $setOnInsert: {
        restaurantId: rid,
        version: 1,
        title: `${rid} menu`,
        isActive: true,
        createdAt: new Date(),
      },
      $push: { items: newItem },
      $set: { updatedAt: new Date() },
    };

    let menuDoc = null;
    try {
      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        menuDoc = await Menu.findOneAndUpdate(
          { restaurantId: rid },
          upsertUpdate,
          { new: true, upsert: true, session }
        );

        // Ensure category exists or update it
        await Menu.updateOne(
          { _id: menuDoc._id, "categories.name": { $ne: categoryName } },
          { $push: { categories: { name: categoryName, itemIds: [itemId] } } },
          { session }
        );

        await Menu.updateOne(
          {
            _id: menuDoc._id,
            "categories.name": categoryName,
            "categories.itemIds": { $ne: itemId },
          },
          { $push: { "categories.$.itemIds": itemId } },
          { session }
        );
      });
      session.endSession();
    } catch (err) {
      logger?.warn?.(
        "Transaction failed, fallback to non-transactional upsert",
        {
          restaurantId: rid,
          error: err.message,
        }
      );

      menuDoc = await Menu.findOneAndUpdate(
        { restaurantId: rid },
        upsertUpdate,
        { new: true, upsert: true }
      );

      await Menu.updateOne(
        { _id: menuDoc._id, "categories.name": { $ne: categoryName } },
        { $push: { categories: { name: categoryName, itemIds: [itemId] } } }
      );

      await Menu.updateOne(
        {
          _id: menuDoc._id,
          "categories.name": categoryName,
          "categories.itemIds": { $ne: itemId },
        },
        { $push: { "categories.$.itemIds": itemId } }
      );
    }

    // Guarantee only one menu per restaurant
    await Menu.updateMany(
      { restaurantId: rid, _id: { $ne: menuDoc._id } },
      { $set: { isActive: false } }
    );

    // Ensure Admin record
    await Admin.updateOne(
      { restaurantId: rid },
      {
        $setOnInsert: { restaurantId: rid, hashedPin: "" },
        $set: { updatedAt: Date.now() },
      },
      { upsert: true }
    );

    safePublish(`restaurant:${rid}:staff`, {
      event: "menuItemAdded",
      data: {
        itemId,
        name: newItem.name,
        category: categoryName,
        createdAt: new Date(),
      },
    });

    logger?.info?.("addMenuItem completed successfully", { rid, itemId });

    return res.status(201).json({
      item: {
        itemId: newItem.itemId,
        name: newItem.name,
        price: newItem.price,
        description: newItem.description,
        category: categoryName,
        image: newItem.image,
        isVegetarian: newItem.isVegetarian,
        preparationTime: newItem.preparationTime,
      },
    });
  } catch (err) {
    logger?.error?.("Add menu item error", err);
    return next(err);
  }
}
// --- PATCH END ---
```

---

### 3. PATCHED: updateMenuItem

```javascript
// --- PATCH START (subscription guard added) ---
async function updateMenuItem(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter updateMenuItem", { params: req.params });
  try {
    const { rid, itemId } = req.params;
    const updates = req.body || {};

    // Remove any client-provided restaurantId
    delete req.body.restaurantId;

    if (!rid || !itemId) {
      return res.status(400).json({ error: "Missing restaurant id or itemId" });
    }
    if (!Menu) {
      return res.status(501).json({ error: "Menu collection not available" });
    }

    // ✅ SUBSCRIPTION GUARDS - Check for advanced features in updates
    const currentPlan = req.subscription?.plan || "FREE";
    const { isFeatureAllowed } = require("../../config/subscriptions");

    // Check if updates contain variants
    if (
      updates.variants &&
      Array.isArray(updates.variants) &&
      updates.variants.length > 0
    ) {
      if (!isFeatureAllowed(currentPlan, "variants")) {
        return res.status(403).json({
          error: "Menu variants require STANDARD plan or higher",
          upgrade: true,
          currentPlan,
          requiredFeature: "variants",
        });
      }
    }

    // Check if updates contain modifiers
    if (
      updates.modifiers &&
      Array.isArray(updates.modifiers) &&
      updates.modifiers.length > 0
    ) {
      if (!isFeatureAllowed(currentPlan, "modifiers")) {
        return res.status(403).json({
          error: "Menu modifiers require STANDARD plan or higher",
          upgrade: true,
          currentPlan,
          requiredFeature: "modifiers",
        });
      }
    }

    // Check for PRO-only features
    const hasScheduling =
      updates.availableFrom || updates.availableTo || updates.scheduleRules;
    const hasAutomation =
      updates.autoHide || updates.autoRestock || updates.automationRules;
    const hasDynamicPricing =
      updates.dynamicPrice || updates.priceRules || updates.timeBasedPricing;

    if (
      (hasScheduling || hasAutomation || hasDynamicPricing) &&
      currentPlan !== "PRO"
    ) {
      return res.status(403).json({
        error:
          "Advanced menu features (scheduling, automation, dynamic pricing) require PRO plan",
        upgrade: true,
        currentPlan,
        requiredPlan: "PRO",
      });
    }

    const menu = await Menu.findOne({ restaurantId: rid, isActive: true });
    if (!menu) return res.status(404).json({ error: "Menu not found" });

    const item = menu.items.find((i) => i.itemId === itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

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
    return res.json({ success: true, item });
  } catch (err) {
    logger && logger.error && logger.error("updateMenuItem error:", err);
    return next(err);
  }
}
// --- PATCH END ---
```

---

### 4. PATCHED: updateCategory

```javascript
// --- PATCH START (subscription guard added) ---
async function updateCategory(req, res, next) {
  logger &&
    logger.info &&
    logger.info("Enter updateCategory", { params: req.params });
  try {
    const { rid, categoryId } = req.params;
    const updates = req.body || {};

    // Remove any client-provided restaurantId
    delete req.body.restaurantId;

    if (!rid || !categoryId)
      return res
        .status(400)
        .json({ error: "Missing restaurant id or categoryId" });

    // ✅ SUBSCRIPTION GUARD - Check for dynamic pricing in combo meta
    const currentPlan = req.subscription?.plan || "FREE";

    // If updating comboMeta with dynamic pricing features, require PRO
    if (updates.comboMeta) {
      const hasDynamicCombo =
        updates.comboMeta.dynamicPricing ||
        updates.comboMeta.timeBased ||
        updates.comboMeta.priceRules;

      if (hasDynamicCombo && currentPlan !== "PRO") {
        return res.status(403).json({
          error: "Dynamic combo pricing requires PRO plan",
          upgrade: true,
          currentPlan,
          requiredPlan: "PRO",
        });
      }
    }

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
// --- PATCH END ---
```

---

## FUNCTIONS WITHOUT PATCHES (FREE PLAN - No Guards Needed)

The following functions perform basic FREE-tier operations and require NO subscription guards:

- **getMenu** - Read-only operation
- **deleteMenuItem** - Soft delete (sets isActive = false)
- **restoreMenuItem** - Restore soft-deleted items
- **deleteCategory** - Delete category
- **getAllCategories** - Read-only operation

---

## NEXT STEPS

1. **Replace** the existing functions in `controllers/admin.controller.js` with the patched versions above
2. **Ensure** the subscription middleware `loadSubscription` is applied to the admin routes
3. **Test** each endpoint with different subscription tiers
4. **Verify** that feature checks properly block unauthorized advanced features

---

## SUBSCRIPTION FEATURE MAPPING

```
FREE PLAN:
✓ Basic menu CRUD (create, read, update, delete, restore)
✓ Basic item fields (name, price, description, category, image)
✓ Update categories (basic)
✗ Variants
✗ Modifiers
✗ Bulk editing
✗ Scheduling
✗ Automation
✗ Dynamic pricing

STANDARD PLAN:
✓ Everything in FREE
✓ Variants
✓ Modifiers
✓ Bulk editing
✗ Scheduled menus
✗ Automation
✗ Dynamic pricing

PRO PLAN:
✓ Everything in STANDARD
✓ Scheduled menus (availableFrom, availableTo, scheduleRules)
✓ Menu automation (autoHide, autoRestock, automationRules)
✓ Dynamic pricing (dynamicPrice, priceRules, timeBasedPricing)
```

---

**END OF SUBSCRIPTION PATCHES**
