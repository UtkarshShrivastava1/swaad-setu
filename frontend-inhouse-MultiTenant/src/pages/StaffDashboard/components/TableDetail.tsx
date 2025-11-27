// src/components/staff/TableDetailView.tsx
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CreditCard,
  IndianRupee,
  Loader2,
  Receipt,
  User,
  Users,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {

  getOrdersByTable,

  resetTable, // Import resetTable from staff operations

} from "../../../api/staff/staff.operations.api";

import { useTenant } from "../../../context/TenantContext";

export default function TableDetailView({
  table,
  onBack,
  handleGenerateAndOpenBill,
  billLoadingId,
  onTableReset,
  onOpenQrModal,
}) {
  const { rid: ridFromUrl } = useParams();
  const { rid: ridFromContext } = useTenant();
  const rid = ridFromUrl || ridFromContext || "";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const tableId =
    table?._id || table?.id || table?.tableNumber?.toString() || "";

  /* --------------------------------------------------
   * Fetch Orders (Tenant-Safe)
   * -------------------------------------------------- */
  const fetchOrders = async () => {
    if (!rid || !tableId) return;

    setLoading(true);
    setError(null);

    try {
      console.log("[TableDetailView] Fetching orders for:", { rid, tableId });
      const fetched = await getOrdersByTable(rid, tableId);
      setOrders(fetched || []);
    } catch (err) {
      console.error("❌ Failed to fetch table orders:", err);
      setError("Failed to load table orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [rid, tableId]);

  /* --------------------------------------------------
   * Handle Table Reset
   * -------------------------------------------------- */
  const handleResetTable = async () => {
    if (!rid || !table._id) return;
    try {
      await resetTable(rid, table._id);
      if (onTableReset) {
        onTableReset();
      }
    } catch (err: any) {
      console.error("❌ Failed to reset table:", err);
      alert(err.message || "Failed to reset table.");
    }
  };

  /* --------------------------------------------------
   * Status Badge
   * -------------------------------------------------- */
  const getStatusBadge = (status) => {
    const lower = (status || "").toLowerCase();
    const base =
      "px-2 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5";

    switch (lower) {
      case "paid":
        return (
          <span
            className={`${base} bg-emerald-100 text-emerald-700 border-emerald-200`}
          >
            <CheckCircle2 className="h-3 w-3" /> Paid
          </span>
        );

      case "preparing":
        return (
          <span
            className={`${base} bg-amber-100 text-amber-700 border-amber-200`}
          >
            Preparing
          </span>
        );

      case "ready":
        return (
          <span className={`${base} bg-blue-100 text-blue-700 border-blue-200`}>
            Ready
          </span>
        );

      case "served":
        return (
          <span
            className={`${base} bg-indigo-100 text-indigo-700 border-indigo-200`}
          >
            Served
          </span>
        );

      default:
        return (
          <span
            className={`${base} bg-slate-100 text-slate-700 border-slate-200`}
          >
            {status}
          </span>
        );
    }
  };

  const unpaidOrders = orders.filter(
    (o) => (o.paymentStatus || "").toLowerCase() !== "paid"
  );

  /* --------------------------------------------------
   * RENDER
   * -------------------------------------------------- */
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      {/* HEADER */}
      <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Table {table.tableNumber}
          </h2>

          <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
            <Users className="h-4 w-4" />
            Capacity: {table.capacity}
          </p>
        </div>

          <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
              table.status === "occupied"
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {table.status === "occupied" ? "Occupied" : "Available"}
          </div>
          {table.status !== "available" && (
            <button
              onClick={handleResetTable}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition"
            >
              Reset Table
            </button>
          )}
          <button
            onClick={() => onOpenQrModal(table)}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white transition"
          >
            QR Code
          </button>
        </div>
      </div>

      {/* ORDERS */}
      <div>
        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-indigo-600" />
          Active Orders
        </h3>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Loader2 className="animate-spin h-4 w-4" /> Loading orders…
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        ) : unpaidOrders.length === 0 ? (
          <div className="p-4 border border-slate-200 rounded-lg text-slate-500 bg-slate-50 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            No active unpaid orders.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpaidOrders.map((o) => {
              const orderId = o._id || o.id;
              const isExpanded = expandedOrderId === orderId;

              return (
                <div
                  key={orderId}
                  className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all"
                  onClick={() => {
                    if (window.innerWidth < 640)
                      setExpandedOrderId(isExpanded ? null : orderId);
                  }}
                >
                  {/* HEADER */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800">
                        #{o.orderNumberForDay ?? String(orderId).slice(-5)}
                      </h4>

                      {o.customerName && (
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {o.customerName}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(o.status)}
                      <ChevronDown
                        className={`h-4 w-4 sm:hidden text-slate-500 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* MOBILE DETAILS */}
                  {isExpanded && (
                    <div className="mt-3 border-t border-slate-100 pt-2 text-sm text-slate-600 sm:hidden space-y-1">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="capitalize">{o.status}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-semibold flex items-center gap-1">
                          <IndianRupee className="h-4 w-4 text-emerald-600" />
                          {o.totalAmount?.toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateAndOpenBill(o);
                        }}
                        disabled={billLoadingId === orderId}
                        className="mt-3 w-full px-4 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-1"
                      >
                        {billLoadingId === orderId ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Generating…
                          </>
                        ) : (
                          <>
                            View Order
                            <ChevronLeft className="rotate-180 h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* DESKTOP FOOTER */}
                  <div className="hidden sm:flex justify-between items-center mt-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="h-4 w-4 text-emerald-600" />
                      <span className="text-base font-semibold text-slate-800">
                        {o.totalAmount?.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleGenerateAndOpenBill(o)}
                      disabled={billLoadingId === orderId}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition flex items-center gap-1"
                    >
                      {billLoadingId === orderId ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />…
                        </>
                      ) : (
                        <>
                          View Order
                          <ChevronLeft className="rotate-180 h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COMBINED AMOUNT */}
      {unpaidOrders.length > 1 && (
        <div className="mt-8 border-t border-slate-200 pt-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-slate-600" />
            Combined Pending Amount
          </h4>

          <div className="text-lg sm:text-xl font-bold text-emerald-700">
            ₹
            {unpaidOrders
              .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
              .toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
