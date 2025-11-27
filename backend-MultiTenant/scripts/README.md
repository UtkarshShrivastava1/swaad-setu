# Menu Migration Scripts

This directory contains scripts for migrating menu data from the Admin collection to the Menu collection.

## Migration Script

### `migrate-admin-menu-to-menu.js`

This script migrates existing menu data from Admin documents to the Menu collection.

#### Features:

- Identifies Admin documents with menu data (legacy format)
- Creates corresponding Menu documents with proper structure
- Preserves categories, taxes, and service charges
- Generates detailed migration report
- Handles edge cases (existing menus, missing data, etc.)

#### How to Run:

```bash
node scripts/migrate-admin-menu-to-menu.js
```

#### What it Does:

1. Scans all Admin documents for menu-related data
2. For each Admin with menu data:
   - Creates a new Menu document with:
     - `restaurantId` from Admin
     - `items` from Admin.menu
     - `categories` from Admin.categories
     - `taxes` from Admin.taxes
     - `serviceCharge` from Admin.serviceCharge
   - Preserves all menu data in proper Menu collection format
3. Generates a report showing:
   - Total restaurants processed
   - Number of successful migrations
   - Number of skipped restaurants
   - Any errors encountered

#### Safety Features:

- Checks for existing active menus to prevent duplicates
- Skips restaurants with no menu data
- Comprehensive error handling
- Detailed logging and reporting

## Test Script

### `test-migration.js`

This script creates test data and verifies the migration works correctly.

#### How to Run:

```bash
node scripts/test-migration.js
```

## Migration Process

1. The migration script looks for menu data in Admin documents in these fields:

   - `menu` or `items` or `dishes` (menu items)
   - `categories` (menu categories)
   - `taxes` or `taxPercent` (tax information)
   - `serviceCharge` (service charge percentage)

2. For each Admin document with menu data, it creates a new Menu document with:

   - Proper schema validation
   - Correct data types
   - Default values for missing fields
   - Version tracking

3. The original Admin documents are left unchanged for safety
   - Optional cleanup can be done after verifying successful migration

## Expected Data Format

The migration handles these data formats:

### Menu Items

```javascript
[
  {
    itemId: "i_1",
    name: "Item Name",
    price: 100,
    description: "Item description",
  },
];
```

### Categories

```javascript
[
  {
    name: "Category Name",
    itemIds: ["i_1", "i_2"],
  },
];
```

### Taxes

```javascript
[
  {
    name: "GST",
    percent: 18,
  },
];
```

### Service Charge

```javascript
serviceCharge: 10; // 10%
```
