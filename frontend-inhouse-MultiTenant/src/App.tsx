// App.tsx
import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

// Context + Guards
import { Outlet } from "react-router-dom";
import { TenantGuard } from "./components/TenantGuard";
import { TenantProvider } from "./context/TenantContext";

// Public pages
import RestaurantRegistration from "./pages/RestaurantRegistration";
import RestaurantSelector from "./pages/RestaurantSelector";

// Lazy load tenant pages
const Landing = lazy(() => import("./pages/HomePage"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const StaffLogin = lazy(() => import("./pages/StaffLogin"));

const AdminDashboard = lazy(
  () => import("./pages/AdminDashboard/AdminDashboard")
);
const StaffDashboard = lazy(
  () => import("./pages/StaffDashboard/StaffDashboard")
);

// Admin Subpages
const MenuManagement = lazy(
  () => import("./pages/AdminDashboard/components/Layout/MenuPage")
);
const OrdersManagement = lazy(
  () => import("./pages/AdminDashboard/components/Layout/OrderPage")
);
const TableManagementPage = lazy(
  () => import("./pages/AdminDashboard/components/Layout/TableManagement")
);
const CreateMenu = lazy(
  () => import("./pages/AdminDashboard/components/Layout/CreateMenu")
);
const EditMenu = lazy(
  () => import("./pages/AdminDashboard/components/Layout/EditMenu")
);

// Loader
const LoadingScreen = () => (
  <div className="w-full h-screen flex items-center justify-center text-lg font-semibold text-gray-600">
    Loading...
  </div>
);

// Layout wrapper for tenant routes
function TenantLayout() {
  return (
    <TenantGuard>
      <Outlet />
    </TenantGuard>
  );
}

function App() {
  return (
    <TenantProvider>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* -------------------------------------------------- */}
          {/* PUBLIC ROUTES */}
          {/* -------------------------------------------------- */}
          <Route path="/" element={<RestaurantSelector />} />
          <Route path="/select-restaurant" element={<RestaurantSelector />} />
          <Route
            path="/register-restaurant"
            element={<RestaurantRegistration />}
          />

          {/* -------------------------------------------------- */}
          {/* TENANT ROUTES (/t/:rid/...) */}
          {/* -------------------------------------------------- */}
          <Route path="/t/:rid" element={<TenantLayout />}>
            {/* 👋 Landing inside tenant */}
            <Route index element={<Landing />} />

            {/* 🔑 Login Pages */}
            <Route path="admin-login" element={<AdminLogin />} />
            <Route path="staff-login" element={<StaffLogin />} />

            {/* 🧭 Admin Dashboard */}
            <Route path="admin-dashboard" element={<AdminDashboard />} />

            {/* Admin Subpages */}
            <Route path="menu" element={<MenuManagement />} />
            <Route path="menu/create" element={<CreateMenu />} />
            <Route path="menu/edit" element={<EditMenu />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="tables" element={<TableManagementPage />} />

            {/* 👨‍🍳 Staff Dashboard */}
            <Route path="staff-dashboard" element={<StaffDashboard />} />

            {/* Default nested route */}
            <Route path="*" element={<Navigate to="admin-login" replace />} />
          </Route>

          {/* -------------------------------------------------- */}
          {/* GLOBAL FALLBACK */}
          {/* -------------------------------------------------- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </TenantProvider>
  );
}

export default App;
