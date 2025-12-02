import { motion } from "framer-motion";
import React, { useContext, useEffect, useState } from "react";
import { getOrder, type Order } from "../../../../api/admin/order.api";
import { getTables, type ApiTable } from "../../../../api/admin/table.api";
import { TenantContext } from "../../../../context/TenantContext";
import { FaBox, FaRupeeSign, FaUser } from "react-icons/fa";
import { MdTableRestaurant } from "react-icons/md";

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
        setOrders(sortedOrders.slice(0, 6));

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
          {orders.map((order) => (
            <motion.div
              key={order._id?.$oid}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="bg-white border border-gray-200 shadow-sm hover:shadow-lg rounded-xl p-4 flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between w-full mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-xl ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {getStatusText(order.status)}
                    </p>
                    <p className="text-xs text-gray-500">
                      #{`${(order._id?.$oid || "").slice(-6)}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap pt-1">
                  {new Date(order.createdAt?.$date || "").toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              </div>

              {/* Card Body with Details */}
              <div className="w-full space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MdTableRestaurant className="text-gray-400" />
                  <span>
                    For Table{" "}
                    <strong>{tables.get(order.tableId) || order.tableId}</strong>
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
                  <div className="flex items-center gap-1 font-semibold text-gray-700">
                    <FaRupeeSign size={12} />
                    <span>{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="border-t border-gray-100 mt-3 pt-2 text-xs text-gray-500 flex items-center gap-2">
                <FaUser className="text-gray-400" />
                <span>
                  By:{" "}
                  <strong>
                    {order.staffAlias || order.customerName || "Guest"}
                  </strong>
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}