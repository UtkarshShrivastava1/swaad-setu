// App.tsx
import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context + Guards
import { Outlet } from "react-router-dom";
import { TenantGuard } from "./components/TenantGuard";
import { TenantProvider } from "./context/TenantContext";

// Public pages
import RestaurantRegistration from "./pages/RestaurantRegistration";
import RestaurantSelector from "./pages/RestaurantSelector";

// Lazy load tenant pages
const TenantDashboardHomePage = lazy(() => import("./pages/HomePage"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const StaffLogin = lazy(() => import("./pages/StaffLogin"));
const WebPageHomePage = lazy(() => import("./pages/webpage/pages/HomePage"));
const SwaadsetuLanding = lazy(() => import("./pages/webpage/pages/swaadsetu-landing"));
const About = lazy(() => import("./pages/webpage/pages/About"));
const Features = lazy(() => import("./pages/webpage/pages/Features"));
const FAQ = lazy(() => import("./pages/webpage/pages/FAQ"));
const Blogs = lazy(() => import("./pages/webpage/pages/Blogs"));
const Pricing = lazy(() => import("./pages/webpage/pages/Pricing"));

const AdminDashboard = lazy(
  () => import("./pages/AdminDashboard/AdminDashboard")
);
const MenuDashboard = lazy(
  () => import("./pages/AdminDashboard/MenuManagement/MenuDashboard")
);
const StaffDashboard = lazy(
  () => import("./pages/StaffDashboard/StaffDashboard")
);

// Loader
const LoadingScreen = () => (
  <div className="w-full h-screen flex items-center justify-center text-lg font-semibold text-gray-600">
    Loading...
  </div>
);

import { SocketProvider } from "./context/SocketContext";

// Layout wrapper for tenant routes
function TenantLayout() {
  return (
    <TenantGuard>
      <SocketProvider>
        <Outlet />
      </SocketProvider>
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
          <Route path="/" element={<SwaadsetuLanding />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/features" element={<Features />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
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
            <Route index element={<TenantDashboardHomePage />} />

            {/* 🔑 Login Pages */}
            <Route path="admin-login" element={<AdminLogin />} />
            <Route path="staff-login" element={<StaffLogin />} />

            {/* 🧭 Admin Dashboard */}
            <Route path="admin-dashboard" element={<AdminDashboard />} />
            <Route path="admin/menu" element={<MenuDashboard />} />

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
      <ToastContainer />
    </TenantProvider>
  );
}

export default App;
