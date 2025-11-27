import {
  CheckCircle2,
  ChefHat,
  Clock,
  HandPlatter,
  RefreshCw,
  ThumbsUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Order } from "../../api/order.api";
import { getOrderById } from "../../api/order.api";
import { useTenant } from "../../context/TenantContext";
import { useTable } from "../../context/TableContext";

export default function OrderView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { rid } = useTenant();
  const { tableId } = useTable(); // Access tableId from useTable
  const sessionId = sessionStorage.getItem("resto_session_id");

  // Effect to handle order status completion
  useEffect(() => {
    if (order?.status === "served") { // Assuming "served" means done for customer side
      // Clear session storage relevant to the order and table
      sessionStorage.removeItem("resto_session_id");
      if (order.tableId) { // Use order.tableId for specific order context
        sessionStorage.removeItem(`customerInfo_${order.tableId}`);
      }
      // Remove this order from ongoing orders
      const storedOngoingOrders = JSON.parse(sessionStorage.getItem("ongoingOrders") || "[]");
      const updatedOngoingOrders = storedOngoingOrders.filter((o: any) => o._id !== orderId);
      sessionStorage.setItem("ongoingOrders", JSON.stringify(updatedOngoingOrders));

      // Navigate back to the landing page/homepage
      navigate(`/t/${rid}`);
    }
  }, [order, navigate, rid, orderId]);

  // --------------------- Fetch ---------------------
  const fetchOrder = async () => {
    if (!orderId || !rid) return;
    try {
      setLoading(true);
      const res = await getOrderById(rid, orderId, sessionId!);
      console.log(res)
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
      <div className="flex flex-col h-screen justify-center items-center text-gray-600">
        <div className="animate-spin mb-2">
          <RefreshCw size={28} />
        </div>
        Loading your order...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col h-screen justify-center items-center text-gray-600">
        <h2 className="font-bold text-lg mb-2">Order not found</h2>
        <p className="text-gray-500 mb-4">
          {error || "Please try again later."}
        </p>
        <button
          onClick={() => navigate(`/t/${rid}/menu`)}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-5 py-2 font-semibold"
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
    <div className="bg-white min-h-screen flex flex-col pb-28">
      <div className="inline-block bg-[#ffbe00] border-b border-[#051224]/20 shadow-lg sticky top-0 z-20">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/t/${rid}/menu`)} className="p-1.5 sm:p-2 rounded-full hover:bg-white/30 transition-colors">
              <span className="text-white">←</span>
            </button>
            <span className="text-white font-bold text-base sm:text-lg">Your Order</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto p-4 space-y-5">
        {/* Order Info */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Order #{order._id.slice(-6).toUpperCase()}
          </h2>
          <button
            onClick={fetchOrder}
            className="text-orange-600 hover:text-orange-700 flex items-center gap-1 text-sm font-medium"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Chronological Progress Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-2">
          {statusSteps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx <= currentStep;
            const isCompleted = idx < currentStep;
            return (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? "bg-orange-500 border-orange-500 text-white shadow-md"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <span
                  className={`text-xs mt-1 ${
                    isActive ? "text-orange-600 font-semibold" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
                {idx < statusSteps.length - 1 && (
                  <div
                    className={`hidden sm:block h-1 w-full mt-[-20px] ${
                      isCompleted ? "bg-orange-400" : "bg-gray-200"
                    }`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Ordered Items */}
        <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-2">Ordered Items</h3>
          <ul className="divide-y divide-gray-200">
            {order.items.map((item) => (
              <li
                key={item._id}
                className="flex justify-between py-2 text-sm sm:text-base"
              >
                <span className="text-gray-800">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium text-gray-900">
                  ₹{(item.priceAtOrder || item.price || 0) * item.quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Price Breakdown */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-gray-700 space-y-1 text-sm sm:text-base">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{order.subtotal?.toFixed(2)}</span>
          </div>
          {discountPercent > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({discountPercent}%)</span>
              <span>-₹{order.discountAmount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>GST ({taxPercent}%)</span>
            <span>₹{order.taxAmount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Service Charge ({servicePercent}%)</span>
            <span>₹{order.serviceChargeAmount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-orange-200 pt-2 mt-2 font-semibold text-orange-700 text-lg">
            <span>Total</span>
            <span>₹{order.totalAmount?.toFixed(2)}</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mt-6 text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Customer Details</h3>
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

      {/* <FooterNav activeTab="orders" /> */}
    </div>
  );
}