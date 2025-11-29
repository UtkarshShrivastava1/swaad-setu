# 🔄 Frontend Migration Plan: Single-Tenant → Multi-Tenant

**Project:** Swaad Setu Frontend (In-House)  
**Date:** November 2025  
**Status:** Migration Required

---

## 📋 Executive Summary

The backend has been successfully migrated from single-tenant to multi-tenant architecture with subscription support. The frontend currently remains single-tenant with a hardcoded restaurant ID (`restro10`). This document outlines the comprehensive migration plan to align the frontend with the new multi-tenant backend.

---

## 🔍 Current State Analysis

### ✅ What's Already Multi-Tenant Ready

1. **API Client Structure** (`src/api/client.ts`)

   - Generic, tenant-agnostic HTTP client
   - No hardcoded tenant logic
   - ✅ No changes needed

2. **Authentication Functions**

   - `loginAsAdmin(pin, rid)` - already accepts `rid` parameter
   - `loginAsStaff(pin, rid)` - already accepts `rid` parameter
   - ✅ Signature is correct, just needs dynamic RID

3. **API Endpoints**
   - All endpoints already use pattern: `/api/${RID}/...`
   - Backend routes match: `/api/:rid/...`
   - ✅ Pattern is correct, just needs dynamic RID

### ❌ Critical Issues (Single-Tenant Problems)

#### 1. **Hardcoded Restaurant ID - 24 Occurrences**

Every component/API file contains:

```typescript
const RID = import.meta.env.VITE_RID || "restro10";
```

**Files affected:**

- `src/api/admin/admin.api.ts`
- `src/api/staff/bill.api.ts`
- `src/api/staff/staff.operations.api.ts`
- `src/pages/AdminLogin.tsx`
- `src/pages/StaffLogin.tsx`
- `src/pages/AdminDashboard/AdminDashboard.tsx`
- `src/pages/StaffDashboard/StaffDashboard.tsx`
- `src/pages/AdminDashboard/components/Layout/*.tsx` (12 files)
- `src/pages/StaffDashboard/components/*.tsx` (6 files)

#### 2. **Static Environment Configuration**

`.env` file:

```
VITE_RID=restro10  # ❌ Single tenant only
```

#### 3. **No Tenant Selection Mechanism**

- Landing page (`HomePage.tsx`) directly navigates to login
- No way to choose which restaurant to access
- No tenant discovery/selection UI

#### 4. **No Tenant Registration Flow**

- No UI to register new restaurants
- Backend has `POST /api/tenants/register` but frontend can't use it

#### 5. **No Subscription Awareness**

- Frontend doesn't know about FREE/STANDARD/PRO plans
- No UI to show plan limits or restrictions
- Can't enforce feature access based on subscription

#### 6. **No Multi-Tenant Session Management**

- Can't switch between tenants
- No tenant context in localStorage
- Token doesn't preserve tenant association

---

## 🎯 Migration Strategy

We'll implement a **URL-based multi-tenant architecture** with these approaches:

### Option A: Subdomain-based (Recommended for Production)[But cant use this yet]

```
dominos-sector14.swaadsetu.com
lazeez-biryani.swaadsetu.com
```

### Option B: Path-based (Recommended for Development)

```
swaadsetu.com/t/dominos-sector14
swaadsetu.com/t/lazeez-biryani
```

### Option C: Tenant Selection (Fallback/Landing)

```
swaadsetu.com → Select your restaurant → /admin-login
```

**We'll implement Option B (Path-based) + Option C (Tenant Selection) for maximum flexibility.**

---

## 📝 Detailed Migration Steps

### Phase 1: Tenant Context & Infrastructure

#### Step 1.1: Create Tenant Context

**New file:** `src/context/TenantContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect } from "react";

interface TenantContextType {
  rid: string | null;
  setRid: (rid: string) => void;
  clearRid: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [rid, setRidState] = useState<string | null>(() => {
    return localStorage.getItem("currentRid") || null;
  });

  const setRid = (newRid: string) => {
    localStorage.setItem("currentRid", newRid);
    setRidState(newRid);
  };

  const clearRid = () => {
    localStorage.removeItem("currentRid");
    setRidState(null);
  };

  return (
    <TenantContext.Provider value={{ rid, setRid, clearRid }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
}
```

#### Step 1.2: Create Tenant Utilities

**New file:** `src/utils/tenant.utils.ts`

```typescript
// Extract RID from URL path
export function getRidFromPath(): string | null {
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/t\/([^\/]+)/);
  return match ? match[1] : null;
}

// Extract RID from subdomain
export function getRidFromSubdomain(): string | null {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  if (parts.length > 2 && parts[0] !== "www") {
    return parts[0];
  }
  return null;
}

// Get RID from any source (priority order)
export function detectRid(): string | null {
  return (
    getRidFromPath() ||
    getRidFromSubdomain() ||
    localStorage.getItem("currentRid") ||
    null
  );
}

// Validate RID format
export function isValidRid(rid: string): boolean {
  return /^[a-z0-9-]+$/.test(rid) && rid.length >= 3 && rid.length <= 50;
}
```

#### Step 1.3: Create Tenant Guard Component

**New file:** `src/components/TenantGuard.tsx`

```typescript
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../context/TenantContext";
import { detectRid } from "../utils/tenant.utils";

export function TenantGuard({ children }: { children: React.ReactNode }) {
  const { rid, setRid } = useTenant();
  const navigate = useNavigate();

  useEffect(() => {
    const detectedRid = detectRid();

    if (detectedRid && !rid) {
      setRid(detectedRid);
    } else if (!detectedRid && !rid) {
      // No tenant detected, redirect to selection
      navigate("/select-restaurant", { replace: true });
    }
  }, [rid, setRid, navigate]);

  if (!rid) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
```

---

### Phase 2: New Pages & Components

#### Step 2.1: Restaurant Selection Page

**New file:** `src/pages/RestaurantSelector.tsx`

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../context/TenantContext";
import { isValidRid } from "../utils/tenant.utils";

export default function RestaurantSelector() {
  const [ridInput, setRidInput] = useState("");
  const [error, setError] = useState("");
  const { setRid } = useTenant();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanRid = ridInput.trim().toLowerCase();

    if (!isValidRid(cleanRid)) {
      setError("Invalid restaurant ID format");
      return;
    }

    // Verify restaurant exists (optional API call)
    try {
      const response = await fetch(`/api/${cleanRid}/health`);
      if (!response.ok) {
        setError("Restaurant not found");
        return;
      }
    } catch {
      setError("Unable to connect to restaurant");
      return;
    }

    setRid(cleanRid);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-2xl max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6">
          Select Your Restaurant
        </h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={ridInput}
            onChange={(e) => setRidInput(e.target.value)}
            placeholder="Enter Restaurant ID (e.g., dominos-sector14)"
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg mb-4"
          />

          {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold"
          >
            Continue
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/register-restaurant"
            className="text-emerald-400 text-sm hover:underline"
          >
            Register New Restaurant
          </a>
        </div>
      </div>
    </div>
  );
}
```

#### Step 2.2: Restaurant Registration Page

**New file:** `src/pages/RestaurantRegistration.tsx`

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { client } from "../api/client";

interface RegistrationResponse {
  rid: string;
  adminPin: string;
  staffPin: string;
  loginUrl: string;
  plan: string;
}

export default function RestaurantRegistration() {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegistrationResponse | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await client.post<RegistrationResponse>(
        "/api/tenants/register",
        formData
      );
      setResult(response);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="bg-gray-800 p-8 rounded-2xl max-w-2xl w-full">
          <h1 className="text-2xl font-bold text-emerald-400 mb-6">
            ✅ Registration Successful!
          </h1>

          <div className="space-y-4 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <label className="text-gray-400 text-sm">Restaurant ID</label>
              <div className="text-white font-mono text-lg">{result.rid}</div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <label className="text-gray-400 text-sm">Admin PIN</label>
              <div className="text-white font-mono text-2xl">
                {result.adminPin}
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <label className="text-gray-400 text-sm">Staff PIN</label>
              <div className="text-white font-mono text-2xl">
                {result.staffPin}
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <label className="text-gray-400 text-sm">Subscription Plan</label>
              <div className="text-white font-semibold">{result.plan}</div>
            </div>
          </div>

          <div className="bg-amber-900/30 border border-amber-600 p-4 rounded-lg mb-6">
            <p className="text-amber-200 text-sm">
              ⚠️ Save these credentials securely! You'll need them to access
              your dashboard.
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.setItem("currentRid", result.rid);
              navigate("/admin-login");
            }}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 p-8 rounded-2xl max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6">
          Register Your Restaurant
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">
              Restaurant Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Address</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Phone</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-600 p-3 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register Restaurant"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-emerald-400 text-sm hover:underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 3: Update Existing Components

#### Step 3.1: Update API Files

**File:** `src/api/admin/admin.api.ts`

**Changes:**

```typescript
// ❌ REMOVE
const RID = import.meta.env.VITE_RID || "restro10";

// ✅ ADD - Accept RID as parameter for all functions
export const getMenuItems = async (rid: string) => {
  const response = await client.get(`${BASE_URL}/api/${rid}/admin/menu`);
  return response.data;
};

export const addMenuItem = async (rid: string, menuItem: any) => {
  const response = await client.post(
    `${BASE_URL}/api/${rid}/admin/menu`,
    menuItem
  );
  return response.data;
};

// ... Apply same pattern to all functions
```

#### Step 3.2: Update Login Pages

**File:** `src/pages/AdminLogin.tsx`

**Changes:**

```typescript
// ❌ REMOVE
const rid = import.meta.env.VITE_RID || "restro10";

// ✅ ADD
import { useTenant } from "../context/TenantContext";

export default function AdminLogin() {
  const { rid } = useTenant();
  const navigate = useNavigate();

  if (!rid) {
    return <div>Loading...</div>;
  }

  // ... rest of component uses rid from context
}
```

#### Step 3.3: Update Dashboard Components

Apply similar changes to all dashboard components:

- Remove hardcoded `VITE_RID`
- Import and use `useTenant()` hook
- Pass `rid` to all API calls

---

### Phase 4: Update Routing

**File:** `src/App.tsx`

```typescript
import { TenantProvider } from "./context/TenantContext";
import { TenantGuard } from "./components/TenantGuard";
import RestaurantSelector from "./pages/RestaurantSelector";
import RestaurantRegistration from "./pages/RestaurantRegistration";

function App() {
  return (
    <TenantProvider>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public Routes - No tenant required */}
          <Route path="/select-restaurant" element={<RestaurantSelector />} />
          <Route
            path="/register-restaurant"
            element={<RestaurantRegistration />}
          />

          {/* Tenant-specific routes - Path-based: /t/:rid/... */}
          <Route
            path="/t/:rid/*"
            element={
              <TenantGuard>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/staff-login" element={<StaffLogin />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="/staff-dashboard" element={<StaffDashboard />} />
                  {/* ... other routes */}
                </Routes>
              </TenantGuard>
            }
          />

          {/* Legacy support - Redirect to tenant selector */}
          <Route path="/" element={<RestaurantSelector />} />
          <Route
            path="*"
            element={<Navigate to="/select-restaurant" replace />}
          />
        </Routes>
      </Suspense>
    </TenantProvider>
  );
}
```

---

### Phase 5: Subscription Features

#### Step 5.1: Create Subscription Hook

**New file:** `src/hooks/useSubscription.ts`

```typescript
import { useState, useEffect } from "react";
import { useTenant } from "../context/TenantContext";
import { client } from "../api/client";

interface SubscriptionPlan {
  name: "FREE" | "STANDARD" | "PRO";
  limits: {
    tables: number;
    menuItems: number;
  };
  features: {
    analytics: boolean;
    offersAndCoupons: boolean;
    bulkMenuEditing: boolean;
    splitBilling: boolean;
  };
}

export function useSubscription() {
  const { rid } = useTenant();
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rid) return;

    const fetchPlan = async () => {
      try {
        const response = await client.get(`/api/${rid}/subscription`);
        setPlan(response);
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [rid]);

  const hasFeature = (feature: keyof SubscriptionPlan["features"]) => {
    return plan?.features[feature] ?? false;
  };

  const canAddMore = (resource: "tables" | "menuItems", current: number) => {
    const limit = plan?.limits[resource] ?? 0;
    return current < limit;
  };

  return { plan, loading, hasFeature, canAddMore };
}
```

#### Step 5.2: Create Subscription Badge Component

**New file:** `src/components/SubscriptionBadge.tsx`

```typescript
import { useSubscription } from "../hooks/useSubscription";

export function SubscriptionBadge() {
  const { plan } = useSubscription();

  if (!plan) return null;

  const colors = {
    FREE: "bg-gray-600 text-gray-100",
    STANDARD: "bg-blue-600 text-white",
    PRO: "bg-purple-600 text-white",
  };

  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        colors[plan.name]
      }`}
    >
      {plan.name}
    </div>
  );
}
```

---

### Phase 6: Environment & Configuration

#### Step 6.1: Update .env

```env
# ❌ REMOVE single tenant config
# VITE_RID=restro10

# ✅ ADD multi-tenant config
VITE_API_BASE_URL=http://localhost:5000
VITE_DEFAULT_RID=  # Optional: for development only
VITE_ENABLE_SUBDOMAIN=false  # true for production
VITE_ENABLE_PATH_ROUTING=true

# Other configs
VITE_USER_LINK=http://localhost:5174/
VITE_UPI_ID=8109147565@ptsbi
VITE_UPI_NAME=Utkarsh
VITE_UPI_CURRENCY=INR
VITE_UPI_NOTE=Bill%20Payment
```

#### Step 6.2: Create Environment Types

**New file:** `src/types/env.d.ts`

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_DEFAULT_RID?: string;
  readonly VITE_ENABLE_SUBDOMAIN: string;
  readonly VITE_ENABLE_PATH_ROUTING: string;
  readonly VITE_USER_LINK: string;
  readonly VITE_UPI_ID: string;
  readonly VITE_UPI_NAME: string;
  readonly VITE_UPI_CURRENCY: string;
  readonly VITE_UPI_NOTE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## 🔧 Implementation Checklist

### Pre-Migration

- [ ] Backup current codebase
- [ ] Create migration branch: `feature/multi-tenant-migration`
- [ ] Document all current API endpoints

### Phase 1: Infrastructure

- [ ] Create `TenantContext.tsx`
- [ ] Create `tenant.utils.ts`
- [ ] Create `TenantGuard.tsx`
- [ ] Test context in isolation

### Phase 2: New Pages

- [ ] Create `RestaurantSelector.tsx`
- [ ] Create `RestaurantRegistration.tsx`
- [ ] Test tenant selection flow
- [ ] Test tenant registration flow

### Phase 3: Update API Layer

- [ ] Update `admin.api.ts` (add rid parameter to all functions)
- [ ] Update `staff.operations.api.ts`
- [ ] Update `bill.api.ts`
- [ ] Update `menu.api.ts`
- [ ] Update `table.api.ts`
- [ ] Update `order.api.ts`

### Phase 4: Update Pages

- [ ] Update `AdminLogin.tsx`
- [ ] Update `StaffLogin.tsx`
- [ ] Update `AdminDashboard.tsx`
- [ ] Update `StaffDashboard.tsx`
- [ ] Update all admin dashboard components (12 files)
- [ ] Update all staff dashboard components (8 files)

### Phase 5: Update Routing

- [ ] Wrap App with `TenantProvider`
- [ ] Add path-based routing `/t/:rid/*`
- [ ] Add public routes (selector, registration)
- [ ] Test all route transitions

### Phase 6: Subscription Features

- [ ] Create `useSubscription` hook
- [ ] Create `SubscriptionBadge` component
- [ ] Add plan limits to UI
- [ ] Add feature gates (PRO-only features)

### Phase 7: Testing

- [ ] Test with multiple tenants
- [ ] Test tenant switching
- [ ] Test registration flow
- [ ] Test all CRUD operations per tenant
- [ ] Test subscription limits
- [ ] Test cross-tenant isolation

### Phase 8: Documentation

- [ ] Update README.md
- [ ] Document new routing structure
- [ ] Document tenant management
- [ ] Create deployment guide

---

## 📊 File Change Summary

### Files to Create (8 new files)

1. `src/context/TenantContext.tsx`
2. `src/utils/tenant.utils.ts`
3. `src/components/TenantGuard.tsx`
4. `src/components/SubscriptionBadge.tsx`
5. `src/hooks/useSubscription.ts`
6. `src/pages/RestaurantSelector.tsx`
7. `src/pages/RestaurantRegistration.tsx`
8. `src/types/env.d.ts`

### Files to Modify (30+ files)

- All API files (6 files)
- Login pages (2 files)
- Dashboard pages (2 files)
- Admin dashboard components (12 files)
- Staff dashboard components (8 files)
- `App.tsx`
- `main.tsx`
- `.env`

### Files to Remove

- None (backward compatibility maintained)

---

## 🚀 Deployment Strategy

### Development

1. Use path-based routing: `http://localhost:5173/t/restro10`
2. Enable tenant selector at root
3. Test with multiple local tenants

### Staging

1. Deploy with both path and subdomain support
2. Test with 5-10 real tenant scenarios
3. Verify subscription enforcement

### Production

1. DNS: Configure wildcard subdomain `*.swaadsetu.com`
2. SSL: Wildcard certificate for subdomains
3. CDN: Configure multi-tenant caching
4. Monitor: Track per-tenant metrics

---

## ⚠️ Migration Risks & Mitigation

### Risk 1: Breaking Existing Deployments

- **Mitigation**: Keep `VITE_DEFAULT_RID` env var for backward compatibility
- **Fallback**: If no tenant detected, redirect to selector

### Risk 2: Data Isolation Issues

- **Mitigation**: Extensive testing with multiple tenants
- **Validation**: Check backend tenant validation is working

### Risk 3: Performance with Many Tenants

- **Mitigation**: Implement tenant caching
- **Monitoring**: Track API response times per tenant

### Risk 4: Session Management Complexity

- **Mitigation**: Clear documentation on token/tenant lifecycle
- **Testing**: Test tenant switching scenarios

---

## 📈 Success Metrics

- [ ] Zero cross-tenant data leaks
- [ ] All 24 hardcoded RID references removed
- [ ] Tenant registration < 30 seconds
- [ ] Tenant switching < 2 seconds
- [ ] 100% backward compatibility during migration
- [ ] Zero downtime deployment

---

## 🎯 Timeline Estimate

- **Phase 1-2** (Infrastructure + New Pages): 2-3 days
- **Phase 3-4** (API + Component Updates): 4-5 days
- **Phase 5** (Subscription Features): 2 days
- **Phase 6-7** (Testing): 3-4 days
- **Phase 8** (Documentation): 1 day

**Total Estimated Time**: 12-15 days

---

## 📞 Support & Questions

For questions about this migration:

1. Review backend `CONTEXT.md`
2. Check `SUBSCRIPTION_PATCHES.md` for subscription details
3. Test API endpoints with Postman collection

---

**Status**: Ready for Implementation  
**Priority**: High  
**Complexity**: Medium-High  
**Impact**: Critical (Required for SaaS launch)

swaad-setu(Multi-Tenant)\frontend-inhouse
├── .vscode
│ └── settings.json
├── public
│ └── vite.svg
├── src
│ ├── api
│ │ ├── admin
│ │ │ ├── add.waiter.ts
│ │ │ ├── admin.api.ts
│ │ │ ├── admin.login.ts
│ │ │ ├── bill.api.ts
│ │ │ ├── client.ts
│ │ │ ├── menu.api.ts
│ │ │ ├── order.api.ts
│ │ │ └── table.api.ts
│ │ ├── staff
│ │ │ ├── bill.api.ts
│ │ │ ├── order.api.ts
│ │ │ ├── staff.login.ts
│ │ │ └── staff.operations.api.ts
│ │ └── client.ts
│ ├── assets
│ │ ├── BOwl.png
│ │ ├── order.png
│ │ └── Table.png
│ ├── components
│ ├── pages
│ │ ├── AdminDashboard
│ │ │ ├── components
│ │ │ │ ├── Layout
│ │ │ │ ├── modals
│ │ │ │ ├── Header.tsx
│ │ │ │ └── Sidebar.tsx
│ │ │ ├── hooks
│ │ │ │ ├── useBilling.ts
│ │ │ │ ├── useHistory.ts
│ │ │ │ ├── useOrders.ts
│ │ │ │ ├── usePendingTracker.ts
│ │ │ │ ├── useTables.ts
│ │ │ │ └── useWaiters.ts
│ │ │ ├── AdminDashboard.tsx
│ │ │ └── MenuLayout.tsx
│ │ ├── StaffDashboard
│ │ │ ├── components
│ │ │ │ ├── BillHistory.tsx
│ │ │ │ ├── BillingView.tsx
│ │ │ │ ├── BillModalComponent.tsx
│ │ │ │ ├── ConfirmModal.tsx
│ │ │ │ ├── EditBillModal.tsx
│ │ │ │ ├── Header.tsx
│ │ │ │ ├── OrdersComponent.tsx
│ │ │ │ ├── PaymentModal.tsx
│ │ │ │ ├── StaffDashboard - Shortcut.lnk
│ │ │ │ ├── TableDetail.tsx
│ │ │ │ ├── TablesComponent.tsx
│ │ │ │ ├── temp_BillingView.tsx
│ │ │ │ └── UPIPaymentQR.tsx
│ │ │ ├── hooks
│ │ │ │ ├── useBilling.ts
│ │ │ │ ├── useHistory.ts
│ │ │ │ ├── useOrders.ts
│ │ │ │ ├── usePendingTracker.ts
│ │ │ │ ├── useTables.ts
│ │ │ │ └── useWaiters.ts
│ │ │ ├── types
│ │ │ │ └── index.ts
│ │ │ ├── utils
│ │ │ │ ├── extractors.ts
│ │ │ │ ├── formatters.ts
│ │ │ │ ├── mergeHelpers.ts
│ │ │ │ ├── mergeOrdersIntoTables.ts
│ │ │ │ └── normalize.ts
│ │ │ ├── views
│ │ │ │ ├── BillingViewWrapper.tsx
│ │ │ │ ├── DashboardView.tsx
│ │ │ │ ├── NotificationsView.tsx
│ │ │ │ └── TableView.tsx
│ │ │ └── StaffDashboard.tsx
│ │ ├── AdminLogin.tsx
│ │ ├── HomePage.tsx
│ │ └── StaffLogin.tsx
│ ├── utils
│ │ └── tax.utils.ts
│ ├── App.css
│ ├── App.tsx
│ ├── index.css
│ └── main.tsx
├── .env
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── tree.js
├── tree.txt
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

---
