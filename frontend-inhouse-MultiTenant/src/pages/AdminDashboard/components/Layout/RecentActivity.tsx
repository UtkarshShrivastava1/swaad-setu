import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getOrder, type Order } from "../../../../api/admin/order.api";

export default function RecentActivity() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const rid = import.meta.env.VITE_RID || "restro10";

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const sessionId = sessionStorage.getItem("resto_session_id") || "";
        const result = await getOrder(rid, sessionId);
        // Sort orders by createdAt (most recent first)
        const sorted = [...result].sort(
          (a, b) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime()
        );
        setOrders(sorted.slice(0, 6)); // Show latest 6
        setError("");
      } catch (err: any) {
        console.error("❌ Failed to fetch recent orders:", err);
        setError("Failed to load recent activity.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
    // Auto-refresh every 30s for live updates
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [rid]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "placed":
        return "bg-blue-100 text-blue-600";
      case "preparing":
        return "bg-yellow-100 text-yellow-600";
      case "ready":
        return "bg-green-100 text-green-600";
      case "completed":
        return "bg-emerald-100 text-emerald-600";
      case "cancelled":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "placed":
        return "📝";
      case "preparing":
        return "👨‍🍳";
      case "ready":
        return "🍽️";
      case "completed":
        return "✅";
      case "cancelled":
        return "❌";
      default:
        return "📦";
    }
  };

  return (
    <div className="mt-6 w-full">
      <h2 className="px-2 sm:px-0 text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h2>

      {loading ? (
        <div className="text-gray-500 text-sm text-center py-6">
          Loading recent orders...
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm text-center py-6">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-gray-400 text-sm text-center py-6">
          No recent activity yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order, idx) => (
            <motion.div
              key={order._id}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-gray-100 shadow-sm hover:shadow-md rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {/* Icon Bubble */}
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusIcon(order.status)}
                </div>

                {/* Text Content */}
                <div>
                  <div className="text-sm font-semibold text-gray-800">
                    {order.status === "placed"
                      ? "New Order Placed"
                      : order.status === "preparing"
                      ? "Order is Being Prepared"
                      : order.status === "ready"
                      ? "Order Ready to Serve"
                      : order.status === "completed"
                      ? "Order Completed"
                      : order.status === "cancelled"
                      ? "Order Cancelled"
                      : "Order Updated"}
                  </div>
                  <div className="text-xs text-gray-500">
                    #{order._id.slice(-6).toUpperCase()} ·{" "}
                    {order.customerName || "Guest"}
                  </div>
                </div>
              </div>

              {/* Time */}
              <span className="text-[11px] text-gray-400 ml-3 whitespace-nowrap">
                {new Date(order.createdAt || "").toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
