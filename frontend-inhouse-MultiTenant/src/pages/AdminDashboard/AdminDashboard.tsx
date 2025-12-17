import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Header from "../../components/common/Header";
import FooterNav from "./components/Layout/Footer";

import CategoryManagement from "../AdminDashboard/components/Layout/CategoryManagement";
import MenuEdit from "../AdminDashboard/components/Layout/EditMenu";
import MenuDashboard from "../AdminDashboard/MenuManagement/MenuDashboard";
import OrdersManagement from "../AdminDashboard/components/Layout/OrderPage";
import TableManagementPage from "../AdminDashboard/components/Layout/TableManagement";
import Dashboard from "./components/Layout/Dashboard";
import MorePage from "./More/MorePage";
import TakeoutOrdersAdmin from "./components/Layout/TakeoutOrdersAdmin"; // Import TakeoutOrdersAdmin

import { getOrder } from "../../../src/api/admin/order.api";
import { getRestaurantByRid } from "../../api/restaurant.api";
import { useTenant } from "../../context/TenantContext";
import { useCalls } from "./hooks/useCalls";
import { useTables } from "../AdminDashboard/hooks/useTables";
import NotificationsView from "./components/Layout/NotificationsView";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { rid: ridFromUrl } = useParams();
  const { rid, setRid, tenant, setTenant } = useTenant();

  useEffect(() => {
    if (ridFromUrl) {
      setRid(ridFromUrl);
    }
  }, [ridFromUrl, setRid]);

  useEffect(() => {
    if (rid && !tenant) {
      getRestaurantByRid(rid)
        .then(setTenant)
        .catch((err) => {
          console.error("Failed to fetch restaurant data:", err);
          // Optionally set an error state to show in the UI
        });
    }
  }, [rid, tenant, setTenant]);

  if (!rid) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading restaurant...</p>
      </div>
    );
  }

  const tokenKey = `adminToken_${rid}`;

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "menu"
    | "categories"
    | "orders"
    | "tables"
    | "more"
    | "notifications"
    | "takeout" // Add takeout to activeTab
  >("dashboard");

  const [view, setView] = useState<"list" | "edit" | "create">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMenuItem, setSelectedMenuItem] = useState<any | null>(null);
  const [isMenuFullscreen, setIsMenuFullscreen] = useState(false);

  const { tables } = useTables(rid);
  const { calls: waiterCalls } = useCalls();
  const [ordersCount, setOrdersCount] = useState(0);
  const [takeoutOrders, setTakeoutOrders] = useState([]); // State for takeout orders

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
        const orders = await getOrder(rid, "all"); // Fetch all orders
        const activeOrders = orders.filter(
          (o) => o.status !== "completed" && o.status !== "cancelled"
        );
        setOrdersCount(activeOrders.length);
        const takeout = activeOrders.filter(
          (o) => String(o.tableNumber) === "999"
        );
        setTakeoutOrders(takeout);
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
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      {!isMenuFullscreen && (
        <Header
          tenant={tenant}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenNotifications={() => setActiveTab("notifications")}
          onLogout={handleLogout}
          waiterCallCount={waiterCalls.length}
          role="admin"
        />
      )}

      {/* ===== Main Content ===== */}
      <main className={`flex-grow p-4 md:p-8 w-full ${activeTab === 'menu' || isMenuFullscreen ? '' : 'pb-24 max-w-7xl mx-auto'}`}>
        {/* 🏠 Dashboard */}
        {activeTab === "dashboard" && view === "list" && (
          <Dashboard setActiveTab={setActiveTab} />
        )}

        {/* 🍽️ Menu Management */}
        {activeTab === "menu" && (
          <>
            {view === "list" && (
              <MenuDashboard
                setActiveTab={setActiveTab}
                onEdit={(item: any) => {
                  setSelectedMenuItem(item);
                  setView("edit");
                }}
                onCreate={() => setView("create")}
                onFullscreenChange={setIsMenuFullscreen}
                isParentFullscreen={isMenuFullscreen}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
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

        {/* 🥡 Takeout */}
        {activeTab === "takeout" && <TakeoutOrdersAdmin orders={takeoutOrders} />}

        {/* 🪑 Table Management */}
        {activeTab === "tables" && <TableManagementPage />}

        {/* ⚙️ More */}
        {activeTab === "more" && <MorePage />}

        {/* 🔔 Notifications */}
        {activeTab === "notifications" && (
          <NotificationsView onBack={() => setActiveTab("dashboard")} />
        )}
      </main>

      {/* ===== Footer Navigation ===== */}
      {!isMenuFullscreen && (
        <FooterNav
          activeTab={activeTab}
          onTabChange={(newTab) => {
            setActiveTab(newTab);
            setView("list");
          }}
          ordersCount={ordersCount} // ✅ show live order count
          takeoutCount={takeoutOrders.length} // Pass takeout count
        />
      )}
    </div>
  );
}
