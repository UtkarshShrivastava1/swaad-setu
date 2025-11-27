import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Receipt,
  RefreshCcw,
  User,
  Utensils,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrder } from "../api/order.api";
import { useTableFromUrl } from "../hooks/useTable";

interface OrderItem {
  name: string;
  quantity: number;
  priceAtOrder?: number;
}

interface Order {
  customerName?: string;
  customerEmail?: string;
  tableId: string;
  status: "placed" | "preparing" | "ready" | "cancelled" | string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: "unpaid" | "paid" | "partial" | string;
}

export default function OrderPage() {
  const { tableId, sessionId } = useTableFromUrl();
  const rid = import.meta.env.VITE_RID || "restro10";
  const { orderId } = useParams();
  const navigate = useNavigate();

  const {
    data: order,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery<Order>({
    queryKey: ["order", sessionId, orderId],
    queryFn: () => getOrder(rid, sessionId, orderId!),
    enabled: !!sessionId && !!orderId,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  // === Loading ===
  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading order details...
      </div>
    );

  // === Error ===
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Failed to load order. Please try again.
      </div>
    );

  // === No Order Found ===
  if (!order)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center bg-gray-50 p-6">
        <div className="bg-white shadow-sm rounded-full p-4 mb-4">
          <Receipt className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">
          No Active Order Found
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-4 max-w-xs">
          You haven’t placed any order yet. Browse the menu and add some dishes
          to get started!
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/menu?table=${tableId}`)}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors"
          >
            View Menu
          </button>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCcw
              size={16}
              className={isFetching ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>
    );

  // === Main Render ===
  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="text-emerald-500" /> Order Summary
        </h1>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100"
        >
          <RefreshCcw size={14} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Order Card */}
      <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-4">
        {/* Customer Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <User size={16} /> {order.customerName || "Guest"}
          </div>
          <div className="flex items-center gap-2">
            <Mail size={16} /> {order.customerEmail || "N/A"}
          </div>
          <div className="flex items-center gap-2">
            <Utensils size={16} /> Table {order.tableId}
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              order.status === "placed"
                ? "bg-yellow-100 text-yellow-700"
                : order.status === "preparing"
                  ? "bg-blue-100 text-blue-700"
                  : order.status === "ready"
                    ? "bg-emerald-100 text-emerald-700"
                    : order.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
            }`}
          >
            {order.status}
          </div>
        </div>

        {/* Items */}
        <div className="overflow-x-auto">
          <div className="min-w-full bg-white rounded-lg shadow divide-y">
            {/* Header Row */}
            <div className="flex justify-between px-4 py-2 font-semibold text-gray-700 bg-gray-100">
              <span className="w-1/2 sm:w-1/2">Name</span>
              <span className="w-1/4 text-center hidden sm:inline">
                Quantity
              </span>
              <span className="w-1/4 text-right hidden sm:inline">Price</span>
            </div>

            {/* Items */}
            {order.items?.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center px-4 py-3 text-gray-800"
              >
                <span className="w-1/2 sm:w-1/2 font-medium">{item.name}</span>
                <span className="w-1/4 text-center hidden sm:inline">
                  {item.quantity} × ₹{item.priceAtOrder || 0}
                </span>
                <span className="w-1/4 text-right hidden sm:inline">
                  ₹{(item.quantity * (item.priceAtOrder || 0)).toFixed(2)}
                </span>

                {/* Mobile view */}
                <div className="sm:hidden w-full flex justify-between text-sm text-gray-600 mt-1">
                  <span>
                    Qty: {item.quantity} × ₹{item.priceAtOrder || 0}
                  </span>
                  <span>
                    ₹{(item.quantity * (item.priceAtOrder || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total & Payment */}
        <div className="flex justify-between items-center mt-4 font-semibold text-lg">
          <span>Total Amount</span>
          <span className="text-emerald-600">₹{order.totalAmount}</span>
        </div>
        <div className="text-sm text-gray-600 text-right mt-2">
          Payment:{" "}
          <span
            className={`font-semibold ${
              order.paymentStatus === "paid"
                ? "text-emerald-600"
                : "text-yellow-600"
            }`}
          >
            {order.paymentStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
