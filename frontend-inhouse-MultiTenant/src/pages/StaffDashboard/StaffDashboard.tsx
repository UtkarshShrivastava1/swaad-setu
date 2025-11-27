import QRCodeModal from "../AdminDashboard/components/modals/QRCodeModal";
// -----------------------------
// StaffDashboard (Multi-Tenant)
// -----------------------------
import { AlertCircle, Bell, History, Receipt, Utensils } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import BillingView from "./components/BillingView";
import Header from "./components/Header";
import OrdersComponent from "./components/OrdersComponent";
import TableDetail from "./components/TableDetail";
import TablesComponent from "./components/TablesComponent";

import BillHistory from "./components/BillHistory";
import NotificationsView from "./components/NotificationsView";
import { formatINR } from "./utils/formatters";

import {
  getBillByOrderId,
  getOrdersByTable,
} from "../../api/staff/staff.operations.api";
import { useTenant } from "../../context/TenantContext";

import { useBilling } from "./hooks/useBilling";
import { useCalls } from "./hooks/useCalls";
import { useHistory } from "./hooks/useHistory";
import { useOrders } from "./hooks/useOrders";
import { usePendingTracker } from "./hooks/usePendingTracker";
import { useTables } from "./hooks/useTables";
import { useWaiters } from "./hooks/useWaiters";

import type { Order, Table } from "./types";
import type { ICall } from "../../api/staff/call.api";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { rid: ridFromUrl } = useParams();
  const { rid: ridFromContext, admin, setRid } = useTenant();
  
  // Stabilize the tenant object with useMemo
  const tenant = useMemo(() => ({ rid: ridFromContext, admin }), [ridFromContext, admin]);

  // 🔑 Resolve final RID from URL → context
  const rid = ridFromUrl || ridFromContext || "";

  useEffect(() => {
    if (ridFromUrl && ridFromUrl !== ridFromContext) {
      setRid(ridFromUrl);
    }
  }, [ridFromUrl, ridFromContext, setRid]);

  // -----------------------------
  // Local UI state
  // -----------------------------
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showBillDetail, setShowBillDetail] = useState<Order | null>(null);
  const [view, setView] = useState<"dashboard" | "table" | "billing">(
    "dashboard"
  );
  const [activeTab, setActiveTab] = useState<
    "tables" | "orders" | "notifications" | "history"
  >("tables");
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billLoadingId, setBillLoadingId] = useState(null);
  const [newCall, setNewCall] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedTableForQr, setSelectedTableForQr] = useState<Table | null>(
    null
  );


  // -----------------------------
  // Hooks (data)
  // -----------------------------

  // Tables
  const {
    tables,
    setTables,
    fetchTables,
    isLoading: tablesLoading,
    tableError,
  } = useTables(rid);

  // Orders (uses rid internally, via params/context)
  const {
    activeOrders,
    orderHistory,
    fetchActiveOrders,
    fetchOrderHistory,
    isLoading: ordersLoading,
    isHistoryLoading,
    error: ordersError,
    historyError,
    setActiveOrders,
  } = useOrders(fetchTables, setTables);

  // Waiters (same usage as old single-tenant, just rid-aware under the hood)
  const { waiterNames, waitersLoading, waitersError, fetchWaiters } =
    useWaiters(rid);

  // Calls
  const {
    calls,
    fetchCalls,
    handleUpdateCallStatus,
    isLoading: callsLoading,
    error: callsError,
  } = useCalls(tenant);

  // Calls to tables sync effect
  useEffect(() => {
    // Only proceed if calls have finished loading
    if (callsLoading) {
      return;
    }

    setTables(currentTables => {
      let changed = false;
      // Create a set of normalized call table IDs
      const callTableIdSet = new Set(calls.map((call) => String(call.tableId)));

      const updatedTables = currentTables.map((table) => {
        // Normalize the current table's ID for comparison
        const normalizedTableId = String(table._id || table.id); // Use _id first, then id

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
  }, [calls, setTables, callsLoading]); // Add callsLoading to dependencies


  useEffect(() => {
    const previousCalls = JSON.parse(sessionStorage.getItem("calls") || "[]");
    if (calls.length > previousCalls.length) {
      setNewCall(true);
      setTimeout(() => setNewCall(false), 3000); // Animation duration
    }
    sessionStorage.setItem("calls", JSON.stringify(calls));
  }, [calls]);

  const { isPending } = usePendingTracker();

  // Billing logic
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

  // Bill history
  const {
    billHistory,
    fetchBillHistory,
    isHistoryLoading: isBillHistoryLoading,
    historyError: billHistoryError,
  } = useHistory(rid);

  const loading = tablesLoading || ordersLoading;

  // -----------------------------
  // Lifecycle
  // -----------------------------
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

    const interval = setInterval(() => {
      if (view === "dashboard") {
        fetchActiveOrders();
        fetchTables();
        fetchCalls();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [navigate, view, rid, fetchActiveOrders, fetchWaiters, fetchCalls]);

  // ❗ We no longer do a second merge here – useOrders already
  // keeps tables in sync via setTables(mergeOrdersIntoTables(...))

  // Auto-fetch bill history when tab becomes "history"
  useEffect(() => {
    if (activeTab === "history") {
      fetchBillHistory({ limit: 50 });
    }
  }, [activeTab, fetchBillHistory]);

  // Listen for "go back to tables" event from payment modal
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

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleLogout = () => {
    if (rid) {
      localStorage.removeItem(`staffToken_${rid}`);
    }
    localStorage.removeItem("staffToken");
    navigate(`/t/${rid}/staff-login`);
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
      console.log("🧾 [StaffDashboard] Fetching bill for order:", {
        rid,
        orderId,
      });

      let billData;

      // Try fetch first
      try {
        billData = await getBillByOrderId(rid, orderId);
        if (!billData || !billData._id) throw new Error("Bill missing id");
      } catch (err) {
        console.warn("No existing bill → creating new one…");

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
          throw new Error(`Bill creation failed (${res.status})`);
        }

        const json = await res.json();
        billData = json.bill || json;
      }

      if (!billData?._id) {
        throw new Error("Bill creation succeeded but no bill ID returned.");
      }

      console.log("🧾 [StaffDashboard] Bill ready → opening modal", billData);

      handleBillView(orderId, billData);
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
      setSelectedTable(found);
      setView("table");
    }
  };

  const handleBillView = (orderId: string, _preFetchedBill?: any) => {
    const order =
      activeOrders.find((o) => o.id === orderId || o.serverId === orderId) ||
      orderHistory.find((o) => o.id === orderId || o.serverId === orderId);

    if (!order) {
      setError(`Order ${orderId} not found`);
      return;
    }

    setShowBillDetail(order);
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
    fetchActiveOrders();
  };

  const handleOpenQrModal = (table: Table) => {
    setSelectedTableForQr(table);
    setIsQrModalOpen(true);
  };

  const filteredOrders = activeOrders.filter((order) => {
    const q = searchQuery.toLowerCase();
    return (
      (order.tableNumber ?? "").toLowerCase().includes(q) ||
      (order.customerName ?? "").toLowerCase().includes(q) ||
      order.id.toLowerCase().includes(q)
    );
  });

  // Bubble up any core data errors into the UI banner
  const topError = error || tableError || ordersError || waitersError || callsError;

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header
        key={rid}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenNotifications={() => setActiveTab("notifications")}
        onLogout={handleLogout}
        waiterCallCount={calls.length}
        // (optional) you could pass waiterNames here if Header supports it
        // waiterNames={waiterNames}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 🔴 Error Banner */}
        {topError && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div className="flex-1">
              <strong>Error:</strong> {topError}
            </div>
            <button
              onClick={() => {
                setError(null);
                // you could also clear table/order/waiter errors if needed
              }}
              className="font-bold text-xl cursor-pointer hover:text-rose-900"
            >
              ×
            </button>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {view === "dashboard" && (
          <section>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {[
                {
                  key: "tables",
                  icon: <Utensils />,
                  label: `Tables (${tables.length})`,
                },
                {
                  key: "orders",
                  icon: <Receipt />,
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
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`px-4 py-2.5 rounded-lg text-sm flex items-center ${
                    activeTab === key
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  } ${key === "notifications" && newCall ? "animate-pulse" : ""}`}
                >
                  <span className="h-4 w-4 mr-2">{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-t-2 border-indigo-600 rounded-full" />
              </div>
            ) : (
              <>
                {activeTab === "tables" && (
                  <TablesComponent
                    tables={tables}
                    activeOrders={activeOrders}
                    isLoading={loading}
                    onTableSelect={handleTableSelect}
                  />
                )}

                {activeTab === "orders" && (
                  <OrdersComponent
                    filteredOrders={filteredOrders}
                    handleUpdateOrderStatus={onUpdateOrderStatus}
                    handleBillView={handleBillView}
                    isPending={isPending}
                    formatINR={formatINR}
                  />
                )}

                {activeTab === "notifications" && (
                  <NotificationsView
                    calls={calls}
                    isLoading={callsLoading}
                    error={callsError}
                    fetchCalls={fetchCalls}
                    handleUpdateCallStatus={handleUpdateCallStatus}
                    tables={tables}
                    waiterNames={waiterNames}
                    waiterLoading={waitersLoading}
                    waiterError={waitersError}
                  />
                )}

                {activeTab === "history" && (
                  <BillHistory
                    billHistory={billHistory}
                    fetchBillHistory={fetchBillHistory}
                    isHistoryLoading={isBillHistoryLoading || isHistoryLoading}
                    historyError={billHistoryError || historyError}
                    formatINR={formatINR}
                  />
                )}
              </>
            )}
          </section>
        )}

        {/* TABLE VIEW */}
        {view === "table" && selectedTable && (
          <TableDetail
            key={selectedTable.id}
            table={selectedTable}
            activeOrders={activeOrders}
            onBack={handleBackToDashboard}
            handleGenerateAndOpenBill={handleGenerateAndOpenBill}
            billLoadingId={billLoadingId}
            onTableReset={fetchTables} // Pass fetchTables as onTableReset
            onOpenQrModal={handleOpenQrModal}
            // restaurantId={rid} // keep or remove based on your TableDetail props
          />
        )}

        {/* BILLING VIEW */}
        {view === "billing" && showBillDetail && (
          <BillingView
            showBillDetail={showBillDetail}
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

      <QRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        table={selectedTableForQr}
        restaurantId={rid}
      />

      <footer className="text-center text-xs py-6 text-slate-400 border-t border-slate-200">
        © {new Date().getFullYear()} SwaadSetu — Premium Staff Dashboard
      </footer>
    </div>
  );
}
