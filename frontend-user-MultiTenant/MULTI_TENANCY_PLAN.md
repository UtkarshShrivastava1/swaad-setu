# Multi-Tenancy Conversion Plan for frontend-user

This document outlines the plan to convert the `frontend-user` application from a single-tenant to a multi-tenant architecture. It aligns with the `backend` and `frontend-inhouse` architecture while addressing the unique "Hybrid Entry" requirement (QR Code vs. Manual Table Selection) for customers.

## Core Multi-Tenancy Strategy

The core identifier is `restaurantId` (`rid`).
The secondary identifier is `tableId` (optional at entry, required for ordering).

These identifiers will be propagated via URL parameters, validated by Middleware/Guards, and stored in React Contexts.

## Plan

### 1. Introduce Tenant & Table Routing

- **Objective:** specific views are scoped under a unique tenant identifier, with support for specific table entry points.
- **Action:**
  - Modify `frontend-user/src/App.tsx` to handle nested and capture routes:
    - **Base Route:** `/t/:rid/*` -> Wraps the application in `TenantGuard`.
    - **General Entry:** `/t/:rid/` -> Loads Menu (Manual Table Mode).
    - **QR Entry:** `/t/:rid/table/:tableId` -> Captures Table ID -> Sets Context -> Redirects to Menu (Auto Table Mode).
  - Implement `TenantGuard` component:
    - Validates `rid` format.
    - Checks existence (optional API check).
    - Stores `rid` in `TenantContext`.

### 2. Implement Tenant & Table Contexts

- **Objective:** Global access to `rid` (mandatory) and `tableId` (dynamic).
- **Action:**
  - **TenantContext:**
    - Create `frontend-user/src/context/TenantContext.tsx`.
    - Stores active `rid`.
    - Provides `useTenant()` hook.
  - **TableContext:**
    - Create `frontend-user/src/context/TableContext.tsx`.
    - Stores active `tableId`.
    - Persists to `sessionStorage` (ensures table selection survives page refresh but clears on new session).
    - Provides `setTableId(id)` and `clearTable()`.

### 3. Create Tenant Utility Functions and Storage

- **Objective:** Centralize logic for URL generation and storage.
- **Action:**
  - Create `frontend-user/src/utils/tenant.utils.ts`.
  - Create `frontend-user/src/stores/tenantStore.ts` (for persistence).
  - **Key Utilities:**
    - `getTenantPath(rid, path)`: Helper to build internal links.
    - `getTenantApiPath(rid, path)`: Helper to build API endpoints.

### 4. Update API Client and Service Calls

- **Objective:** Ensure all API requests are strictly scoped to the active tenant.
- **Action:**
  - Modify `frontend-user/src/api/client.ts`:
    - Integrate `useTenant()` logic.
    - Interceptor: Automatically inject `/api/${rid}/...` into request URLs.
  - **Order API Update:**
    - When placing an order (`order.api.ts`), specifically inject the `tableId` from `TableContext` into the payload.

### 5. Adapt Client-Side State Management (Cart)

- **Objective:** Prevent data leakage between restaurants.
- **Action:**
  - Update `cart.store.ts` / `CartContext`.
  - **Logic:** When `rid` changes (user visits a different restaurant link), the Cart **must** be cleared automatically.

### 6. Handling Entry Scenarios & Table Selection

- **Objective:** Handle both "Scanned QR" and "Instagram Link" users seamlessly.
- **Action:**
  - **Scenario A: QR Scan (Auto-Lock)**
    - User hits `/t/:rid/table/:id`.
    - App sets `TableContext` to `:id`.
    - User flows to Menu.
    - Cart & Checkout do _not_ ask for table (already known).
  - **Scenario B: General Link (Manual Selection)**
    - User hits `/t/:rid`.
    - `TableContext` is empty.
    - **Enforcement:** When user clicks "Add to Cart" or "Checkout", trigger a **Table Selection Modal**.
    - User selects table -> `TableContext` updated -> Order proceeds.

### 7. Testing Strategy

- **Objective:** Verify isolation and flow.
- **Action:**
  - **Unit Tests:** specific tests for `TenantGuard` and `TableContext` logic.
  - **Flow Tests:**
    1.  Open General Link -> Add Item -> Verify "Select Table" modal appears.
    2.  Open QR Link -> Add Item -> Verify NO modal appears.
    3.  Switch URL to different `rid` -> Verify Cart clears.

## Next Steps

1.  **Refactor Routing & Guards** (App.tsx, TenantGuard).
2.  **Build Contexts** (TenantContext, TableContext).
3.  **Update API Layer** (client.ts).
4.  **Implement Table Selection Modal** & Enforcement Logic.
