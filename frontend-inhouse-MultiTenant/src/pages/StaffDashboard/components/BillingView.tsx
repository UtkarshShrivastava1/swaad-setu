// src/components/staff/BillingViewCompact.tsx (multi-tenant)

// Import necessary icons and components
import {
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Edit,
  Receipt,
  RefreshCw,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import type { ApiBill } from "../../../api/staff/bill.api";
import {
  deleteOrderById,
  getBillByOrderId,
} from "../../../api/staff/staff.operations.api";
import { useTenant } from "../../../context/TenantContext";
import BillModalComponent from "./BillModalComponent";
import ConfirmModal from "./ConfirmModal";
import EditBillModal from "./EditBillModal";
import PaymentModal from "./PaymentModal";

// Constants
const AUTO_REFRESH_MS = 15000; // 15s auto-refresh interval

// Interface for the Order data structure
interface OrderType {
  _id?: string;
  id?: string;
  serverId?: string;
  restaurantId?: string;
  tableNumber?: string | number;
  staffAlias?: string;
  status?: string;
  items?: Array<{
    price?: number;
    qty?: number;
    priceAtOrder?: number;
    name?: string;
    notes?: string;
  }>;
  appliedDiscountPercent?: number;
  appliedServiceChargePercent?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerNotes?: string;
  tableId?: string;
  sessionId?: string;
  orderNumberForDay?: number;
  paymentStatus?: string;
  order?: { sessionId?: string };
  table?: { tableNumber?: string | number };
  customerContact?: string;
  contactNumber?: string;
}

// Props for the BillingViewCompact component
interface BillViewProps {
  showBillDetail: {
    order?: OrderType;
    bill?: ApiBill;
  } & OrderType;
  handleUpdateOrderStatus: (
    orderId: string,
    newStatus: string
  ) => Promise<void>;
  goBack: () => void;
  formatINR: (n?: number | null) => string;
  isPending: (id?: string) => boolean;
  staffToken: string;
  apiBase?: string;
}

/**
 * BillingViewCompact is a component that displays the details of a bill,
 * allows for status updates, and handles payment processing.
 */
export default function BillingViewCompact({
  showBillDetail,
  handleUpdateOrderStatus,
  goBack,
  formatINR,
  isPending,
  staffToken,
  apiBase = import.meta.env.VITE_API_BASE_URL,
}: BillViewProps) {
  // ===== Base entities =====
  const order = showBillDetail.order ?? (showBillDetail as OrderType);

  // Get restaurant ID from URL params or tenant context for multi-tenancy
  const { rid: ridFromUrl } = useParams();
  const { rid: ridFromContext } = useTenant();
  const rid =
    ridFromUrl ||
    ridFromContext ||
    (order?.restaurantId as string | undefined) ||
    "";

  // Final restaurant ID used for API calls
  const restaurantId = rid || order?.restaurantId;
  if (!restaurantId) {
    console.error("❌ Missing restaurantId");
    return;
  }

  const orderId = order?._id || order?.id || order?.serverId;

  // ===== State =====
  const [bill, setBill] = useState<ApiBill | null>(
    showBillDetail?.bill || null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [waiters, setWaiters] = useState<string[]>([]);
  const [selectedWaiter, setSelectedWaiter] = useState<string>(
    order.staffAlias ?? ""
  );
  const [billModalOpen, setBillModalOpen] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [editingBill, setEditingBill] = useState<ApiBill | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>();
  const [confirmMessage, setConfirmMessage] = useState("");

  // State for handling alias (waiter name) editing
  const [aliasInput, setAliasInput] = useState<string>("");
  const [isAliasSaving, setIsAliasSaving] = useState(false);

  // ===== Helpers =====
  /**
   * Calculates the discount amount based on subtotal and discount percentage.
   * @param subtotal - The subtotal amount.
   * @param discountPercent - The discount percentage.
   * @returns The calculated discount amount.
   */
  const calculateDiscountAmount = (subtotal: number, discountPercent: number) =>
    (subtotal * discountPercent) / 100;

  /**
   * Calculates the service charge amount.
   * @param subtotal - The subtotal amount.
   * @param serviceChargePercent - The service charge percentage.
   * @returns The calculated service charge amount.
   */
  const calculateServiceChargeAmount = (
    subtotal: number,
    serviceChargePercent: number
  ) => (subtotal * serviceChargePercent) / 100;

  /**
   * Generates a new bill for the order.
   * @returns A promise that resolves with the generated bill data.
   */
  const generateBill = async () => {
    const initialSubtotal =
      order.items?.reduce(
        (sum, item) => sum + (item.price || 0) * (item.qty || 1),
        0
      ) || 0;

    const discountAmount = calculateDiscountAmount(
      initialSubtotal,
      order.appliedDiscountPercent || 0
    );

    const serviceChargeAmount = calculateServiceChargeAmount(
      initialSubtotal,
      order.appliedServiceChargePercent || 0
    );

    const res = await fetch(
      `${apiBase}/api/${restaurantId}/orders/${orderId}/bill`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          staffAlias: order.staffAlias || "Waiter",
          extras: [],
          subtotal: initialSubtotal,
          discountPercent: order.appliedDiscountPercent || 0,
          discountAmount,
          serviceChargePercent: order.appliedServiceChargePercent || 0,
          serviceChargeAmount,
        }),
      }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Bill generation failed");
    }
    return res.json();
  };

  /**
   * Fetches the bill details for the current order.
   * @param opts - Options for fetching, such as `silent` to prevent loading indicators.
   */
  const fetchBill = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!orderId) {
      setError("Missing order ID");
      return;
    }

    try {
      if (!silent) setIsRefreshing(true);
      setError(null);

      // Fetches bill using a multi-tenant aware API call
      const fresh = await getBillByOrderId(restaurantId, orderId);

      // Sync metadata if the bill is in draft status
      if (fresh.status === "draft" && fresh._id) {
        const updates: Record<string, any> = {};
        let needsUpdate = false;
        if (!fresh.tableNumber && order?.tableNumber) {
          updates.tableNumber = String(order.tableNumber);
          needsUpdate = true;
        }
        if (!fresh.staffAlias && order?.staffAlias) {
          updates.staffAlias = order.staffAlias;
          needsUpdate = true;
        }
        if (needsUpdate && fresh._id) {
          try {
            const res = await fetch(
              `${apiBase}/api/${restaurantId}/bills/${fresh._id}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${staffToken}`,
                },
                body: JSON.stringify({ billId: fresh._id, ...updates }),
              }
            );
            if (res.ok) {
              const updated = await res.json();
              fresh.tableNumber = updated.tableNumber;
              fresh.staffAlias = updated.staffAlias;
            }
          } catch (e) {
            // non-blocking
          }
        }
      }

      setBill(fresh);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.message || "Failed to fetch bill details");
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  // Effect for initial bill fetch on component mount
  useEffect(() => {
    let active = true;
    (async () => {
      if (!orderId) return;
      try {
        await fetchBill({ silent: true });
      } finally {
        if (!active) return;
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId, restaurantId]);

  // Effect for setting up auto-refresh interval for bill data
  useEffect(() => {
    if (!orderId || !restaurantId) return;
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    autoRefreshRef.current = setInterval(() => {
      fetchBill({ silent: true }).catch(() => {});
    }, AUTO_REFRESH_MS);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [orderId, restaurantId]);

  // Effect for fetching the list of waiters
  useEffect(() => {
    async function fetchWaiters() {
      try {
        const url = `${apiBase}/api/${restaurantId}/admin/waiters`;

        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${staffToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          console.warn("Failed to fetch waiters", res.status);
          setWaiters([]);
          return;
        }

        const data = await res.json();
        const names = Array.isArray(data?.waiterNames) ? data.waiterNames : [];
        setWaiters(names);

        if (names.length === 1) {
          setSelectedWaiter(names[0]);
        }
      } catch (err) {
        console.warn("Waiter fetch error", err);
        setWaiters([]);
      }
    }

    if (restaurantId && staffToken) fetchWaiters();
  }, [restaurantId, staffToken, apiBase]);

  // ===== Alias (waiter name) update =====
  /**
   * Handles the update of the waiter's name (alias) on the bill.
   */
  async function handleAliasUpdate() {
    if (!bill?._id) return;
    const alias = aliasInput.trim() || selectedWaiter.trim();
    if (!alias) {
      setError("Please select or enter a waiter name.");
      return;
    }
    try {
      setIsAliasSaving(true);
      const payload = {
        staffAlias: alias,
        finalizedByAlias: alias,
        paymentMarkedBy: alias,
      };
      const res = await fetch(
        `${apiBase}/api/${restaurantId}/bills/${bill._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${staffToken}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update alias fields");
      }
      const updatedBill = await res.json();
      setBill(updatedBill);
      setSuccess("✅ Waiter name updated successfully!");
      setTimeout(() => setSuccess(null), 1600);
    } catch (err: any) {
      setError(err?.message || "Failed to update name");
    } finally {
      setIsAliasSaving(false);
    }
  }

  // ===== Status / actions =====
  /**
   * Handles clicks on status update buttons.
   * @param newStatus - The new status to set for the order.
   */
  async function handleStatusClick(newStatus: string) {
    try {
      setLoading(true);
      if (!orderId) throw new Error("Order ID missing");
      await handleUpdateOrderStatus(orderId, newStatus);
      order.status = newStatus;
      setSuccess(`Order marked as ${newStatus}`);
      setTimeout(() => setSuccess(null), 1200);
      await fetchBill({ silent: true });
    } catch (err: any) {
      setError(err?.message || "Failed to update order status");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handles the rejection of an order, deleting it from the system.
   */
  function handleRejectOrder() {
    setConfirmMessage(
      "Are you sure you want to reject this order? This action cannot be undone."
    );
    setPendingAction(() => async () => {
      try {
        setRejecting(true);
        setError(null);
        setSuccess(null);
        if (!orderId) throw new Error("Order ID missing");
        if (!restaurantId) throw new Error("Restaurant ID missing");
        // Use deleteOrderById to remove the order
        await deleteOrderById(restaurantId, orderId);
        setSuccess("✅ Order rejected successfully");
        setTimeout(goBack, 1000);
      } catch (err: any) {
        setError(err?.message || "Failed to reject order");
      } finally {
        setRejecting(false);
      }
    });
    setConfirmModalOpen(true);
  }

  /**
   * Handles closing a paid order.
   */
  function handleCloseOrder() {
    if (bill?.paymentStatus !== "paid") {
      setError("Order cannot be closed until it's paid.");
      return;
    }

    setConfirmMessage(
      "Are you sure you want to close this order? This action cannot be undone."
    );
    setPendingAction(() => async () => {
      try {
        setClosing(true);
        setError(null);
        setSuccess(null);
        if (!orderId) throw new Error("Order ID missing");
        await handleUpdateOrderStatus(orderId, "done");
        setSuccess("✅ Order closed successfully");
        setTimeout(goBack, 1000);
      } catch (err: any) {
        setError(err?.message || "Failed to close order");
      } finally {
        setClosing(false);
      }
    });
    setConfirmModalOpen(true);
  }

  // ===== Derived values for display =====
  const sessionId =
    bill?.sessionId ?? order.sessionId ?? order.order?.sessionId ?? "—";
  const tableDisplay =
    bill?.tableNumber ??
    order.tableNumber ??
    order.table?.tableNumber ??
    (order.tableId ? `#${String(order.tableId).slice(-4)}` : "-");
  const paymentStatus = bill?.paymentStatus ?? order?.paymentStatus ?? "unpaid";
  const orderNumberForDay =
    bill?.orderNumberForDay ?? order.orderNumberForDay ?? undefined;
  const customerName = bill?.customerName ?? order.customerName ?? "Guest";
  const customerContact =
    bill?.customerContact ??
    order?.customerPhone ??
    order?.customerContact ??
    order?.contactNumber ??
    bill?.customerEmail ??
    order?.customerEmail ??
    "—";
  const customerEmail = bill?.customerEmail ?? order?.customerEmail ?? null;
  const appliedDiscountPercent = bill?.appliedDiscountPercent ?? 0;
  const appliedServiceChargePercent = bill?.appliedServiceChargePercent ?? 0;
  const customerNotes = bill?.customerNotes ?? null;
  const staffAlias =
    bill?.staffAlias ?? order?.staffAlias ?? selectedWaiter ?? "—";

  // Calculate bill breakdown if bill data is available
  const billBreakdown = bill
    ? (() => {
        const subtotal = bill.subtotal || 0;
        const discountAmount = bill.discountAmount ?? 0;
        const serviceChargeAmount = bill.serviceChargeAmount ?? 0;
        const taxes = Array.isArray(bill.taxes) ? bill.taxes : [];
        const taxesTotal =
          bill.taxAmount ??
          taxes.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const extras = Array.isArray(bill.extras)
          ? bill.extras.filter((e) => (Number(e.amount) || 0) >= 0)
          : [];
        const moreDiscounts = Array.isArray(bill.extras)
          ? bill.extras.filter((e) => (Number(e.amount) || 0) < 0)
          : [];
        const extrasTotal = extras.reduce(
          (s, e) => s + (Number(e.amount) || 0),
          0
        );
        const moreDiscountsTotal = Math.abs(
          moreDiscounts.reduce((s, e) => s + (Number(e.amount) || 0), 0)
        );
        const total =
          subtotal -
          discountAmount +
          serviceChargeAmount +
          taxesTotal +
          extrasTotal -
          moreDiscountsTotal;
        return {
          subtotal,
          discountAmount,
          serviceChargeAmount,
          taxes,
          taxesTotal,
          extras,
          extrasTotal,
          moreDiscounts,
          moreDiscountsTotal,
          total,
        };
      })()
    : null;

  // Styling for different order statuses
  const statusColors: Record<string, string> = {
    accepted: "bg-blue-100 text-blue-700 border-blue-300",
    preparing: "bg-amber-100 text-amber-700 border-amber-300",
    ready: "bg-purple-100 text-purple-700 border-purple-300",
    served: "bg-emerald-100 text-emerald-700 border-emerald-300",
  };
  const statusIcons: Record<string, string> = {
    accepted: "👍",
    preparing: "🍳",
    ready: "✨",
    served: "🍽️",
  };

  return (
    <section className="h-screen overflow-hidden bg-slate-50">
      {/* Top bar with navigation and actions */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 border-b border-slate-200 bg-white">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
        >
          <ChevronRight className="h-4 w-4 -rotate-180" />
          Back
        </button>
        <div className="ml-auto inline-flex items-center gap-2">
          <button
            onClick={() => fetchBill()}
            disabled={isRefreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 transition shadow disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing" : "Refresh"}
          </button>
          {bill && (
            <button
              onClick={() => setBillModalOpen(true)}
              disabled={!bill || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition disabled:opacity-50"
            >
              <Receipt className="h-4 w-4" />
              View Bill
            </button>
          )}
        </div>
      </div>

      {/* Display error or success messages */}
      {(error || success) && (
        <div className="px-3 sm:px-4 py-2 bg-transparent">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-md text-xs sm:text-sm flex items-center gap-2">
              <span className="text-base">⚠️</span>
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-md text-xs sm:text-sm flex items-center gap-2 mt-1">
              <span className="text-base">✅</span>
              {success}
            </div>
          )}
        </div>
      )}

      {/* Main content grid */}
      <div className="h-[calc(100vh-56px-0px)] grid grid-cols-1 lg:grid-cols-[45fr_55fr] xl:grid-cols-[45fr_55fr] gap-3 sm:gap-4 px-3 sm:px-4 pb-3">
        {/* LEFT COLUMN: Summary + Actions */}
        <div className="min-w-0 h-full overflow-auto pr-1 space-y-3">
          {/* Order & Bill Summary */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3.5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-800 leading-snug">
                  Order & Bill
                </h3>
                {orderNumberForDay && (
                  <span className="inline-block text-[11px] bg-slate-100 px-1.5 py-[1px] rounded-md border border-slate-200 text-slate-600 mt-0.5">
                    #{orderNumberForDay}
                  </span>
                )}
              </div>

              <div className="text-right space-y-0.5">
                <div
                  className={`inline-flex items-center gap-1 px-2 py-[1px] rounded-full text-[11px] font-semibold border ${
                    (paymentStatus ?? "unpaid") === "paid"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {(paymentStatus ?? "unpaid").toUpperCase()}
                </div>
                <div className="text-[10px] text-slate-500">
                  {lastUpdated
                    ? lastUpdated.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </div>
              </div>
            </div>

            {/* Table and Customer details */}
            <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[13px]">
              <div className="bg-slate-50 rounded-md p-1 border border-slate-200">
                <div className="text-slate-500 text-[11px] font-medium leading-tight">
                  Table
                </div>
                <div className="text-[13px] font-semibold text-slate-800 leading-tight">
                  {tableDisplay}
                </div>
              </div>

              <div className="bg-slate-50 rounded-md p-1.5 border border-slate-200">
                <div className="text-slate-500 text-[11px] font-medium leading-tight">
                  Customer
                </div>
                <div className="font-semibold text-slate-800 truncate text-[13px] leading-snug">
                  {customerName}
                </div>
                <div className="text-[11px] text-slate-500 truncate leading-tight">
                  {customerContact}
                </div>
                {customerEmail && (
                  <div className="text-[11px] text-slate-500 truncate leading-tight">
                    {customerEmail}
                  </div>
                )}
              </div>
            </div>

            {/* Customer notes */}
            {customerNotes && (
              <div className="mt-2.5 bg-slate-50 rounded-md p-2 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium mb-0.5 leading-tight">
                  Notes
                </div>
                <div className="text-[13px] italic text-slate-700 leading-snug break-words">
                  💬 {customerNotes}
                </div>
              </div>
            )}
          </div>

          {/* Order Status */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-700" /> Status
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {(["accepted", "preparing", "ready", "served"] as const).map(
                (status) => {
                  const isActive = order?.status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusClick(status)}
                      disabled={isActive || isPending(orderId)}
                      className={`px-2.5 py-1.5 rounded-md text-[13px] font-semibold border transition ${
                        isActive
                          ? `${statusColors[status]} border-2`
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-base mr-1">
                        {statusIcons[status]}
                      </span>
                      {status}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Waiter selection */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <User className="h-4 w-4 text-slate-700" /> Waiter
            </h4>
            <div className="flex gap-1.5">
              <select
                value={selectedWaiter}
                onChange={(e) => setSelectedWaiter(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-[13px] focus:ring-1 focus:ring-slate-500"
              >
                <option value="">Select</option>
                {waiters.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Enter Manually"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-[13px] placeholder-slate-400"
              />
              <button
                onClick={handleAliasUpdate}
                disabled={isAliasSaving || (!aliasInput && !selectedWaiter)}
                className={`px-2.5 py-1.5 rounded-md text-[13px] font-semibold ${
                  isAliasSaving || (!aliasInput && !selectedWaiter)
                    ? "bg-slate-200 text-slate-400"
                    : "bg-slate-700 text-white hover:bg-slate-800"
                }`}
              >
                {isAliasSaving ? "..." : "✔"}
              </button>
            </div>
            <div className="text-[12px] text-slate-600 mt-1.5">
              Current: <span className="font-semibold">{staffAlias}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <h4 className="text-sm font-bold text-slate-800 mb-2">Actions</h4>

            {bill?.status === "finalized" ? (
              <>
                <div className="flex flex-col gap-1.5">
                  {bill?.paymentStatus !== "paid" && (
                    <button
                      onClick={() => setIsPaying(true)}
                      className="w-full px-3 py-2.5 rounded-md text-[14px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <CreditCard className="h-5 w-5" /> Pay Bill
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                    <button
                      onClick={handleCloseOrder}
                      className="px-2.5 py-1.5 rounded-md text-[13px] font-semibold bg-slate-700 text-white hover:bg-slate-800 flex items-center justify-center gap-1"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleRejectOrder}
                      disabled={rejecting}
                      className="px-2.5 py-1.5 rounded-md text-[13px] font-semibold bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center gap-1"
                    >
                      {rejecting ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => bill && setEditingBill(bill)}
                    className="px-2.5 py-1.5 rounded-md text-[13px] font-semibold bg-amber-500 text-white hover:bg-amber-600 flex items-center justify-center gap-1"
                  >
                    <Edit className="h-4 w-4" /> Edit
                  </button>

                  <button
                    onClick={() => {
                      if (!bill?._id) return;
                      setConfirmMessage(
                        "Are you sure you want to finalize this bill? Once finalized, it cannot be edited."
                      );
                      setPendingAction(() => async () => {
                        try {
                          const alias =
                            bill.staffAlias ||
                            localStorage.getItem("staffAlias") ||
                            prompt("Enter your staff alias:") ||
                            "staff";
                          localStorage.setItem("staffAlias", alias);

                          const res = await fetch(
                            `${apiBase}/api/${restaurantId}/bills/${bill._id}/finalize`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${staffToken}`,
                              },
                              body: JSON.stringify({ staffAlias: alias }),
                            }
                          );

                          if (!res.ok) {
                            const data = await res.json().catch(() => ({}));
                            throw new Error(
                              data.error || "Failed to finalize bill"
                            );
                          }

                          const updated = await res.json();
                          setBill(updated);
                          setSuccess("✅ Bill finalized successfully!");
                          setTimeout(() => setSuccess(null), 2000);
                        } catch (err: any) {
                          setError(err?.message || "Failed to finalize bill");
                        }
                      });
                      setConfirmModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-md text-[13px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="h-4 w-4" /> Finalize
                  </button>

                  <button
                    onClick={handleCloseOrder}
                    className="px-2.5 py-1.5 rounded-md text-[13px] font-semibold bg-slate-700 text-white hover:bg-slate-800 flex items-center justify-center gap-1"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleRejectOrder}
                    className="px-2.5 py-1.5 rounded-md text-[13px] font-semibold bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center gap-1"
                  >
                    Reject
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Items + Breakdown */}
        <div className="h-full overflow-hidden">
          <div className="h-full overflow-auto space-y-3">
            {/* Order Items */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">
                  Order Items
                </h4>
                <span className="text-[11px] text-slate-500">
                  {bill?.items?.length ? `${bill.items.length} item(s)` : "—"}
                </span>
              </div>
              <div className="divide-y divide-slate-200">
                {bill && bill.items?.length ? (
                  bill.items.map((item: any, i: number) => {
                    const price = item.priceAtOrder ?? item.price ?? 0;
                    const qty = item.qty ?? 1;
                    return (
                      <div
                        key={`${item.itemId || i}`}
                        className="px-4 py-3 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-800 text-[14px] truncate">
                              {item.name}
                            </div>
                            <div className="text-[12px] text-slate-500 mt-0.5">
                              {qty} × {formatINR(price)}
                            </div>
                            {item.notes && (
                              <div className="text-[11px] italic text-slate-600 mt-0.5 flex items-center gap-1 min-w-0 truncate">
                                <span>💭</span>
                                <span className="truncate">{item.notes}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-base font-bold text-slate-800 whitespace-nowrap">
                            {formatINR(qty * price)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-10 text-center text-slate-500 text-sm">
                    No items in bill.
                  </div>
                )}
              </div>
            </div>

            {/* Bill Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">
                  Bill Breakdown
                </h4>
                {bill?.status === "finalized" &&
                  bill.paymentStatus !== "paid" && (
                    <button
                      onClick={() => setIsPaying(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow"
                    >
                      <CreditCard className="h-4 w-4" /> Pay
                    </button>
                  )}
              </div>

              {bill && billBreakdown ? (
                <div className="px-4 py-4 space-y-2 text-[13px]">
                  <Row
                    label="Subtotal"
                    value={formatINR(billBreakdown.subtotal)}
                    labelClass="text-slate-600"
                    valueClass="font-semibold text-slate-800"
                  />

                  {appliedDiscountPercent > 0 && (
                    <Row
                      label={`Discount (${appliedDiscountPercent}%)`}
                      value={`-${formatINR(billBreakdown.discountAmount)}`}
                      valueClass="text-emerald-700"
                    />
                  )}

                  {appliedServiceChargePercent > 0 && (
                    <Row
                      label={`Service Charge (${appliedServiceChargePercent}%)`}
                      value={`${formatINR(billBreakdown.serviceChargeAmount)}`}
                    />
                  )}

                  {billBreakdown.taxes.map((tax: any) => (
                    <Row
                      key={tax.name}
                      label={`${tax.name} (${tax.rate || 0}%)`}
                      value={formatINR(tax.amount || 0)}
                    />
                  ))}

                  {billBreakdown.extras.map((extra: any, i: number) => (
                    <Row
                      key={`extra-${i}`}
                      label={extra.label ?? extra.name ?? "Extra"}
                      value={formatINR(extra.amount)}
                    />
                  ))}

                  <div className="border-t pt-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-slate-800">
                        Settlement Amount
                      </span>
                      <span className="text-xl font-bold text-emerald-700">
                        {formatINR(billBreakdown.total)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-6 text-slate-500 text-sm text-center">
                  {loading ? "Loading bill details..." : "No bill found."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {billModalOpen && bill && (
        <BillModalComponent
          bill={bill}
          onClose={() => setBillModalOpen(false)}
          formatINR={formatINR}
          staffToken={staffToken}
        />
      )}

      {editingBill && (
        <EditBillModal
          bill={editingBill}
          onClose={() => setEditingBill(null)}
          formatINR={formatINR}
          onBillUpdated={(updated) => {
            setBill(updated);
            setEditingBill(null);
            fetchBill({ silent: true });
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmModalOpen}
        onConfirm={() => {
          pendingAction?.();
          setConfirmModalOpen(false);
        }}
        onCancel={() => setConfirmModalOpen(false)}
        message={confirmMessage}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
      />

      {isPaying && bill && (
        <PaymentModal
          bill={bill}
          onClose={() => setIsPaying(false)}
          formatINR={formatINR}
          staffToken={staffToken}
          staffAlias={staffAlias}
          onPaid={(updatedBill) => {
            setBill(updatedBill);
            setIsPaying(false);
            fetchBill({ silent: true });
          }}
          handleUpdateOrderStatus={handleUpdateOrderStatus}
        />
      )}
    </section>
  );
}

/**
 * A small presentational helper component to render a labeled row.
 */
function Row({
  label,
  value,
  labelClass = "text-slate-700",
  valueClass = "text-slate-700",
}: {
  label: string;
  value: string | number | null | undefined;
  labelClass?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={`select-none ${labelClass}`}>{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
