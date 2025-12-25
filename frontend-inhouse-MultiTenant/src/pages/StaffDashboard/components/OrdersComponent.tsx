import {
  AlertCircle,
  CheckCircle,
  Clock,
  IndianRupee,
  Loader2,
  Printer,
  Receipt,
  Utensils,
  XCircle,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { deleteOrderById } from "../../../api/staff/staff.operations.api";
import { useTenant } from "../../../context/TenantContext";
import { ConfirmModal } from "./ConfirmModal";
import KOTPrintView from "./KOTPrintView";
import type { ApiBill } from "../../../api/staff/staff.operations.api"; // Import ApiBill type

// Type definitions remain the same
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
  handleBillView: (order: Order, billData?: ApiBill) => void; // Updated prop type
  isPending: (id?: string) => boolean;
  formatINR: (amount: number | undefined | null) => string;
  onOrderRejected?: (orderId: string) => void;
  waiterNames: string[]; // Added prop
  onUpdateStaffAlias: (orderId: string, newAlias: string) => Promise<void>; // Added prop
  highlightedOrders?: Map<string, Set<string>>; // Prop for highlighting
};

const getOrderStatusDisplay = (status: string) => {
  const map: Record<
    string,
    { label: string; color: string; icon: React.ElementType }
  > = {
    placed: {
      label: "Placed",
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: AlertCircle,
    },
    accepted: {
      label: "Accepted",
      color: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      icon: CheckCircle,
    },
    preparing: {
      label: "Preparing",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      icon: Clock,
    },
    ready: {
      label: "Ready",
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: CheckCircle,
    },
    served: {
      label: "Served",
      color: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      icon: CheckCircle,
    },
    done: {
      label: "Completed",
      color: "bg-zinc-700 text-zinc-400 border-zinc-600",
      icon: CheckCircle,
    },
    closed: {
      label: "Closed",
      color: "bg-zinc-800 text-zinc-500 border-zinc-700",
      icon: CheckCircle,
    },
  };
  return (
    map[status] || {
      label: status,
      color: "bg-zinc-700 text-zinc-300 border-zinc-600",
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
    <div className="w-full mt-auto pt-3 mb-1 px-1 sm:px-2">
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
                      : "border-zinc-700 text-zinc-500 bg-zinc-800"
                  }
                  ${isActive ? "ring-2 ring-offset-1 ring-zinc-600" : ""}
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
                      : "bg-zinc-700"
                  }`}
                ></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stage Labels */}
      <div className="flex justify-between mt-2 text-[10px] sm:text-[11px] text-zinc-400 font-medium">
        {statusStages.map((s) => (
          <div key={s} className="text-center flex-1 truncate capitalize">
            {stageLabels[s]}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function OrdersComponent({
  filteredOrders,
  handleUpdateOrderStatus,
  handleBillView,
  isPending,
  formatINR,
  onOrderRejected,
  waiterNames, // Destructure waiterNames
  onUpdateStaffAlias, // Destructure onUpdateStaffAlias
  highlightedOrders = new Map(), // Destructure and default prop
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
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { rid, tenant } = useTenant();

  const sortedOrders = React.useMemo(() => {
    if (!highlightedOrders.size) {
      return filteredOrders;
    }
    const highlighted = [];
    const rest = [];
    for (const order of filteredOrders) {
      if (highlightedOrders.has(order.id)) {
        highlighted.push(order);
      } else {
        rest.push(order);
      }
    }
    return [...highlighted, ...rest];
  }, [filteredOrders, highlightedOrders]);

  const handlePrintKOT = (order: Order) => {
    setOrderToPrint(order);
  };

  useEffect(() => {
    if (orderToPrint && printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open("", "_blank", "height=600,width=400");
      if (printWindow) {
        printWindow.document.write("<html><head><title>Print KOT</title>");
        printWindow.document.write("</head><body>");
        printWindow.document.write(printContent);
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
      setOrderToPrint(null); // Reset after printing
    }
  }, [orderToPrint]);

  const handleBillViewWithGeneration = async (order: Order) => {
    const orderId = order.id;
    const restaurantId = rid;
    const staffToken = localStorage
      .getItem("staffToken")
      ?.replace(/^"|"$/g, "");
    const apiBase = import.meta.env.VITE_API_BASE_URL;

    if (!staffToken) {
      console.error("No staff token found");
      setErrorMessage("Authentication error: No staff token found.");
      return;
    }

    try {
      setLoadingBillId(orderId);
      let billData = null;

      // Try existing bill
      try {
        const { getBillByOrderId } = await import(
          "../../../api/staff/staff.operations.api"
        );
        billData = await getBillByOrderId(restaurantId, orderId);
        if (!billData || !billData._id) {
          throw new Error("Existing bill found but is invalid or missing _id.");
        }
        handleBillView(order, billData); // Updated call
        return;
      } catch (err) {
        console.log("No existing bill found or existing bill is invalid. Attempting to create new one.", err);
        // Create bill
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
          const errorData = await res.json().catch(() => ({}));
          if (res.status === 409) {
            // If conflict (bill already exists), try to fetch it again
            const { getBillByOrderId } = await import(
              "../../../api/staff/staff.operations.api"
            );
            billData = await getBillByOrderId(restaurantId, orderId);
            if (!billData || !billData._id) {
              throw new Error("Bill conflict: existing bill invalid after retry.");
            }
          } else {
            throw new Error(errorData.message || `Bill generation failed (${res.status})`);
          }
        } else {
          const json = await res.json();
          billData = json.bill || json;
          if (!billData?._id) {
            throw new Error("Bill creation succeeded but no bill ID returned.");
          }
        }
      }

      // Now ensure billData is available before passing
      if (!billData) {
        throw new Error("Failed to obtain bill data for viewing.");
      }

      handleBillView(order, billData); // Pass the full order object and billData
    } catch (err: any) {
      console.warn("⚠️ Bill fetch/creation failed:", err);
      const errorMsg = err.message || "Unable to fetch or create bill.";
      setErrorMessage(errorMsg);
      // If error, ensure handleBillView is still called to at least show the order
      // handleBillView(order); // Potentially still navigate, but it will be empty
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

  const visibleOrders = sortedOrders.filter(
    (order) => !hiddenOrderIds.has(order.id)
  );

  return (
    <div className="w-full space-y-4">
      <div style={{ display: "none" }}>
        {orderToPrint && (
          <KOTPrintView
            order={orderToPrint}
            ref={printRef}
            restaurantName={tenant?.name}
          />
        )}
      </div>
      <ConfirmModal
        isOpen={confirmModalOpen}
        onConfirm={() => {
          pendingAction?.();
          setConfirmModalOpen(false);
        }}
        onCancel={() => setConfirmModalOpen(false)}
        message={confirmMessage}
      />
      {success && (
        <div className="bg-emerald-900/40 border-l-4 border-emerald-500 p-4 rounded-lg shadow-md animate-slide-down">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-emerald-300 font-medium">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="bg-rose-900/40 border-l-4 border-rose-500 p-4 rounded-lg shadow-md animate-slide-down">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-rose-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-rose-300">Error</h3>
              <p className="text-sm text-rose-200 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-300 transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {sortedOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedOrders.map((order) => {
            const statusDisplay = getOrderStatusDisplay(order.status);
            const StatusIcon = statusDisplay.icon;
            const serverId = order.serverId ?? order.id;
            const tableNoDisplay =
              order.tableNumber === "999"
                ? "Take out"
                : order.tableNumber || "—";
            const isHighlighted = highlightedOrders.has(order.id);
            const newItemIds = highlightedOrders.get(order.id) ?? new Set();

            return (
              <div
                key={order.id}
                className={`bg-zinc-900 rounded-xl shadow-lg border transition-all overflow-hidden flex flex-col ${
                  isHighlighted
                    ? "border-yellow-400 ring-2 ring-yellow-400/50"
                    : "border-zinc-700 hover:border-zinc-600"
                }`}
              >
                <div className="flex flex-col p-4 sm:p-5 gap-4 flex-grow">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 flex items-center justify-center shadow-sm shrink-0">
                        <Utensils className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg flex items-center gap-2">
                          {tableNoDisplay === "Take out"
                            ? "Take out"
                            : `Table ${tableNoDisplay}`}
                          {isHighlighted && (
                            <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-yellow-400 text-black rounded-full animate-pulse">
                              New Item(s)
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-zinc-300 truncate">
                          {order.customerName || "Guest"}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          #{order.OrderNumberForDay ?? "—"}
                        </div>
                        {/* Waiter Select Dropdown */}
                        <div className="mt-2">
                          <select
                            value={order.staffAlias || ""}
                            onChange={(e) => onUpdateStaffAlias(order.id, e.target.value)}
                            className="w-full px-2 py-1 rounded-md bg-zinc-700 border border-zinc-600 text-zinc-200 text-xs focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                          >
                            <option value="">Select Waiter</option>
                            {waiterNames.map((name) => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusDisplay.color}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusDisplay.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          order.paymentStatus === "paid"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        <IndianRupee className="h-3.5 w-3.5" />
                        {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 border-t border-zinc-800">
                    {order.status === "placed" && (
                      <button
                        onClick={() =>
                          handleUpdateOrderStatus(serverId, "accepted")
                        }
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition-all shadow-sm"
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
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-all shadow-sm"
                        disabled={isPending(serverId)}
                      >
                        Start Preparing
                      </button>
                    )}
                    {order.status === "preparing" && (
                      <button
                        onClick={() =>
                          handleUpdateOrderStatus(serverId, "ready")
                        }
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all shadow-sm"
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
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition-all shadow-sm"
                        disabled={isPending(serverId)}
                      >
                        Mark Served
                      </button>
                    )}
                    <button
                      onClick={() => handlePrintKOT(order)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Print KOT
                    </button>
                    {order.status !== "closed" && (
                      <button
                        onClick={() => handleBillViewWithGeneration(order)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={loadingBillId === order.id}
                      >
                        {loadingBillId === order.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating Bill...
                          </>
                        ) : (
                          "View Details →"
                        )}
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

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 pt-4 border-t border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-zinc-400" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 uppercase">
                          Items
                        </div>
                        <div className="text-base sm:text-lg font-semibold text-white">
                          {order.items?.length ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-900/40 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 uppercase">
                          Time
                        </div>
                        <div className="text-sm sm:text-base font-medium text-zinc-300">
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

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-900/40 flex items-center justify-center">
                        <IndianRupee className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 uppercase">
                          Total
                        </div>
                        <div className="text-base sm:text-lg font-bold text-emerald-400">
                          {formatINR(order.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  {order.items && order.items.length > 0 && (
                    <div className="border-t border-zinc-800 pt-3">
                      <h4 className="text-sm font-semibold text-zinc-300 mb-2">
                        Ordered Items
                      </h4>
                      <div className="space-y-3">
                        {order.items.map((item: any) => {
                          const isNew = newItemIds.has(item._id);
                          return (
                            <div
                              key={item._id}
                              className={`p-3 rounded-lg border transition-colors duration-300 ${
                                isNew
                                  ? "bg-yellow-500/10 border-yellow-500/30"
                                  : "bg-zinc-800 border-zinc-700"
                              }`}
                            >
                              <div className="flex items-center">
                                {/* Item Name */}
                                <div className="flex-1 pr-2">
                                  <span className="font-semibold text-white text-base">
                                    {item.name}
                                  </span>
                                  {isNew && (
                                    <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-yellow-400 text-black rounded-full">
                                      New
                                    </span>
                                  )}
                                </div>
                                {/* Quantity */}
                                <div className="w-52 text-center">
                                  <span className="font-medium text-zinc-300">
                                    ×{item.qty}
                                  </span>
                                </div>
                                {/* Price */}
                                <div className="w-25 text-left">
                                  <span className="font-bold text-white">
                                    {item.price * item.qty > 0
                                      ? formatINR(item.price * item.qty)
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>
                              {item.notes && (
                                <div className="pt-1 pl-1">
                                  <span className="text-xs text-yellow-500 italic">
                                    Note: {item.notes}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <OrderProgressBar currentStatus={order.status} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-xl shadow-lg p-8 sm:p-12 text-center border border-zinc-700 cursor-default">
          <Receipt className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-zinc-500" />
          <h3 className="text-base sm:text-lg font-semibold text-zinc-300 mb-2">
            No Orders Found
          </h3>
          <p className="text-sm sm:text-base text-zinc-400">
            There are no active orders at the moment.
          </p>
        </div>
      )}
    </div>
  );
}
