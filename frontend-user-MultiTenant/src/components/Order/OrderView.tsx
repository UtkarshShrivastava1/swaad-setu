import {
  CheckCircle2,
  ChefHat,
  Clock,
  HandPlatter,
  RefreshCw,
  ThumbsUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OrderStatusLogout } from "../../../OrderStatusLogout";
import type { Order } from "../../api/order.api";
import { getOrderById } from "../../api/order.api";
import { useTable } from "../../context/TableContext";
import { useTenant } from "../../context/TenantContext";

export default function OrderView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { rid } = useTenant();
  const { tableId } = useTable(); // Access tableId from useTable
  const sessionId = sessionStorage.getItem("resto_session_id");

  const logoutAndRedirect = useCallback(() => {
    // This function handles the core logout logic. For app-wide reusability,
    // this logic should ideally be moved to a central authentication context
    // that components like a global header could also use.
    console.log("Order paid. Logging out session...");
    sessionStorage.removeItem("resto_session_id");
    // Ensure you have a route set up for `/t/:rid/thank-you`.
    navigate(`/t/${rid}`);
  }, [rid, navigate]);

  // --------------------- Fetch ---------------------
  const fetchOrder = async () => {
    if (!orderId || !rid) return;
    try {
      setLoading(true);
      const res = await getOrderById(rid, orderId, sessionId!);
      setOrder(res.order);
      setError(null);
    } catch (err) {
      console.error("❌ Failed to fetch order:", err);
      setError("Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [orderId, rid]);

  // --------------------- Loading / Error States ---------------------
  if (loading) {
    return (
      <div className="flex flex-col h-screen justify-center items-center bg-gray-900 text-gray-400">
        <div className="animate-spin mb-4">
          <RefreshCw size={32} className="text-yellow-500" />
        </div>
        <span className="text-lg">Loading your order...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col h-screen justify-center items-center bg-gray-900 text-gray-400 px-4">
        <h2 className="font-bold text-2xl text-white mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6 text-center">
          {error || "We couldn't find the order you're looking for."}
        </p>
        <button
          onClick={() => navigate(`/t/${rid}/menu`)}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold rounded-xl px-8 py-3.5 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  // --------------------- Helpers ---------------------
  const taxPercent =
    order.appliedTaxes?.find((t: any) => t.code === "GST")?.percent ?? 0;
  const servicePercent = order.appliedServiceChargePercent ?? 0;
  const discountPercent = order.appliedDiscountPercent ?? 0;

  // ✅ Updated Status Flow (Chronological)
  const statusSteps = [
    { key: "placed", label: "Placed", icon: Clock },
    { key: "accepted", label: "Accepted", icon: ThumbsUp },
    { key: "preparing", label: "Preparing", icon: ChefHat },
    { key: "ready", label: "Ready", icon: HandPlatter },
    { key: "served", label: "Served", icon: CheckCircle2 },
  ];

  // Determine which step is current
  const currentStep =
    statusSteps.findIndex((s) => s.key === order.status) >= 0
      ? statusSteps.findIndex((s) => s.key === order.status)
      : 0;

  // --------------------- UI ---------------------
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col pb-28 relative">
      <OrderStatusLogout
        status={order?.paymentStatus}
        onLogout={logoutAndRedirect}
      />

      <div className="max-w-2xl w-full mx-auto p-4 space-y-8">
        {/* Order Info */}
        <div className="text-center">
          <p className="text-gray-400">Order Status</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
            #{order._id.slice(-6).toUpperCase()}
          </h2>
        </div>

        {/* Chronological Progress Bar */}
        <div className="flex items-start justify-between gap-2 mt-2">
          {statusSteps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx <= currentStep;
            return (
              <div
                key={step.key}
                className="flex flex-col items-center text-center flex-1 relative"
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? "bg-yellow-500 border-yellow-500 text-black shadow-lg shadow-yellow-500/20"
                      : "bg-gray-800 border-gray-700 text-gray-500"
                  }`}
                >
                  <Icon size={22} />
                </div>
                <span
                  className={`text-xs mt-3 font-semibold ${
                    isActive ? "text-yellow-400" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
                {/* Connector */}
                {idx > 0 && (
                  <div
                    className={`absolute top-6 left-[-50%] w-full h-1 ${
                      isActive ? "bg-yellow-500" : "bg-gray-700"
                    }`}
                    style={{ zIndex: -1 }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Ordered Items */}
        <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700">
          <h3 className="font-semibold text-white mb-3 text-lg">Your Items</h3>
          <ul className="divide-y divide-gray-700">
            {order.items.map((item) => (
              <li
                key={item._id}
                className="flex justify-between items-center py-3 text-sm sm:text-base"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-200">
                    {item.name}
                  </span>
                  <span className="text-gray-400 text-xs">
                    Qty: {item.quantity}
                  </span>
                </div>
                <span className="font-semibold text-gray-200">
                  ₹
                  {((item.priceAtOrder || item.price || 0) * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate(`/t/${rid}/menu`)}
            className="mt-5 w-full bg-gray-700/70 hover:bg-gray-700 text-yellow-400 font-semibold py-3 px-4 rounded-xl border-2 border-gray-600 hover:border-gray-500 transition-all"
          >
            + Add More Items
          </button>
        </div>

        {/* Price Breakdown */}
        <div className="bg-gray-800/50 rounded-2xl p-5 space-y-2 text-sm sm:text-base border border-gray-700">
          <div className="flex justify-between text-gray-300">
            <span>Subtotal</span>
            <span>₹{order.subtotal?.toFixed(2)}</span>
          </div>
          {discountPercent > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Discount ({discountPercent}%)</span>
              <span>-₹{order.discountAmount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-400">
            <span>GST ({taxPercent}%)</span>
            <span>+ ₹{order.taxAmount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Service Charge ({servicePercent}%)</span>
            <span>+ ₹{order.serviceChargeAmount?.toFixed(2)}</span>
          </div>
          <div className="!mt-4 border-t border-dashed border-gray-600"></div>
          <div className="flex justify-between items-center pt-3 font-semibold text-yellow-400 text-lg sm:text-xl">
            <span>Total Payable</span>
            <span>₹{order.totalAmount?.toFixed(2)}</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-gray-800/50 rounded-2xl p-5 text-sm border border-gray-700">
          <h3 className="font-semibold text-white mb-3 text-lg">
            Customer Details
          </h3>
          <div className="space-y-1 text-gray-300">
            <p>
              <strong>Name:</strong> {order.customerName}
            </p>
            <p>
              <strong>Email:</strong> {order.customerEmail}
            </p>
            {order.customerContact && (
              <p>
                <strong>Contact:</strong> {order.customerContact}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* <FooterNav activeTab="orders" /> */}
    </div>
  );
}
