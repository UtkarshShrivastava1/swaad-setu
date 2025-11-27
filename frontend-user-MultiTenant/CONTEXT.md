a **clean, structured, developer-friendly CONTEXT.md** that documents swaad-setu full evolution:

- from **Single-Tenant → Multi-Tenant backend**
- plus **Subscription System integration**
- what changed, why, and how the new system works

This is exactly the kind of file teams keep in their repo for clarity.

---

# 📘 **CONTEXT.md — Swad Setu: Single-Tenant → Multi-Tenant Migration + Subscription System**

\*Last updated: **Nov 2025\***

---

# 📌 1. INTRODUCTION

SwadSetu originally started as a **single-restaurant backend**, where all data (orders, bills, tables, menu, staff) belonged to **one business instance**.

But over time, the goal expanded:

- Offer SwadSetu to **many restaurants**
- Each restaurant must have **isolated data**
- One server + one DB must support **100+ tenants**
- Provide **separate admin/staff login per tenant**
- Add a **SaaS subscription model**

This file explains the entire refactor:

✔ What we had before
✔ Problems in the single-tenant design
✔ How we converted it to multi-tenant
✔ New registration + automatic tenant provisioning
✔ How routing, middleware, DB structure changed
✔ Subscription system (FREE → STANDARD → PRO)

---

# 📌 2. WHAT WE HAD BEFORE (Single Tenant System)

### **2.1 Routing (Old)**

All routes were global, like:

```
/orders/...
/tables/...
/admin/login
/bills/create
/menu/update
```

No restaurant ID.

### **2.2 Models (Old)**

Every model had:

```
restaurantId <❌ missing>
```

We stored everything as if **only one restaurant exists**.

### **2.3 Authentication (Old)**

JWT tokens contained:

```
{ role: "admin" }
```

No concept of _which_ restaurant the token belongs to.

### **2.4 Database Problems (Old)**

❌ No tenant isolation
❌ If we onboarded 100 restaurants, their data would mix
❌ No ability to scale
❌ No unique routes per tenant
❌ No multi-tenant validation

---

# 📌 3. WHAT WE HAVE NOW (Multi-Tenant Engine)

SwadSetu now runs as a true SaaS backend.

---

# 🚀 3.1 New Routing System

Every tenant gets their own namespace:

```
/api/:rid/orders
/api/:rid/tables
/api/:rid/bills
/api/:rid/admin/login
/api/:rid/calls
```

Example:

```
/api/dominos-sector14/orders
/api/lazeez-biryani-9988/admin/login
```

---

# 🚀 3.2 Tenant Validator Middleware

A new middleware:

```
validateRestaurant
```

● Ensures `:rid` exists
● Ensures tenant is valid
● Blocks cross-tenant access
● Removes any client-injected restaurantId (security)

This made the platform **securely multi-tenant**.

---

# 🚀 3.3 Updated Models (Restaurant-Aware)

Every model (Order, Bill, Table, Call, Menu…) now includes:

```js
restaurantId: { type: String, required: true }
```

This gives **hard isolation** between tenants.

---

# 🚀 3.4 New Tenant Registration System

Added:

```
POST /api/tenants/register
```

This endpoint:

✔ Creates a new **Restaurant ID (RID)**
✔ Creates default **Admin PIN (1111)**
✔ Creates default **Staff PIN (2222)**
✔ Auto-seeds:

- 5 tables
- default menu categories
- menu items baseline

✔ Returns:

```json
{
  "rid": "dominos-aadarsh-nagar-9163",
  "adminPin": "1111",
  "staffPin": "2222",
  "loginUrl": "/api/dominos-aadarsh-nagar-9163/admin/login"
}
```

---

# 🚀 3.5 Tenant-Aware Authentication

JWT payload now includes:

```
{
  restaurantId: "<rid>",
  role: "admin" | "staff"
}
```

Auth middleware verifies:

- Token is valid
- Token belongs to this tenant (`rid`)
- Role checks (admin/staff)

This blocks cross-tenant attacks.

---

# 🚀 3.6 Multi-Tenant Socket.IO Support

Sockets are now namespaced by restaurant:

```
/rooms/{restaurantId}
```

This ensures:

✔ Table updates stay inside that tenant
✔ Orders are isolated
✔ Kitchen screens do not receive noise from other restaurants

---

# 📌 4. NEW: Subscription System (FREE → STANDARD → PRO)

We added a full SaaS subscription layer inside the multi-tenant engine.

---

# ✔ 4.1 Subscription Plans

### **FREE**

- 10 Tables
- 50 Menu Items
- Basic Billing
- No analytics
- No offers/coupons
- No bulk editing

### **STANDARD**

- 30 Tables
- 200 Menu Items
- Standard Analytics
- Basic offers
- Tax control

### **PRO**

- Unlimited tables
- Unlimited menu items
- Advanced billing engine
- Coupons, auto-discounts
- Bulk menu editing
- Split billing
- Advanced analytics

---

# ✔ 4.2 New Subscription Config File

`config/subscriptions.js`

Contains:

- plan definitions
- feature flags
- limit values
- helper functions:

  - `isFeatureAllowed`
  - `getLimit`
  - `getPlan`

---

# ✔ 4.3 Subscription Enforcement Middleware

`subscription.middleware.js` adds:

### 1. `loadSubscription`

Loads tenant plan into request.

### 2. `requirePlan("STANDARD")`

Blocks action if tenant’s plan is too low.

### 3. `requireFeature("offersAndCoupons")`

Enforces PRO-only features.

### 4. `enforceLimit("tables", ...)`

Checks tenant’s table/menu limits before insert.

---

# ✔ 4.4 Subscription Enforcement in Routes

### **Tables**

```
enforceLimit("tables")
```

### **Menu Items**

```
enforceLimit("menuItems")
requireFeature("bulkMenuEditing")
```

### **Orders**

```
requireFeature("splitBilling")
```

### **Billing**

```
requireFeature("offersAndCoupons")
```

### **Admin (pricing)**

```
requirePlan("STANDARD")
```

---

# 📌 5. NEW Server Boot System

We added a beautiful system-overview boot console that shows:

- All tenants
- Their RID
- Their menu/table counts
- Socket.IO status
- DB status
- Boot time

This significantly helps debugging multi-tenancy at scale.

---

# 📌 6. FINAL ARCHITECTURE OVERVIEW

### ✔ Multi-Tenant Routing

### ✔ Tenant Registration + Automatic Provisioning

### ✔ Tenant-Isolated JWT Auth

### ✔ Tenant-Isolated DB Models

### ✔ Socket.IO Tenant Rooms

### ✔ Subscription System

### ✔ Limit Enforcement

### ✔ Feature Enforcement

### ✔ Server Boot Diagnostics

### ✔ Fully secured (no cross-tenant access)

The backend is now a **true SaaS engine**, ready for scaling to 100s of restaurants across cities.

---

swaad-setu(Multi-Tenant)\backend)
Exclude: node_modules, uploads, .git, .next; MaxDepth: 5

├── .vscode
│ ├── settings.json
├── common
│ ├── libs
│ │ ├── helpers.js
│ │ ├── jwt.js
│ │ ├── logger.js
│ │ ├── pricingHelper.js
│ ├── middlewares
│ │ ├── auth.middleware.js
│ │ ├── rateLimit.middleware.js
│ │ ├── role.middleware.js
│ │ ├── subscription.middleware.js
│ │ ├── validate.middleware.js
├── config
│ ├── index.js
│ ├── subscriptions.js
├── controllers
│ ├── admin.controller.js
│ ├── bill.controller.js
│ ├── call.controller.js
│ ├── order.controller.js
│ ├── table.controller.js
│ ├── tenant.controller.js
├── db
│ ├── mongoose.js
│ ├── redis.js
├── models
│ ├── admin.model.js
│ ├── bill.model.js
│ ├── call.model.js
│ ├── combo.model.js
│ ├── menu.model.js
│ ├── order.model.js
│ ├── table.model.js
├── routes
│ ├── admin.route.js
│ ├── bill.route.js
│ ├── call.route.js
│ ├── order.route.js
│ ├── table.route.js
│ ├── tenant.route.js
├── scripts
│ ├── README.md
│ ├── backfill_table_numbers.js
│ ├── checkAdmin.js
│ ├── fix-duplicate-index.js
│ ├── migrate-admin-menu-to-menu.js
│ ├── registerRestaurant.js
│ ├── resetAdminPins.js
│ ├── test-migration.js
│ ├── testOrderCreate.js
├── seeders
│ ├── adminSeeder.js
├── services
│ ├── socket.service.js
├── utils
│ ├── computeTotalsFromConfig.js
├── .env
├── CONTEXT.md
├── SUBSCRIPTION_PATCHES.md
├── Swad Setu - Full API.postman_collection.json
├── app.js
├── debug-db.js
├── package-lock.json
├── package.json
├── routes.md
├── server.js
├── tree.js
├── tree.txt
├── upsertMenu.js
