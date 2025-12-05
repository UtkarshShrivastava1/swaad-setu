import { motion } from "framer-motion";
import { useContext, useEffect, useState } from "react";
import { FaBox, FaRupeeSign, FaUser } from "react-icons/fa";
import { MdTableRestaurant } from "react-icons/md";
import { getOrder, type Order } from "../../../../api/admin/order.api";
import { getTables } from "../../../../api/admin/table.api";
import { TenantContext } from "../../../../context/TenantContext";

export default function RecentActivity() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tenantContext = useContext(TenantContext);
  const rid = tenantContext?.rid;

  useEffect(() => {
    async function fetchData() {
      if (!rid) return;
      try {
        setLoading(true);
        const [orderResult, tableResult] = await Promise.all([
          getOrder(rid),
          getTables(rid),
        ]);

        const sortedOrders = [...orderResult].sort(
          (a, b) =>
            new Date(b.createdAt?.$date || "").getTime() -
            new Date(a.createdAt?.$date || "").getTime()
        );
        setOrders(sortedOrders.slice(0, 3));

        const tableMap = new Map(
          tableResult.map((table) => [table._id, table.tableNumber])
        );
        setTables(tableMap);

        setError("");
      } catch (err: any) {
        console.error("❌ Failed to fetch recent data:", err);
        setError("Failed to load recent activity.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "placed":
        return "New Order Placed";
      case "preparing":
        return "Order is Being Prepared";
      case "ready":
        return "Order Ready to Serve";
      case "completed":
        return "Order Completed";
      case "cancelled":
        return "Order Cancelled";
      default:
        return "Order Updated";
    }
  };

  return (
    <div className="mt-8 w-full">
      {/* ===== Section Header ===== */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
          Recent Activity
        </h2>
        <span className="text-xs text-gray-400">Live order updates</span>
      </div>

      {/* ===== States ===== */}
      {loading ? (
        <div className="flex items-center justify-center py-10 text-sm text-gray-500">
          Loading recent orders…
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-10 text-sm text-red-500">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-sm text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
          No recent activity yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {orders.map((order) => (
            <motion.div
              key={
                order._id?.$oid ??
                `${order.sessionId}-${order.createdAt?.$date}`
              }
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden"
            >
              {/* Top Accent Line (status color) */}
              <div
                className={`absolute inset-x-0 top-0 h-[3px] ${
                  order.status === "completed"
                    ? "bg-emerald-400"
                    : order.status === "ready"
                    ? "bg-green-400"
                    : order.status === "preparing"
                    ? "bg-yellow-400"
                    : order.status === "cancelled"
                    ? "bg-red-400"
                    : "bg-blue-400"
                }`}
              />

              <div className="p-4 flex flex-col justify-between h-full">
                {/* ===== Header ===== */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 flex items-center justify-center rounded-full text-lg ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {getStatusText(order.status)}
                      </p>
                      <p className="text-xs text-gray-400">
                        #{(order._id?.$oid || "").slice(-6)}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    {new Date(order.createdAt?.$date || "").toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>

                {/* ===== Body ===== */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MdTableRestaurant className="text-gray-400" />
                    <span>
                      Table{" "}
                      <strong className="text-gray-800">
                        {tables.get(order.tableId) || order.tableId}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaBox className="text-gray-400" />
                      <span>
                        {order.items.length}{" "}
                        {order.items.length > 1 ? "items" : "item"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-semibold text-gray-800">
                      <FaRupeeSign size={12} />
                      <span>{order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* ===== Footer ===== */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                  <FaUser className="text-gray-400" />
                  <span>
                    {order.staffAlias && (
                      <>
                        By:{" "}
                        <strong className="text-gray-700">
                          {order.staffAlias}
                        </strong>
                        {order.customerName && ", "}
                      </>
                    )}
                    {order.customerName && (
                      <>
                        To:{" "}
                        <strong className="text-gray-700">
                          {order.customerName}
                        </strong>
                      </>
                    )}
                    {!order.staffAlias && !order.customerName && "Guest"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
