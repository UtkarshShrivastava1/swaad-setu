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

    const handleOrderUpdate = (updatedOrder: any) => {
      console.log("Admin: Received order_update event:", updatedOrder);
      setAllActiveOrders((prev) => {
        const existingOrderIndex = prev.findIndex(
          (o) => o._id === updatedOrder._id
        );

        let newOrders = [...prev];
        let orderCountChange = 0;


        const isNewOrderActive =
          updatedOrder.status !== "completed" &&
          updatedOrder.status !== "cancelled";

        if (existingOrderIndex > -1) {
          const oldOrder = prev[existingOrderIndex];
          newOrders[existingOrderIndex] = updatedOrder;

          const wasOldOrderActive =
            oldOrder.status !== "completed" && oldOrder.status !== "cancelled";

          // Adjust ordersCount based on status change
          if (wasOldOrderActive && !isNewOrderActive) {
            orderCountChange = -1;
          } else if (!wasOldOrderActive && isNewOrderActive) {
            orderCountChange = 1;
          }
        } else {
          // This is a genuinely new order (not an update to an existing one)
          if (isNewOrderActive) {
            newOrders.push(updatedOrder);
            orderCountChange = 1;
          }
        }

        // Handle takeout orders
        if (String(updatedOrder.tableNumber) === "999") {
          setTakeoutOrders((tPrev) => {
            const existingTakeoutIndex = tPrev.findIndex(
              (o) => o._id === updatedOrder._id
            );
            if (isNewOrderActive) {
              if (existingTakeoutIndex > -1) {
                // Update existing takeout order
                const newTakeouts = [...tPrev];
                newTakeouts[existingTakeoutIndex] = updatedOrder;
                return newTakeouts;
              } else {
                // Add new takeout order
                takeoutOrdersChange = 1; // Increment for `ordersCount` for `takeoutOrders`
                return [...tPrev, updatedOrder];
              }
            } else {
              // Remove if no longer active
              if (existingTakeoutIndex > -1) {
                takeoutOrdersChange = -1; // Decrement for `ordersCount` for `takeoutOrders`
                return tPrev.filter((o) => o._id !== updatedOrder._id);
              }
            }
            return tPrev;
          });
        } else {
          // If it was a takeout order and now it's not (e.g., tableNumber changed or cleared)
          setTakeoutOrders((tPrev) =>
            tPrev.filter((o) => o._id !== updatedOrder._id)
          );
        }

        setOrdersCount((c) => c + orderCountChange);
        return newOrders;
      });
    };

    socket.on("order_update", handleOrderUpdate);

    return () => {
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
