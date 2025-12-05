import {
  AlertCircle,
  CheckCircle,
  Clock,
  IndianRupee,
  Receipt,
  Utensils,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { deleteOrderById } from "../../../api/staff/staff.operations.api";
import { useTenant } from "../../../context/TenantContext";
// Add this import - adjust path as needed for your project
// import { ConfirmModal } from "../../../components/ConfirmModal";

export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "done"
  | "closed";

export type PaymentStatus = "unpaid" | "paid";

export interface BillItem {
  name: string;
  qty: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  serverId?: string;
  tableId: string;
  sessionId?: string;
  items: BillItem[];
  tableNumber?: string;
  subtotal: number;
  totalAmount: number;
  amount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  OrderNumberForDay?: number;
  customerName?: string;
  staffAlias?: string;
  version: number;
  createdAt: string | { $date: string };
}

type Props = {
  filteredOrders: Order[];
  handleUpdateOrderStatus: (
    orderIdOrServerId: string | undefined,
    newStatus: OrderStatus
  ) => Promise<void> | void;
  handleBillView: (orderId: string) => void;
  isPending: (id?: string) => boolean;
  formatINR: (amount: number | undefined | null) => string;
  onOrderRejected?: (orderId: string) => void;
};

/* ---------------------------------------------
   Status display mapping
--------------------------------------------- */
const getOrderStatusDisplay = (status: string) => {
  const map: Record<
    string,
    { label: string; color: string; icon: React.ElementType }
  > = {
    placed: {
      label: "Placed",
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: AlertCircle,
    },
    accepted: {
      label: "Accepted",
      color: "bg-sky-100 text-sky-800 border-sky-200",
      icon: CheckCircle,
    },
    preparing: {
      label: "Preparing",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Clock,
    },
    ready: {
      label: "Ready",
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: CheckCircle,
    },
    served: {
      label: "Served",
      color: "bg-teal-100 text-teal-800 border-teal-200",
      icon: CheckCircle,
    },
    done: {
      label: "Completed",
      color: "bg-slate-100 text-slate-800 border-slate-200",
      icon: CheckCircle,
    },
    closed: {
      label: "Closed",
      color: "bg-slate-300 text-slate-700 border-slate-400",
      icon: CheckCircle,
    },
  };

  return (
    map[status] || {
      label: status,
      color: "bg-slate-100 text-slate-800 border-slate-200",
      icon: AlertCircle,
    }
  );
};

/* ---------------------------------------------
   Order Progress Tracker
--------------------------------------------- */
const statusStages: OrderStatus[] = [
  "placed",
  "accepted",
  "preparing",
  "ready",
  "served",
];

const stageLabels: Record<OrderStatus, string> = {
  placed: "Placed",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  done: "Done",
  closed: "Closed",
};

const OrderProgressBar = ({
  currentStatus,
}: {
  currentStatus: OrderStatus;
}) => {
  const currentIndex = statusStages.indexOf(currentStatus);
  const lastIndex = statusStages.length - 1;

  const colorMap = {
    placed: "bg-amber-500 border-amber-500",
    accepted: "bg-sky-500 border-sky-500",
    preparing: "bg-blue-500 border-blue-500",
    ready: "bg-violet-500 border-violet-500",
    served: "bg-emerald-500 border-emerald-500",
  };

  const barMap = {
    placed: "bg-amber-400",
    accepted: "bg-sky-400",
    preparing: "bg-blue-400",
    ready: "bg-violet-400",
    served: "bg-emerald-400",
  };

  return (
    <div className="w-full mt-3 mb-1 px-1 sm:px-2">
      <div className="flex items-center justify-between w-full max-w-full overflow-x-auto">
        {statusStages.map((status, idx) => {
          const isLast = idx === lastIndex;
          const isCompleted =
            idx <= currentIndex ||
            ["done", "served", "closed"].includes(currentStatus);
          const isActive = idx === currentIndex;

          return (
            <div key={status} className="flex items-center flex-1 min-w-[50px]">
              {/* Node */}
              <div
                className={`relative flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 text-[10px] sm:text-xs font-bold transition-all duration-300 shrink-0
                  ${
                    isCompleted
                      ? `${
                          colorMap[status as keyof typeof colorMap]
                        } text-white`
                      : "border-slate-300 text-slate-400 bg-white"
                  }
                  ${isActive ? "ring-2 ring-offset-1 ring-slate-300" : ""}
                `}
              >
                {isCompleted ? (
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                ) : (
                  idx + 1
                )}
              </div>

              {/* Connector */}
              {!isLast && (
                <div
                  className={`flex-1 h-1 sm:h-1.5 transition-all duration-300 ${
                    idx < currentIndex
                      ? barMap[status as keyof typeof barMap]
                      : "bg-slate-200"
                  }`}
                ></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stage Labels */}
      <div className="flex justify-between mt-2 text-[10px] sm:text-[11px] text-slate-500 font-medium">
        {statusStages.map((s) => (
          <div key={s} className="text-center flex-1 truncate capitalize">
            {stageLabels[s]}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------------------------------------------
   Simple ConfirmModal Component
--------------------------------------------- */
interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">
          Confirm Action
        </h3>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------
   Main Component
--------------------------------------------- */
export default function OrdersComponent({
  filteredOrders,
  handleUpdateOrderStatus,
  handleBillView,
  isPending,
  formatINR,
  onOrderRejected,
}: Props) {
  const [loadingBillId, setLoadingBillId] = useState<string | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [hiddenOrderIds, setHiddenOrderIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<
    (() => void) | undefined
  >();

  const { rid: ridFromUrl } = useParams();
  const { rid: ridFromContext } = useTenant();
  const rid = ridFromUrl || ridFromContext || "";

  const handleBillViewWithGeneration = async (order: Order) => {
    const orderId = order.id;
    const restaurantId = rid;

    try {
      setLoadingBillId(orderId);

      // Try existing bill
      try {
        const { getBillByOrderId } = await import(
          "../../../api/staff/staff.operations.api"
        );
        await getBillByOrderId(restaurantId, orderId);
        handleBillView(orderId);
        return;
      } catch {
        console.log("Bill doesn't exist, creating new one");
      }

      // Create bill
      const staffToken = localStorage
        .getItem("staffToken")
        ?.replace(/^"|"$/g, "");
      const apiBase = import.meta.env.VITE_API_BASE_URL;

      if (!staffToken) {
        throw new Error("No staff token found");
      }

      const staffAlias = order.staffAlias || "Waiter";

      const initialSubtotal =
        order.items?.reduce(
          (sum, item) => sum + (item.price || 0) * (item.qty || 1),
          0
        ) || 0;

      const calculateDiscountAmount = (
        subtotal: number,
        discountPercent: number
      ) => (subtotal * discountPercent) / 100;

      const calculateServiceChargeAmount = (
        subtotal: number,
        serviceChargePercent: number
      ) => (subtotal * serviceChargePercent) / 100;

      const discountAmount = calculateDiscountAmount(initialSubtotal, 0);
      const serviceChargeAmount = calculateServiceChargeAmount(
        initialSubtotal,
        0
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
            staffAlias,
            extras: [],
            subtotal: initialSubtotal,
            discountPercent: 0,
            discountAmount,
            serviceChargePercent: 0,
            serviceChargeAmount,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          handleBillView(orderId);
          return;
        }
        throw new Error(data.error || "Bill generation failed");
      }

      handleBillView(orderId);
    } catch (err) {
      console.warn("⚠️ Bill creation failed:", err);
      if (
        err instanceof Error &&
        (err.message.includes("Active bill exists") ||
          err.message.includes("Conflict"))
      ) {
        handleBillView(orderId);
      }
    } finally {
      setLoadingBillId(null);
    }
  };

  const handleRejectOrder = (orderId: string) => {
    setConfirmMessage(
      "Are you sure you want to reject this order? This action cannot be undone."
    );

    setPendingAction(() => async () => {
      try {
        setRejectingOrderId(orderId);
        setErrorMessage(null);

        // Delete the order
        await deleteOrderById(rid, orderId);

        // Hide the order immediately in UI (optimistic update)
        setHiddenOrderIds((prev) => new Set(prev).add(orderId));
        setRejectingOrderId(null);

        // Show success message
        setSuccess("✅ Order rejected successfully");
        setTimeout(() => setSuccess(null), 1600);

        // Notify parent if callback exists - THIS IS THE KEY!
        if (onOrderRejected) {
          onOrderRejected(orderId);
        }

        // Dispatch multiple events to ensure parent catches it
        window.dispatchEvent(new CustomEvent("staff:refreshOrders"));
        window.dispatchEvent(new CustomEvent("orders:refresh"));
        window.dispatchEvent(new CustomEvent("refresh-orders"));

        // Force a more aggressive refresh after a short delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("staff:refreshOrders"));
        }, 100);
      } catch (err: any) {
        console.error("Failed to reject order:", err);

        // Handle specific error types
        let errorMsg = "Failed to reject order.";

        if (err?.response?.status === 429) {
          errorMsg = "Too many requests. Please wait a moment and try again.";
        } else if (err?.response?.status === 404) {
          errorMsg = "Order not found. It may have already been deleted.";
          // If order doesn't exist, hide it anyway
          setHiddenOrderIds((prev) => new Set(prev).add(orderId));
        } else if (err?.response?.status === 403) {
          errorMsg = "You don't have permission to reject this order.";
        } else if (err?.message) {
          errorMsg = err.message;
        }

        setErrorMessage(errorMsg);
        setRejectingOrderId(null);

        // Auto-hide error after 5 seconds
        setTimeout(() => setErrorMessage(null), 5000);
      }
    });

    setConfirmModalOpen(true);
  };

  return (
    <div className="w-full space-y-4">
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

      {/* Success Banner */}
      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg shadow-md animate-slide-down">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-emerald-700 font-medium">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-emerald-400 hover:text-emerald-600 transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg shadow-md animate-slide-down">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-rose-800">Error</h3>
              <p className="text-sm text-rose-700 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-600 transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {filteredOrders
        .filter((order) => !hiddenOrderIds.has(order.id))
        .map((order) => {
          const statusDisplay = getOrderStatusDisplay(order.status);
          const StatusIcon = statusDisplay.icon;
          const serverId = order.serverId ?? order.id;
          const tableNoDisplay = order.tableNumber || "—";

          return (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-md border border-slate-200 hover:shadow-lg transition-all overflow-hidden cursor-pointer"
            >
              <div className="flex flex-col p-4 sm:p-5 gap-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center shadow-sm shrink-0">
                      <Utensils className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-base sm:text-lg">
                        Table {tableNoDisplay}
                      </div>
                      <div className="text-sm text-slate-600 truncate">
                        {order.customerName || "Guest"}
                      </div>
                      <div className="text-xs text-slate-400">
                        #{order.OrderNumberForDay ?? "—"}
                      </div>
                      <div className="text-xs italic text-slate-500 mt-0.5">
                        Waiter: {order.staffAlias || "Waiter"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold border ${statusDisplay.color}`}
                    >
                      <StatusIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {statusDisplay.label}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold border ${
                        order.paymentStatus === "paid"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-rose-100 text-rose-800 border-rose-200"
                      }`}
                    >
                      <IndianRupee className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase">
                        Items
                      </div>
                      <div className="text-base sm:text-lg font-semibold text-slate-800">
                        {order.items?.length ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <IndianRupee className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase">
                        Total
                      </div>
                      <div className="text-base sm:text-lg font-bold text-emerald-600">
                        {formatINR(order.totalAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase">
                        Time
                      </div>
                      <div className="text-sm sm:text-base font-medium text-slate-700">
                        {new Date(
                          typeof order.createdAt === "object"
                            ? order.createdAt.$date
                            : order.createdAt
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                {order.items && order.items.length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">
                      Ordered Items
                    </h4>
                    <div className="space-y-3">
                      {order.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex flex-col flex-grow pr-2">
                            <span className="font-semibold text-slate-800 text-base">
                              {item.name}
                            </span>
                            {item.notes && (
                              <span className="text-xs text-slate-500 italic mt-0.5">
                                {item.notes}
                              </span>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className="font-medium text-slate-700">
                              ×{item.qty}
                            </span>
                            <div className="text-sm font-bold text-slate-800 mt-0.5">
                              ₹{formatINR(item.price * item.qty)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {order.status === "placed" && (
                    <button
                      onClick={() =>
                        handleUpdateOrderStatus(serverId, "accepted")
                      }
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-sm"
                      disabled={isPending(serverId)}
                    >
                      Accept Order
                    </button>
                  )}
                  {order.status === "accepted" && (
                    <button
                      onClick={() =>
                        handleUpdateOrderStatus(serverId, "preparing")
                      }
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-sm"
                      disabled={isPending(serverId)}
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === "preparing" && (
                    <button
                      onClick={() => handleUpdateOrderStatus(serverId, "ready")}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm"
                      disabled={isPending(serverId)}
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === "ready" && (
                    <button
                      onClick={() =>
                        handleUpdateOrderStatus(serverId, "served")
                      }
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-teal-500 text-white hover:bg-teal-600 transition-all shadow-sm"
                      disabled={isPending(serverId)}
                    >
                      Mark Served
                    </button>
                  )}
                  {order.status === "done" && (
                    <button
                      onClick={() =>
                        handleUpdateOrderStatus(serverId, "closed")
                      }
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-500 text-white hover:bg-slate-600 transition-all shadow-sm"
                      disabled={isPending(serverId)}
                    >
                      Close Order
                    </button>
                  )}
                  {order.status !== "closed" && (
                    <button
                      onClick={() => handleBillViewWithGeneration(order)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={loadingBillId === order.id}
                    >
                      {loadingBillId === order.id
                        ? "Generating Bill..."
                        : "View Details →"}
                    </button>
                  )}

                  {/* Reject Button */}
                  <button
                    onClick={() => handleRejectOrder(order.id)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    disabled={
                      rejectingOrderId === order.id || isPending(order.id)
                    }
                  >
                    {rejectingOrderId === order.id ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Reject
                      </>
                    )}
                  </button>
                </div>

                <OrderProgressBar currentStatus={order.status} />
              </div>
            </div>
          );
        })}

      {filteredOrders.filter((order) => !hiddenOrderIds.has(order.id))
        .length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-8 sm:p-12 text-center border border-slate-200 cursor-default">
          <Receipt className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-base sm:text-lg font-semibold text-slate-600 mb-2">
            No Orders Found
          </h3>
          <p className="text-sm sm:text-base text-slate-500">
            There are no active orders at the moment.
          </p>
        </div>
      )}
    </div>
  );
}
