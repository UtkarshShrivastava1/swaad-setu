# Swaad Setu Frontend (Multi-Tenant)

**Project:** Swaad Setu (Restaurant Management System) - In-House Frontend
**Stack:** React, TypeScript, Vite, Tailwind CSS
**Architecture:** Multi-Tenant (URL-based)

## 📖 Project Overview

Swaad Setu is a comprehensive restaurant management platform. This frontend application serves as the interface for both Restaurant Admins (Managers/Owners) and Staff (Waiters/Cashiers).

The application has recently undergone a migration from a single-tenant architecture to a **multi-tenant** architecture, allowing multiple restaurants to be managed via the same frontend instance using unique Restaurant IDs (`rid`).

## 🏗 Architecture & Key Concepts

### 1. Multi-Tenancy Strategy
*   **URL Structure:** Tenants are identified by the URL path: `/t/:rid/...` (e.g., `/t/dominos-sector14/admin-dashboard`).
*   **Tenant Context:** `src/context/TenantContext.tsx` manages the current `rid` (Restaurant ID), `admin`, and `tenant` state globally.
*   **Tenant Guard:** `src/components/TenantGuard.tsx` ensures a valid `rid` is present before rendering tenant-specific routes.
*   **Discovery:**
    *   **Restaurant Selector:** `/select-restaurant` allows users to manually enter an ID.
    *   **Registration:** `/register-restaurant` allows onboarding new tenants.

### 2. Core Directories
*   `src/api`: API integration layer.
    *   **Crucial Rule:** All API functions MUST accept `rid` as a parameter to target the correct tenant backend.
    *   Files are organized by role (`admin/`, `staff/`) and domain (`menu`, `bill`, `order`).
*   `src/pages`: Top-level route components.
    *   `AdminDashboard/`: Complex layout with sidebar and sub-views for management.
    *   `StaffDashboard/`: Touch-optimized interface for POS operations.
*   `src/components`: Reusable UI components.
*   `src/hooks`: Custom React hooks (e.g., `useBilling`, `useOrders`) that abstract logic and data fetching.

### 3. Authentication
*   **Admin Login:** `/t/:rid/admin-login` (PIN-based).
*   **Staff Login:** `/t/:rid/staff-login` (PIN-based).
*   Auth tokens are typically stored in `localStorage` or handled via `client.ts` interceptors (verify implementation details in `client.ts`).

## 🚀 Building and Running

The project uses **Vite** for fast development and building.

### Development
```bash
npm install   # Install dependencies
npm run dev   # Start development server (localhost:5173)
```

### Production Build
```bash
npm run build   # Type-check and build for production
npm run preview # Preview the production build locally
```

### Linting
```bash
npm run lint    # Run ESLint
```

## ⚠️ Development Conventions & "Gotchas"

1.  **Do NOT Hardcode `rid`**:
    *   Legacy code might have `const RID = "restro10"`. **This is strictly forbidden.**
    *   Always use `const { rid } = useTenant()` inside components.
    *   Always pass `rid` from the component to API functions.

2.  **API Calls**:
    *   Use the pre-configured clients in `src/api/client.ts`.
    *   Ensure all new API endpoints follow the `/api/:rid/...` pattern.

3.  **Routing**:
    *   Tenant-specific pages must be nested under the `/t/:rid` route in `App.tsx`.
    *   Use `TenantGuard` to protect these routes.

4.  **Migration Status**:
    *   The project is in the advanced stages of migration.
    *   Refer to `FRONTEND_MIGRATION_PLAN.md` for the original roadmap, but trust the codebase (especially `App.tsx` and `api/`) for the current truth.
    *   If you encounter hardcoded `"restro10"` strings, refactor them to use dynamic context.

## 📄 Key Documentation Files
*   `FRONTEND_MIGRATION_PLAN.md`: Detailed plan for the single-to-multi-tenant migration.
*   `Task_Context.md`: Current task context and high-level goals.
*   `README.md`: General project setup info.
