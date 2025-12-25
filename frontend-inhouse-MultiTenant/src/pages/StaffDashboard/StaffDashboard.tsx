import {
  AlertCircle,
  Bell, // Import Package icon for Takeout
  ClipboardList,
  History,
  Package,
  ShoppingCart,
  Utensils,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import Header from "../../components/common/Header";
import AddOrderModal from "../AdminDashboard/components/modals/AddOrderModal"; // Import AddOrderModal
import QRCodeModal from "../AdminDashboard/components/modals/QRCodeModal";
import BillHistory from "./components/BillHistory";
import BillingView from "./components/BillingView";
import NotificationsView from "./components/NotificationsView";
import OrdersComponent from "./components/OrdersComponent";
import TableDetail from "./components/TableDetail";
import { TablesComponent } from "./components/TablesComponent";
import { formatINR } from "./utils/formatters";

import { createOrder } from "../../api/admin/order.api"; // Import createOrder
import { getRestaurantByRid } from "../../api/restaurant.api";
import { getBillByOrderId } from "../../api/staff/staff.operations.api";
import { useSocket } from "../../context/SocketContext";
import { useTenant } from "../../context/TenantContext";

import { useBilling } from "./hooks/useBilling";
import { useCalls } from "./hooks/useCalls";
import { useHistory } from "./hooks/useHistory";
import { useOrders } from "./hooks/useOrders";
import { usePendingTracker } from "./hooks/usePendingTracker";
import { useTables } from "./hooks/useTables";
import { useWaiters } from "./hooks/useWaiters";

import TakeoutOrders from "./components/TakeoutOrders";
import type { Order, Table } from "./types";
import type { ApiBill } from "../../api/staff/staff.operations.api"; // Import ApiBill type

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { rid: ridFromUrl } = useParams();
  const { rid: ridFromContext, admin, setRid, tenant, setTenant } = useTenant();
  const socket = useSocket();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const rid = ridFromUrl || ridFromContext || "";

  useEffect(() => {
    if (rid && !tenant) {
      getRestaurantByRid(rid)
        .then((restaurantData) => {
          setTenant(restaurantData);
        })
        .catch((err) => {
          console.error("Failed to fetch restaurant data:", err);
          setError("Failed to load restaurant information.");
        });
    }
  }, [rid, tenant, setTenant]);

  useEffect(() => {
    if (ridFromUrl && ridFromUrl !== ridFromContext) {
      setRid(ridFromUrl);
    }
  }, [ridFromUrl, ridFromContext, setRid]);

  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("dashboard"); // 'dashboard', 'table', 'billing'
  const [activeTab, setActiveTab] = useState("tables");
  const [showBillDetail, setShowBillDetail] = useState<Order | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newCall, setNewCall] = useState(false);
  const [billLoadingId, setBillLoadingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedTableForQr, setSelectedTableForQr] = useState<Table | null>(
    null
  );
  const [currentBillDetails, setCurrentBillDetails] = useState<ApiBill | null>(
    null
  );
  
  const {
    tables,
    setTables,
    isLoading: tablesLoading,
    tableError,
    fetchTables,
  } = useTables(rid);

  const {
    activeOrders,
    orderHistory,
    fetchActiveOrders,
    isLoading: ordersLoading,
    error: ordersError,
    setActiveOrders,
    highlightedOrders, // Destructure highlightedOrders
  } = useOrders(fetchTables, setTables);

  // Notification for new items
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (highlightedOrders.size > 0) {
      highlightedOrders.forEach((newItemIds, orderId) => {
        const order = activeOrders.find((o) => o.id === orderId);
        if (order) {
          const tableDisplay =
            order.tableNumber === "999"
              ? "Takeout"
              : `Table ${order.tableNumber}`;
          toast.info(`New item(s) added to ${tableDisplay} order!`);
        }
      });
    }
  }, [highlightedOrders, activeOrders]);

  const { waiterNames, waitersLoading, waitersError, fetchWaiters } =
    useWaiters(rid);

  const {
    calls,
    fetchCalls,
    handleUpdateCallStatus,
    isLoading: callsLoading,
    error: callsError,
  } = useCalls(rid);

  // Debounced fetch function
  const debouncedFetchActiveOrders = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchActiveOrders();
    }, 800); // 800ms delay
  }, [fetchActiveOrders]);

  // Function to update staff alias for an order
  const handleUpdateOrderStaffAlias = async (orderId: string, newAlias: string) => {
    if (!rid || !orderId) {
      toast.error("Restaurant ID or Order ID not found.");
      return;
    }
    try {
      const staffToken = localStorage.getItem(`staffToken_${rid}`) || "";
      if (!staffToken) {
        toast.error("Staff not authenticated.");
        return;
      }
      const apiBase = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(
        `${apiBase}/api/${rid}/orders/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${staffToken}`,
          },
          body: JSON.stringify({ staffAlias: newAlias }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update staff alias (${res.status})`);
      }
      toast.success(`Staff alias for order ${orderId.slice(-5)} updated to ${newAlias}`);
      fetchActiveOrders(); // Refresh orders to reflect the change
    } catch (err: any) {
      console.error("Failed to update staff alias:", err);
      toast.error(err.message || "Failed to update staff alias.");
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder: Order) => {
      console.log("Received new_order event:", newOrder);
      toast.success(
        `New order received for Table ${newOrder.tableNumber || "Takeout"}`
      );
      debouncedFetchActiveOrders();
    };

    const handleOrderUpdate = (updatedOrder: Order) => {
      console.log("Received order_update event:", updatedOrder);
      // Refetch all orders to ensure data is correctly normalized, but do it with a debounce
      debouncedFetchActiveOrders();
    };

    socket.on("new_order", handleNewOrder);
    socket.on("order_update", handleOrderUpdate);

    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("order_update", handleOrderUpdate);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [socket, debouncedFetchActiveOrders]);


  useEffect(() => {
    if (callsLoading) {
      return;
    }

    setTables((currentTables) => {
      let changed = false;
      const callTableIdSet = new Set(calls.map((call) => String(call.tableId)));

      const updatedTables = currentTables.map((table) => {
        const normalizedTableId = String(table._id || table.id);

        const newWaiterCalled = callTableIdSet.has(normalizedTableId);

        if (table.waiterCalled !== newWaiterCalled) {
          changed = true;
          return { ...table, waiterCalled: newWaiterCalled };
        }
        return table;
      });

      if (changed) {
        return updatedTables;
      }
      return currentTables;
    });
  }, [calls, setTables, callsLoading]);

  useEffect(() => {
    const previousCalls = JSON.parse(sessionStorage.getItem("calls") || "[]");
    if (calls.length > previousCalls.length) {
      setNewCall(true);
      setTimeout(() => setNewCall(false), 3000);

      const newIncomingCalls = calls.filter(
        (call) =>
          !previousCalls.some((prevCall: any) => prevCall._id === call._id)
      );

      newIncomingCalls.forEach((newCallItem: any) => {
        const table = tables.find(
          (t) => String(t._id || t.id) === String(newCallItem.tableId)
        );
        const tableNumber = table ? table.tableNumber : "Unknown";
        toast.info(
          `New call from Table ${tableNumber}! Type: ${newCallItem.type}`
        );
      });
    }
    sessionStorage.setItem("calls", JSON.stringify(calls));
  }, [calls, tables]);

  const { isPending } = usePendingTracker();

  const {
    onRefresh,
    onFinalize,
    onMarkPaid,
    onAddItem,
    onRemoveItem,
    onPatchItem,
    onUpdateStatus,
    onUpdateOrderStatus,
  } = useBilling(
    showBillDetail,
    setShowBillDetail,
    activeOrders,
    setActiveOrders
  );

  const {
    billHistory,
    summary,
    pagination,
    fetchBillHistory,
    isHistoryLoading: isBillHistoryLoading,
    historyError: billHistoryError,
  } = useHistory(rid);

  const loading = tablesLoading || ordersLoading;

  useEffect(() => {
    if (!rid) return;

    const token =
      localStorage.getItem(`staffToken_${rid}`) ||
      localStorage.getItem("staffToken");

    if (!token) {
      navigate(`/t/${rid}/staff-login`);
      return;
    }

    fetchActiveOrders();
    fetchWaiters();
    fetchCalls();

    console.log("Staff Dashboard useEffect - rid:", rid);
    console.log("Staff Dashboard useEffect - tenant:", tenant);
    console.log("Staff Dashboard useEffect - callsError:", callsError);

    const interval = setInterval(() => {
      if (view === "dashboard") {
        // fetchActiveOrders(); // Replaced by socket event
        // fetchTables(); // Replaced by socket event
        // fetchCalls(); // Replaced by socket event
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate, view, rid, fetchActiveOrders, fetchWaiters, fetchTables]);

  useEffect(() => {
    const fn = () => {
      setView("dashboard");
      setActiveTab("tables");
      setShowBillDetail(null);
      setSelectedTable(null);
      fetchActiveOrders();
    };

    window.addEventListener("staff:gotoTablesTab", fn);
    return () => window.removeEventListener("staff:gotoTablesTab", fn);
  }, [fetchActiveOrders]);

  const handleLogout = () => {
    if (rid) {
      localStorage.removeItem(`staffToken_${rid}`);
    }
    localStorage.removeItem("staffToken");
    navigate(`/t/${rid}/staff-login`);
  };

  const handleCreateTakeoutOrder = async (formData: any) => {
    if (!rid) {
      toast.error("Restaurant ID not found.");
      return;
    }
    try {
      const payload = {
        orderType: "takeout",
        customerName: formData.customer,
        // No tableId or sessionId for takeout
      };
      await createOrder(rid, payload);
      toast.success("Takeout order created successfully!");
      fetchActiveOrders(); // Refresh orders
      setIsAddOrderModalOpen(false); // Close modal
    } catch (error) {
      console.error("Failed to create takeout order:", error);
      toast.error("Failed to create takeout order.");
    }
  };

  const handleGenerateAndOpenBill = async (order: Order) => {
    const orderId = order?._id || order?.id || null;
    if (!orderId) {
      alert("Invalid Order ID");
      return;
    }

    const staffToken = localStorage.getItem(`staffToken_${rid}`) || "";
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    setBillLoadingId(orderId);

    try {
      let billData;

      try {
        billData = await getBillByOrderId(rid, orderId);
        if (!billData || !billData._id) {
          throw new Error("Missing bill ID from existing bill.");
        }
      } catch (err: any) {
        // Log the error for debugging purposes but proceed to try creating a new one
        console.warn("No existing bill found or existing bill is invalid. Attempting to create new one…", err);

        const res = await fetch(
          `${apiBase}/api/${rid}/orders/${orderId}/bill`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${staffToken}`,
            },
            body: JSON.stringify({
              staffAlias: order.staffAlias || "Waiter",
              extras: [],
            }),
          }
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Bill creation failed with status ${res.status}`);
        }

        const json = await res.json();
        billData = json.bill || json;
        if (!billData?._id) {
          throw new Error("Bill creation succeeded but no bill ID returned.");
        }
      }

      handleBillView(order, billData); // Pass the original order object and the billData
      setCurrentBillDetails(billData); // Set currentBillDetails state
    } catch (err: any) {
      console.error("💥 Bill fetch/create error:", err);
      alert(err.message || "Unable to fetch or create bill.");
    } finally {
      setBillLoadingId(null);
    }
  };

  const handleTableSelect = (table: Table, order?: Order) => {
    if (order) {
      handleGenerateAndOpenBill(order);
    } else {
      const found =
        tables.find((t) => String(t.id) === String(table.id)) || table;
      setSelectedTable(found as Table);
      setView("table");
    }
  };

  const handleBillView = (order: Order, preFetchedBillData?: ApiBill) => {
    if (!order) {
      setError(`Order not found`);
      return;
    }

    setShowBillDetail(order);
    setCurrentBillDetails(preFetchedBillData || null); // Set currentBillDetails state
    setView("billing");
  };

  const handleConfirmClose = () => {
    setShowConfirmModal(false);
    setView(selectedTable ? "table" : "dashboard");
  };

  const handleBackToDashboard = () => {
    setView("dashboard");
    setSelectedTable(null);
    setShowBillDetail(null);
    setCurrentBillDetails(null); // Reset currentBillDetails
    fetchActiveOrders();
  };

  const handleOpenQrModal = (table: Table) => {
    setSelectedTableForQr(table);
    setIsQrModalOpen(true);
  };

  const filteredTables = useMemo(
    () =>
      tables.filter((table) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return String(table.tableNumber).toLowerCase().includes(q);
      }),
    [tables, searchQuery]
  );

  const filteredOrders = useMemo(
    () =>
      activeOrders.filter((order) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          (String(order.tableNumber) ?? "").toLowerCase().includes(q) ||
          (order.customerName ?? "").toLowerCase().includes(q) ||
          order.id.toLowerCase().includes(q)
        );
      }),
    [activeOrders, searchQuery]
  );

  const takeoutOrders = useMemo(
    () => activeOrders.filter((order) => String(order.tableNumber) === "999"),
    [activeOrders]
  );

  const topError =
    error || tableError || ordersError || waitersError || callsError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-zinc-900 to-gray-800 text-white">
      <Header
        key={rid}
        tenant={tenant}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenNotifications={() => {
          setView("dashboard");
          setActiveTab("notifications");
        }}
        onLogout={handleLogout}
        waiterCallCount={calls.length}
        role="staff"
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {topError && (
          <div className="mb-4 bg-rose-950 border border-rose-800 text-rose-300 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div className="flex-1">
              <strong>Error:</strong> {topError}
            </div>
            <button
              onClick={() => {
                setError(null);
              }}
              className="font-bold text-xl cursor-pointer hover:text-rose-900"
            >
              ×
            </button>
          </div>
        )}

        {view === "dashboard" && (
          <section>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap">
                {[
                  {
                    key: "tables",
                    icon: <Utensils />,
                    label: `Tables (${tables.length})`,
                  },
                  {
                    key: "orders",
                    icon: <ClipboardList />,
                    label: `Orders (${activeOrders.length})`,
                  },
                  {
                    key: "notifications",
                    icon: <Bell />,
                    label: `Calls (${calls.length})`,
                  },
                  {
                    key: "history",
                    icon: <History />,
                    label: `History (${billHistory.length})`,
                  },
                  {
                    key: "takeout",
                    icon: <Package />,
                    label: `Takeout (${takeoutOrders.length})`,
                  },
                ].map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTab(key as any);
                    }}
                    className={`px-4 py-2.5 rounded-lg text-sm flex items-center cursor-pointer ${
                      activeTab === key
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-800 text-slate-200 border border-zinc-700 hover:bg-zinc-700"
                    } ${
                      key === "notifications" && newCall ? "animate-pulse" : ""
                    }`}
                  >
                    <span className="h-4 w-4 mr-2">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  (window.location.href = `${
                    import.meta.env.VITE_USER_LINK
                  }t/${rid}`)
                }
                className="px-4 py-2.5 rounded-lg text-sm flex items-center cursor-pointer bg-yellow-500 text-black hover:bg-yellow-400 font-bold shadow-md transition-colors"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Place Order
              </button>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-t-2 border-indigo-600 rounded-full" />
              </div>
            ) : (
              <>
                {activeTab === "tables" && (
                  <TablesComponent
                    tables={filteredTables as Table[]}
                    activeOrders={activeOrders}
                    isLoading={loading}
                    onTableSelect={handleTableSelect}
                    onTableReset={fetchTables}
                    rid={rid}
                  />
                )}

                {activeTab === "orders" && (
                  <OrdersComponent
                    filteredOrders={filteredOrders}
                    handleUpdateOrderStatus={onUpdateOrderStatus}
                    handleBillView={handleBillView}
                    isPending={isPending}
                    formatINR={formatINR}
                    waiterNames={waiterNames} // Pass waiterNames
                    onUpdateStaffAlias={handleUpdateOrderStaffAlias} // Pass update function
                    highlightedOrders={highlightedOrders} // Pass highlightedOrders
                  />
                )}

                {activeTab === "notifications" && (
                  <NotificationsView
                    calls={calls}
                    isLoading={callsLoading}
                    error={callsError}
                    fetchCalls={fetchCalls}
                    handleUpdateCallStatus={handleUpdateCallStatus}
                    tables={tables as Table[]}
                    waiterNames={waiterNames}
                    waiterLoading={waitersLoading}
                    waiterError={waitersError}
                  />
                )}

                {activeTab === "history" && (
                  <BillHistory
                    billHistory={billHistory}
                    fetchBillHistory={fetchBillHistory}
                    isHistoryLoading={isBillHistoryLoading}
                    historyError={billHistoryError}
                    formatINR={formatINR}
                    summary={summary}
                    pagination={pagination}
                    tenant={tenant}
                  />
                )}

                {activeTab === "takeout" && (
                  <TakeoutOrders
                    orders={takeoutOrders}
                    handleUpdateOrderStatus={onUpdateOrderStatus}
                    handleBillView={handleBillView}
                    isPending={isPending}
                    formatINR={formatINR}
                    onNewOrderClick={() => setIsAddOrderModalOpen(true)}
                  />
                )}
              </>
            )}
          </section>
        )}

        {view === "table" && selectedTable && (
          <TableDetail
            key={selectedTable.id}
            table={selectedTable}
            activeOrders={activeOrders}
            onBack={handleBackToDashboard}
            handleGenerateAndOpenBill={handleGenerateAndOpenBill}
            billLoadingId={billLoadingId}
            onTableReset={fetchTables}
            onOpenQrModal={handleOpenQrModal}
          />
        )}

        {view === "billing" && showBillDetail && (
          <BillingView
            showBillDetail={showBillDetail}
            initialBill={currentBillDetails}
            goBack={() =>
              selectedTable ? setView("table") : handleBackToDashboard()
            }
            formatINR={formatINR}
            onRefresh={onRefresh}
            onFinalize={onFinalize}
            onMarkPaid={onMarkPaid}
            onAddItem={onAddItem}
            onRemoveItem={onRemoveItem}
            onPatchItem={onPatchItem}
            onUpdateStatus={onUpdateStatus}
            handleUpdateOrderStatus={onUpdateOrderStatus}
            isPending={isPending}
            setShowConfirmModal={setShowConfirmModal}
            showConfirmModal={showConfirmModal}
            handleConfirmClose={handleConfirmClose}
            staffToken={localStorage.getItem(`staffToken_${rid}`) || ""}
          />
        )}
      </main>

      <AddOrderModal
        isOpen={isAddOrderModalOpen}
        onClose={() => setIsAddOrderModalOpen(false)}
        onSubmit={handleCreateTakeoutOrder}
      />

      <QRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        table={selectedTableForQr}
        restaurantId={rid}
      />

      <footer className="text-center text-xs py-6 text-slate-500 border-t border-zinc-700">
        © {new Date().getFullYear()} SwaadSetu — Premium Staff Dashboard
      </footer>
    </div>
  );
}
