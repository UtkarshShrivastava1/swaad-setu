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
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import type { ApiBill } from "../../../api/staff/bill.api";
import {
  deleteOrderById,
  getBillByOrderId,
  resetTable,
} from "../../../api/staff/staff.operations.api";
import { useSocket } from "../../../context/SocketContext";
import { useTenant } from "../../../context/TenantContext";
import BillModalComponent from "./BillModalComponent";
import { ConfirmModal } from "./ConfirmModal";
import EditBillModal from "./EditBillModal";
import PaymentModal from "./PaymentModal";
import type { Order } from "../types";

/**
 * Normalize any possible id/tableNumber to a string.
 */
function toIdString(x: any): string {
  if (x == null) return "";
  if (typeof x === "string" || typeof x === "number") return String(x);

  if (typeof x === "object") {
    if (x._id) return String(x._id);
    if (x.id) return String(x.id);
    if (x.tableNumber) return String(x.tableNumber);
  }

  return "";
}

// Props for the BillingViewCompact component
interface BillViewProps {
  showBillDetail: Order;
  initialBill?: ApiBill | null;
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
  initialBill,
  handleUpdateOrderStatus,
  goBack,
  formatINR,
  isPending,
  staffToken,
  apiBase = import.meta.env.VITE_API_BASE_URL,
}: BillViewProps) {
  // ===== Base entities =====
  const order = showBillDetail;
  const socket = useSocket();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Get restaurant ID from URL params or tenant context for multi-tenancy
  const { rid: ridFromUrl } = useParams();
  const { rid: ridFromContext } = useTenant();
  const rid =
    ridFromUrl ||
    ridFromContext ||
    (order?.restaurantId as string | undefined) ||
    "";

  // Final restaurant ID used for API calls
  const restaurantId = rid;
  if (!restaurantId) {
    console.error("❌ Missing restaurantId");
    return;
  }

  const orderId = order?._id || order?.id || order?.serverId;

  // ===== State =====
  const [bill, setBill] = useState<ApiBill | null>(initialBill ?? null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [waiters, setWaiters] = useState<string[]>([]);
  const [selectedWaiter, setSelectedWaiter] = useState<string>(
    order.staffAlias ?? ""
  );
  const [billModalOpen, setBillModalOpen] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [editingBill, setEditingBill] = useState<ApiBill | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>();
  const [confirmMessage, setConfirmMessage] = useState("");

  const [aliasInput, setAliasInput] = useState<string>("");
  const [isAliasSaving, setIsAliasSaving] = useState(false);
  const [newlyAddedItems, setNewlyAddedItems] = useState<Set<string>>(new Set());

  // Effect to clear highlight after a delay
  useEffect(() => {
    if (newlyAddedItems.size > 0) {
      const timer = setTimeout(() => {
        setNewlyAddedItems(new Set());
      }, 5000); // Highlight for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [newlyAddedItems]);

  const fetchBill = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!orderId) {
      setError("Missing order ID");
      return;
    }

    try {
      if (!silent) setIsRefreshing(true);
      setError(null);

      const fresh = await getBillByOrderId(restaurantId, orderId);

      setBill(prevBill => {
        if (prevBill && fresh.items.length > prevBill.items.length) {
          const existingItemInstanceIds = new Set(
            prevBill.items.map((item: any) => item._id)
          );
          const newItems = fresh.items.filter(
            (item: any) => !existingItemInstanceIds.has(item._id)
          );
          if (newItems.length > 0) {
            const newIds = new Set(newItems.map((item: any) => item._id));
            setNewlyAddedItems(newIds);
          }
        }
        return fresh;
      });

      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.message || "Failed to fetch bill details");
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, [orderId, restaurantId]);

  const debouncedFetchBill = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchBill({ silent: true });
    }, 800);
  }, [fetchBill]);

  // Initial fetch and socket listener setup
  useEffect(() => {
    if (orderId) {
      fetchBill();
    }

    if (socket) {
      const handleOrderUpdate = (updatedOrder: { _id: string }) => {
        if (updatedOrder._id === orderId) {
          console.log(
            `[BillingView] Debounced update for current order ${orderId}`
          );
          debouncedFetchBill();
        }
      };

      socket.on("order_update", handleOrderUpdate);

      return () => {
        socket.off("order_update", handleOrderUpdate);
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    }
  }, [orderId, socket, debouncedFetchBill]);

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
   * Handles the update of the waiter's name (alias) on the bill, primarily for the manual save button.
   */
  async function handleAliasUpdate() {
    if (!bill?._id) return;
    const alias = aliasInput.trim() || selectedWaiter.trim();
    if (!alias) {
      setError("Please select or enter a waiter name.");
      return;
    }
    // Prevent re-saving the same value
    if (alias === bill.staffAlias) {
      return;
    }

    try {
      setIsAliasSaving(true);
      setError(null);
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

  // Auto-save waiter name on dropdown selection
  const isInitialWaiterSelection = useRef(true);
  useEffect(() => {
    if (isInitialWaiterSelection.current) {
      isInitialWaiterSelection.current = false;
      return;
    }

    if (!selectedWaiter || !bill?._id || selectedWaiter === bill.staffAlias) {
      return;
    }

    const autoSave = async () => {
      try {
        setIsAliasSaving(true);
        setError(null);
        const payload = {
          staffAlias: selectedWaiter,
          finalizedByAlias: selectedWaiter,
          paymentMarkedBy: selectedWaiter,
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
          throw new Error(data.error || "Failed to auto-save waiter name");
        }
        const updatedBill = await res.json();
        setBill(updatedBill);
        setAliasInput(""); // Clear manual input on successful auto-save
        setSuccess("✅ Waiter name auto-saved.");
        setTimeout(() => setSuccess(null), 1600);
      } catch (err: any) {
        setError(err?.message || "Failed to auto-save waiter name");
      } finally {
        setIsAliasSaving(false);
      }
    };

    autoSave();
  }, [selectedWaiter, bill, restaurantId, staffToken, apiBase]);

  // ===== Status / actions =====
  /**
   * Handles clicks on status update buttons.
   * @param newStatus - The new status to set for the order.
   */
  async function handleStatusClick(newStatus: string) {
    try {
      if (!orderId) throw new Error("Order ID missing");
      await handleUpdateOrderStatus(orderId, newStatus);
      order.status = newStatus as any;
      setSuccess(`Order marked as ${newStatus}`);
      setTimeout(() => setSuccess(null), 1200);
      await fetchBill({ silent: true });
    } catch (err: any) {
      setError(err?.message || "Failed to update order status");
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

        // Reset the associated table
        const tableId = toIdString(bill?.tableId || order.tableId);
        if (restaurantId && tableId) {
          resetTable(restaurantId, tableId)
            .then(() =>
              console.log(
                `[BillingView] Table ${tableId} reset on order rejection.`
              )
            )
            .catch((err) =>
              console.error(
                `[BillingView] Failed to reset table ${tableId}:`,
                err
              )
            );
        }

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
        if (!orderId) throw new Error("Order ID missing");
        await handleUpdateOrderStatus(orderId, "done");

        // Reset the associated table
        const tableId = toIdString(bill?.tableId || order.tableId);
        if (restaurantId && tableId) {
          resetTable(restaurantId, tableId)
            .then(() =>
              console.log(
                `[BillingView] Table ${tableId} reset on order close.`
              )
            )
            .catch((err) =>
              console.error(
                `[BillingView] Failed to reset table ${tableId}:`,
                err
              )
            );
        }

        setSuccess("✅ Order closed successfully");
        setTimeout(goBack, 1000);
      } catch (err: any) {
        setError(err?.message || "Failed to close order");
      }
    });
    setConfirmModalOpen(true);
  }

  // ===== Derived values for display =====
  const sessionId = bill?.sessionId ?? order.sessionId ?? "—";
  const tableDisplay =
    bill?.tableNumber ??
    order.tableNumber ??
    (order.tableId ? `#${String(order.tableId).slice(-4)}` : "-");
  const paymentStatus = bill?.paymentStatus ?? order?.paymentStatus ?? "unpaid";
  const orderNumberForDay = bill?.orderNumberForDay ?? undefined;
  const customerName = bill?.customerName ?? order.customerName ?? "Guest";
  const customerContact =
    bill?.customerContact ?? order?.customerContact ?? "—";
  const customerEmail = bill?.customerEmail ?? null;
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
    accepted: "bg-blue-900/50 text-blue-300 border-blue-700",
    preparing: "bg-amber-900/50 text-amber-300 border-amber-700",
    ready: "bg-purple-900/50 text-purple-300 border-purple-700",
    served: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
  };
  const statusIcons: Record<string, string> = {
    accepted: "👍",
    preparing: "🍳",
    ready: "✨",
    served: "🍽️",
  };

  return (
    <section className="h-screen overflow-hidden bg-gray-950 text-gray-200">
      {/* Top bar with navigation and actions */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-white/10 bg-gray-900">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium bg-amber-400 text-black border border-amber-600 hover:bg-amber-500 transition cursor-pointer"
        >
          <ChevronRight className="h-4 w-4 -rotate-180" />
          Back
        </button>
        <div className="ml-auto inline-flex items-center gap-2">
          {bill && (
            <button
              onClick={() => setBillModalOpen(true)}
              disabled={!bill}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition disabled:opacity-50 cursor-pointer"
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
            <div className="bg-red-900/50 border border-red-500/30 text-red-300 px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-2">
              <span className="text-base">⚠️</span>
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-900/50 border border-green-500/30 text-green-300 px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-2 mt-1">
              <span className="text-base">✅</span>
              {success}
            </div>
          )}
        </div>
      )}

      {/* Main content grid */}
      <div className="h-[calc(100vh-68px)] grid grid-cols-1 lg:grid-cols-[45fr_55fr] xl:grid-cols-[45fr_55fr] gap-4 px-3 sm:px-4 pb-3">
        {/* LEFT COLUMN: Summary + Actions */}
        <div className="min-w-0 h-full overflow-auto pr-1 space-y-4">
          {/* Order & Bill Summary */}
          <div className="bg-black/30 rounded-xl border border-white/10 shadow-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white leading-snug">
                  Order & Bill
                </h3>
                {orderNumberForDay && (
                  <span className="inline-block text-[11px] bg-white/10 px-1.5 py-[1px] rounded-md border border-white/20 text-gray-300 mt-0.5">
                    #{orderNumberForDay}
                  </span>
                )}
              </div>

              <div className="text-right space-y-0.5">
                <div
                  className={`inline-flex items-center gap-1 px-2 py-[1px] rounded-full text-[11px] font-semibold border ${
                    (paymentStatus ?? "unpaid") === "paid"
                      ? "bg-green-500/10 text-green-300 border-green-500/20"
                      : "bg-red-500/10 text-red-300 border-red-500/20"
                  }`}
                >
                  {(paymentStatus ?? "unpaid").toUpperCase()}
                </div>
                <div className="text-[10px] text-gray-400">
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
            <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
              <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                <div className="text-gray-400 text-[11px] font-medium leading-tight">
                  Table
                </div>
                <div className="text-[13px] font-semibold text-white leading-tight">
                  {tableDisplay}
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                <div className="text-gray-400 text-[11px] font-medium leading-tight">
                  Customer
                </div>
                <div className="font-semibold text-white truncate text-[13px] leading-snug">
                  {customerName}
                </div>
                <div className="text-[11px] text-gray-400 truncate leading-tight">
                  {customerContact}
                </div>
                {customerEmail && (
                  <div className="text-[11px] text-gray-400 truncate leading-tight">
                    {customerEmail}
                  </div>
                )}
              </div>
            </div>

            {/* Customer notes */}
            {customerNotes && (
              <div className="mt-2.5 bg-white/5 rounded-lg p-2 border border-white/10">
                <div className="text-[11px] text-gray-400 font-medium mb-0.5 leading-tight">
                  Notes
                </div>
                <div className="text-[13px] italic text-gray-200 leading-snug break-words">
                  💬 {customerNotes}
                </div>
              </div>
            )}
          </div>

          {/* Order Status */}
          <div className="bg-black/30 rounded-xl border border-white/10 shadow-lg p-4">
            <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-300" /> Status
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {(["accepted", "preparing", "ready", "served"] as const).map(
                (status) => {
                  const isActive = order?.status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusClick(status)}
                      disabled={isActive || isPending(orderId)}
                      className={`px-2.5 py-1.5 rounded-lg text-[13px] font-semibold border transition-colors ${
                        isActive
                          ? `${statusColors[status]} border-2`
                          : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-base mr-1.5">
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
          <div className="bg-black/30 rounded-xl border border-white/10 shadow-lg p-4">
            <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-300" /> Waiter
            </h4>
            <div className="flex gap-2">
              <select
                value={selectedWaiter}
                onChange={(e) => setSelectedWaiter(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-200 text-[13px] focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none"
              >
                <option className="bg-gray-700 text-white" value="">
                  Select
                </option>
                {waiters.map((w) => (
                  <option className="bg-gray-700 text-white" key={w}>
                    {w}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Enter Manually"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-[13px] placeholder-gray-500 focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none"
              />
              <button
                onClick={handleAliasUpdate}
                disabled={isAliasSaving || (!aliasInput && !selectedWaiter)}
                className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 bg-yellow-400 text-black hover:bg-yellow-500 disabled:bg-white/5 disabled:text-gray-500"
              >
                {isAliasSaving ? "..." : "✔"}
              </button>
            </div>
            <div className="text-[12px] text-gray-400 mt-2">
              Current: <span className="font-semibold text-white">{staffAlias}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-black/30 rounded-xl border border-white/10 shadow-lg p-4">
            <h4 className="text-base font-bold text-white mb-3">Actions</h4>

            {bill?.status === "finalized" ? (
              <>
                <div className="flex flex-col gap-2">
                  {bill?.paymentStatus !== "paid" && (
                    <button
                      onClick={() => setIsPaying(true)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 flex items-center justify-center gap-2 shadow-lg"
                    >
                      <CreditCard className="h-5 w-5" /> Pay Bill
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={handleCloseOrder}
                      className="px-2.5 py-1.5 rounded-lg text-[13px] font-semibold bg-white/10 hover:bg-white/20 text-gray-200 flex items-center justify-center gap-1"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleRejectOrder}
                      disabled={rejecting}
                      className="px-2.5 py-1.5 rounded-lg text-[13px] font-semibold bg-gradient-to-r from-red-600 to-rose-700 text-white hover:opacity-90 flex items-center justify-center gap-1"
                    >
                      {rejecting ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => bill && setEditingBill(bill)}
                    className="px-2.5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:opacity-90 flex items-center justify-center gap-1.5"
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
                    className="px-2.5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" /> Finalize
                  </button>

                  <button
                    onClick={handleCloseOrder}
                    className="col-span-2 mt-1 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold bg-white/10 hover:bg-white/20 text-gray-200 flex items-center justify-center gap-1"
                  >
                    Close Order
                  </button>
                  <button
                    onClick={handleRejectOrder}
                    className="col-span-2 mt-1 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold bg-red-800/50 hover:bg-red-800/80 text-red-200 flex items-center justify-center gap-1"
                  >
                    Reject Order
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Items + Breakdown */}
        <div className="h-full overflow-hidden">
          <div className="h-full overflow-auto space-y-4">
            {/* Order Items */}
            <div className="bg-black/30 rounded-xl border border-white/10 shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <h4 className="text-base font-bold text-white">
                  Order Items
                </h4>
                <span className="text-xs text-gray-400">
                  {bill?.items?.length ? `${bill.items.length} item(s)` : "—"}
                </span>
              </div>
              <div className="divide-y divide-white/10">
                {bill && bill.items?.length ? (
                  bill.items.map((item: any) => {
                    const price = item.priceAtOrder ?? item.price ?? 0;
                    const qty = item.qty ?? 1;
                    const isNew = newlyAddedItems.has(item._id);

                    return (
                      <div
                        key={item._id} // Use instance ID for stable key
                        className={`px-4 py-3 transition-colors duration-500 ${
                          isNew ? "bg-yellow-500/20" : "hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white text-sm truncate">
                              {item.name}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {qty} × {formatINR(price)}
                            </div>
                            {item.notes && (
                              <div className="text-xs italic text-gray-300 mt-1 flex items-center gap-1.5 min-w-0 truncate">
                                <span>💭</span>
                                <span className="truncate">{item.notes}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-base font-bold text-white whitespace-nowrap">
                            {formatINR(qty * price)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-10 text-center text-gray-400 text-sm">
                    No items in bill.
                  </div>
                )}
              </div>
            </div>

            {/* Bill Breakdown */}
            <div className="bg-black/30 rounded-xl border border-white/10 shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <h4 className="text-base font-bold text-white">
                  Bill Breakdown
                </h4>
                {bill?.status === "finalized" &&
                  bill.paymentStatus !== "paid" && (
                    <button
                      onClick={() => setIsPaying(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 shadow"
                    >
                      <CreditCard className="h-4 w-4" /> Pay
                    </button>
                  )}
              </div>

              {bill && billBreakdown ? (
                <div className="px-4 py-4 space-y-2 text-sm">
                  <Row
                    label="Subtotal"
                    value={formatINR(billBreakdown.subtotal)}
                    labelClass="text-gray-300"
                    valueClass="font-semibold text-white"
                  />

                  {appliedDiscountPercent > 0 && (
                    <Row
                      label={`Discount (${appliedDiscountPercent}%)`}
                      value={`-${formatINR(billBreakdown.discountAmount)}`}
                      valueClass="text-green-400 font-semibold"
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

                  <div className="border-t border-white/10 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-white">
                        Settlement Amount
                      </span>
                      <span className="text-2xl font-bold text-green-400">
                        {formatINR(billBreakdown.total)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-6 text-gray-400 text-sm text-center">
                  {isRefreshing ? "Loading bill details..." : "No bill found."}
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
            if (orderId) {
              handleUpdateOrderStatus(orderId, "done");
            }
          }}
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
  labelClass = "text-gray-400",
  valueClass = "text-gray-200",
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