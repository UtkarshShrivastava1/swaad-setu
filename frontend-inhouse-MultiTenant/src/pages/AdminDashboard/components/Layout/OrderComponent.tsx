import {
  AlertCircle,
  CheckCircle,
  Clock,
  IndianRupee,
  Receipt,
  Utensils,
} from "lucide-react";
import React from "react";

/* ---------------------------------------------
   Local minimal types
--------------------------------------------- */
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
  createdAt: string;
}

type Props = {
  filteredOrders: Order[] ;
  handleUpdateOrderStatus: (
    orderIdOrServerId: string | undefined,
    newStatus: OrderStatus
  ) => Promise<void> | void;
  handleBillView: (orderId: string) => void;
  isPending: (id?: string) => boolean;
  formatINR: (amount: number | undefined | null) => string;
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

  return (
    <div className="w-full mt-3 mb-1 px-1 sm:px-2">
      <div className="flex items-center justify-between w-full max-w-full overflow-x-auto">
        {statusStages.map((status, idx) => {
          const isLast = idx === lastIndex;
          const isCompleted =
            idx === 0 ||
            idx <= currentIndex ||
            ["done", "served", "closed"].includes(currentStatus);

          const isFinalStageCompleted =
            ["served", "done", "closed"].includes(currentStatus) &&
            idx === lastIndex;

          return (
            <div key={status} className="flex items-center flex-1 min-w-[50px]">
              <div
                className={`relative flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 text-[10px] sm:text-xs font-bold transition-all duration-300 shrink-0
                  ${
                    isFinalStageCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isCompleted
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-slate-300 text-slate-400 bg-white"
                  }`}
              >
                {isCompleted || isFinalStageCompleted ? (
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                ) : (
                  idx + 1
                )}
              </div>

              {!isLast && (
                <div
                  className={`flex-1 h-1 sm:h-1.5 transition-all duration-300 ${
                    isFinalStageCompleted
                      ? "bg-emerald-500"
                      : idx < currentIndex
                      ? "bg-blue-500"
                      : idx === currentIndex
                      ? "bg-blue-400"
                      : "bg-slate-200"
                  }`}
                ></div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-2 text-[10px] sm:text-[11px] text-slate-500 font-medium">
        {statusStages.map((s) => (
          <div key={s} className="text-center flex-1 truncate">
            {stageLabels[s]}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------------------------------------------
   Main Responsive Component
--------------------------------------------- */
export default function OrdersComponent({
  filteredOrders,
  handleUpdateOrderStatus,
  handleBillView,
  isPending,
  formatINR,
}: Props) {
  const [loadingBillId, setLoadingBillId] = React.useState<string | null>(null);

  /* ---------------------------------------------
     Generate Bill if Not Exists → Then Show
  --------------------------------------------- */
  const handleBillViewWithGeneration = async (order: Order) => {
    const orderId = order.id;
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    const restaurantId =
      import.meta.env.VITE_RID ||
      import.meta.env.VITE_RESTAURANT_ID ||
      "restro10";

    let staffToken = localStorage.getItem("adminToken");
    if (staffToken) staffToken = staffToken.replace(/^"|"$/g, "");

    try {
      setLoadingBillId(orderId);

      const checkEndpoint = `${apiBase}/api/${restaurantId}/orders/bill/${orderId}`;
      const checkRes = await fetch(checkEndpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
      });

      if (checkRes.ok) {
        handleBillView(orderId);
        return;
      }

      const generateEndpoint = `${apiBase}/api/${restaurantId}/orders/${orderId}/bill`;
      const payload = {
        staffAlias: order.staffAlias || "Waiter",
        extras: [{ name: "Corkage", amount: 0 }],
      };

      const res = await fetch(generateEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate bill");
      }

      handleBillView(orderId);
    } catch (err) {
      console.warn("⚠️ Bill fetch or generation failed:", err);
    } finally {
      setLoadingBillId(null);
    }
  };

  /* ---------------------------------------------
     Render Orders
  --------------------------------------------- */
  return (
    <div className="w-full space-y-4">
      {filteredOrders.map((order) => {
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
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold border ${statusDisplay.color} cursor-pointer`}
                  >
                    <StatusIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    {statusDisplay.label}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold border cursor-pointer ${
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
                <div className="flex items-center gap-3 cursor-pointer">
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

                <div className="flex items-center gap-3 cursor-pointer">
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

                <div className="flex items-center gap-3 cursor-pointer">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Time</div>
                    <div className="text-sm sm:text-base font-medium text-slate-700">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {order.status === "placed" && (
                  <button
                    onClick={() =>
                      handleUpdateOrderStatus(serverId, "accepted")
                    }
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-sm cursor-pointer"
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
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-sm cursor-pointer"
                    disabled={isPending(serverId)}
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === "preparing" && (
                  <button
                    onClick={() => handleUpdateOrderStatus(serverId, "ready")}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm cursor-pointer"
                    disabled={isPending(serverId)}
                  >
                    Mark Ready
                  </button>
                )}
                {order.status === "ready" && (
                  <button
                    onClick={() => handleUpdateOrderStatus(serverId, "served")}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-teal-500 text-white hover:bg-teal-600 transition-all shadow-sm cursor-pointer"
                    disabled={isPending(serverId)}
                  >
                    Mark Served
                  </button>
                )}
                {order.status === "done" && (
                  <button
                    onClick={() => handleUpdateOrderStatus(serverId, "closed")}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-500 text-white hover:bg-slate-600 transition-all shadow-sm cursor-pointer"
                    disabled={isPending(serverId)}
                  >
                    Close Order
                  </button>
                )}
                {order.status !== "closed" && (
                  <button
                    onClick={() => handleBillViewWithGeneration(order)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    disabled={loadingBillId === order.id}
                  >
                    {loadingBillId === order.id
                      ? "Generating Bill..."
                      : "View Details →"}
                  </button>
                )}
              </div>

              {/* Progress */}
              <OrderProgressBar currentStatus={order.status} />
            </div>
          </div>
        );
      })}

      {filteredOrders.length === 0 && (
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
