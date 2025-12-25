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
import { useSocket } from "../../context/SocketContext";
import { useTenant } from "../../context/TenantContext";
import { useCalls } from "./hooks/useCalls";
import { useTables } from "../AdminDashboard/hooks/useTables";
import NotificationsView from "./components/Layout/NotificationsView";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { rid: ridFromUrl } = useParams();
  const { rid, setRid, tenant, setTenant } = useTenant();
  const socket = useSocket();

  const { tables } = useTables(rid);
  const { calls: waiterCalls } = useCalls(rid);
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

  const [ordersCount, setOrdersCount] = useState(0);
  const [takeoutOrders, setTakeoutOrders] = useState<any[]>([]); // State for takeout orders

  // State to hold all active orders for easier management
  const [allActiveOrders, setAllActiveOrders] = useState<any[]>([]);

  const tokenKey = `adminToken_${rid}`;

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

  // ====== Socket.IO Listeners for Orders ======
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder: any) => {
      console.log("Admin: Received new_order event:", newOrder);
      setAllActiveOrders(prev => [...prev, newOrder]);
      setOrdersCount(prev => prev + 1);
      if (String(newOrder.tableNumber) === "999") {
        setTakeoutOrders(prev => [...prev, newOrder]);
      }
    };

    const handleOrderUpdate = (updatedOrder: any) => {
      console.log("Admin: Received order_update event:", updatedOrder);
      setAllActiveOrders(prev => {
        const existingOrderIndex = prev.findIndex(o => o._id === updatedOrder._id);
        if (existingOrderIndex > -1) {
          const newOrders = [...prev];
          newOrders[existingOrderIndex] = updatedOrder;

          // Handle status changes for ordersCount
          if (
            (updatedOrder.status === "completed" || updatedOrder.status === "cancelled") &&
            (prev[existingOrderIndex].status !== "completed" && prev[existingOrderIndex].status !== "cancelled")
          ) {
            setOrdersCount(c => c - 1);
          } else if (
            (updatedOrder.status !== "completed" && updatedOrder.status !== "cancelled") &&
            (prev[existingOrderIndex].status === "completed" || prev[existingOrderIndex].status === "cancelled")
          ) {
            setOrdersCount(c => c + 1);
          }

          // Handle takeout orders
          if (String(updatedOrder.tableNumber) === "999") {
            setTakeoutOrders(tPrev => {
              const existingTakeoutIndex = tPrev.findIndex(o => o._id === updatedOrder._id);
              if (existingTakeoutIndex > -1) {
                if (updatedOrder.status === "completed" || updatedOrder.status === "cancelled") {
                  return tPrev.filter(o => o._id !== updatedOrder._id);
                }
                const newTakeouts = [...tPrev];
                newTakeouts[existingTakeoutIndex] = updatedOrder;
                return newTakeouts;
              } else if (updatedOrder.status !== "completed" && updatedOrder.status !== "cancelled") {
                return [...tPrev, updatedOrder];
              }
              return tPrev;
            });
          } else {
            setTakeoutOrders(tPrev => tPrev.filter(o => o._id !== updatedOrder._id));
          }

          return newOrders;
        } else {
          // If order not found, it might be a new order that somehow missed new_order event
          // Or an order that became active from a non-active state
          if (updatedOrder.status !== "completed" && updatedOrder.status !== "cancelled") {
            setOrdersCount(c => c + 1);
            if (String(updatedOrder.tableNumber) === "999") {
              setTakeoutOrders(tPrev => [...tPrev, updatedOrder]);
            }
            return [...prev, updatedOrder];
          }
        }
        return prev;
      });
    };

    socket.on("new_order", handleNewOrder);
    socket.on("order_update", handleOrderUpdate);

    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("order_update", handleOrderUpdate);
    };
  }, [socket]);

  // ====== Initial Fetch for Orders (non-polling) ======
  useEffect(() => {
    if (!rid) return;
    async function fetchInitialOrders() {
      try {
        const orders = await getOrder(rid, "all"); // Fetch all orders
        const active = orders.filter(
          (o: any) => o.status !== "completed" && o.status !== "cancelled"
        );
        setAllActiveOrders(active);
        setOrdersCount(active.length);
        setTakeoutOrders(active.filter((o: any) => String(o.tableNumber) === "999"));
      } catch (err) {
        console.error("❌ Failed to fetch initial orders:", err);
      }
    }
    fetchInitialOrders();
  }, [rid]);

  // ====== Logout ======
  const handleLogout = () => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem(tokenKey);
    navigate(`/t/${rid}/admin-login`);
  };

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
