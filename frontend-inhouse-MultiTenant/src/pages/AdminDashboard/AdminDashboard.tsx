import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Header from "../AdminDashboard/components/Layout/Header";
import FooterNav from "./components/Layout/Footer";

import CategoryManagement from "../AdminDashboard/components/Layout/CategoryManagement";
import MenuEdit from "../AdminDashboard/components/Layout/EditMenu";
import MenuManagement from "../AdminDashboard/components/Layout/MenuPage";
import OrdersManagement from "../AdminDashboard/components/Layout/OrderPage";
import TableManagementPage from "../AdminDashboard/components/Layout/TableManagement";
import Dashboard from "./components/Layout/Dashboard";
import MorePage from "./More/MorePage";

import { getOrder } from "../../../src/api/admin/order.api";
import { useTables } from "../AdminDashboard/hooks/useTables";
import { useTenant } from "../../context/TenantContext";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { rid: ridFromUrl } = useParams();
  const { rid, setRid } = useTenant();

  useEffect(() => {
    if (ridFromUrl) {
      setRid(ridFromUrl);
    }
  }, [ridFromUrl, setRid]);

  const tokenKey = `adminToken_${rid}`;

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "menu" | "categories" | "orders" | "tables" | "more"
  >("dashboard");

  const [view, setView] = useState<"list" | "edit" | "create">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMenuItem, setSelectedMenuItem] = useState<any | null>(null);

  const { tables } = useTables(rid);
  const [ordersCount, setOrdersCount] = useState(0);

  useEffect(() => {
    if (!rid) return;
    // Check token presence in localStorage or cookies
    const token = localStorage.getItem(tokenKey); // or document.cookie parsing for cookies

    if (!token) {
      // If no token, redirect to login or home
      navigate(`/t/${rid}/admin-login`); // Adjust path accordingly
    }
    // Optionally, you could verify token validity by calling an API or decoding it here
  }, [navigate, rid, tokenKey]);


  // ====== Logout ======
  const handleLogout = () => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem(tokenKey);
    navigate(`/t/${rid}/admin-login`);
  };

  // ====== Fetch Active Orders ======
  useEffect(() => {
    if (!rid) return;
    async function fetchOrdersCount() {
      try {
        const orders = await getOrder(rid);
        const activeCount = orders.filter(
          (o) => o.status !== "completed" && o.status !== "cancelled"
        ).length;
        setOrdersCount(activeCount);
      } catch (err) {
        console.error("❌ Failed to fetch active orders:", err);
      }
    }

    fetchOrdersCount();

    // Auto-refresh every 20 seconds
    const interval = setInterval(fetchOrdersCount, 20000);
    return () => clearInterval(interval);
  }, [rid]);

  // ====== Render ======
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ===== Header ===== */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenNotifications={() => setActiveTab("notifications")}
        onLogout={handleLogout}
        waiterCallCount={tables.filter((t) => t.waiterCalled).length}
      />

      {/* ===== Main Content ===== */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full pb-24">
        {/* 🏠 Dashboard */}
        {activeTab === "dashboard" && view === "list" && (
          <Dashboard setActiveTab={setActiveTab} />
        )}

        {/* 🍽️ Menu Management */}
        {activeTab === "menu" && (
          <>
            {view === "list" && (
              <MenuManagement
                setActiveTab={setActiveTab}
                onEdit={(item: any) => {
                  setSelectedMenuItem(item);
                  setView("edit");
                }}
                onCreate={() => setView("create")}
              />
            )}
            {view === "edit" && selectedMenuItem && (
              <MenuEdit
                item={selectedMenuItem}
                setActiveTab={setActiveTab}
                onBack={() => {
                  setView("list");
                  setSelectedMenuItem(null);
                }}
              />
            )}
            {view === "create" && (
              <MenuEdit onBack={() => setView("list")} isNew={true} />
            )}
          </>
        )}

        {/* 🗂️ Category Management */}
        {activeTab === "categories" && (
          <CategoryManagement onBack={() => setActiveTab("menu")} />
        )}

        {/* 🧾 Orders */}
        {activeTab === "orders" && <OrdersManagement />}

        {/* 🪑 Table Management */}
        {activeTab === "tables" && <TableManagementPage />}

        {/* ⚙️ More */}
        {activeTab === "more" && <MorePage />}
      </main>

      {/* ===== Footer Navigation ===== */}
      <FooterNav
        activeTab={activeTab}
        onTabChange={(newTab) => {
          setActiveTab(newTab);
          setView("list");
        }}
        ordersCount={ordersCount} // ✅ show live order count
      />
    </div>
  );
}
