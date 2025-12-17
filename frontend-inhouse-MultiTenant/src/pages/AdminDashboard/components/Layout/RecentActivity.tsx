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
  const { rid } = useContext(TenantContext);

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
            new Date(b.createdAt?.$date || b.createdAt).getTime() -
            new Date(a.createdAt?.$date || a.createdAt).getTime()
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
      case "placed": return "bg-blue-500/10 text-blue-400";
      case "preparing": return "bg-yellow-500/10 text-yellow-400";
      case "ready": return "bg-green-500/10 text-green-400";
      case "completed": return "bg-emerald-500/10 text-emerald-400";
      case "cancelled": return "bg-red-500/10 text-red-400";
      default: return "bg-zinc-700 text-zinc-300";
    }
  };

  const getStatusIcon = (status: string) => { /* ... unchanged ... */ };
  const getStatusText = (status: string) => { /* ... unchanged ... */ };

  return (
    <div className="mt-8 w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white tracking-tight">Recent Activity</h2>
        <span className="text-xs text-zinc-500">Live order updates</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-sm text-zinc-400">Loading recent orders…</div>
      ) : error ? (
        <div className="flex items-center justify-center py-10 text-sm text-red-500">{error}</div>
      ) : orders.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-sm text-zinc-500 bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl">
          No recent activity yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {orders.map((order) => (
            <motion.div
              key={order._id?.$oid ?? `${order.sessionId}-${order.createdAt?.$date}`}
              whileHover={{ y: -3, borderColor: '#a1a1aa' }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative bg-zinc-950 border border-zinc-800 rounded-2xl transition overflow-hidden shadow-lg shadow-black/20"
            >
              <div className={`absolute inset-x-0 top-0 h-[3px] opacity-80 ${
                  order.status === "completed" ? "bg-emerald-500"
                    : order.status === "ready" ? "bg-green-500"
                    : order.status === "preparing" ? "bg-yellow-500"
                    : order.status === "cancelled" ? "bg-red-500"
                    : "bg-blue-500"
                }`}
              />

              <div className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full text-lg ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{getStatusText(order.status)}</p>
                      <p className="text-xs text-zinc-500 font-mono">#{(order._id?.$oid || "").slice(-6)}</p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 whitespace-nowrap">
                    {new Date(order.createdAt?.$date || order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-zinc-400 my-4">
                  <div className="flex items-center gap-2">
                    <MdTableRestaurant className="text-zinc-500" />
                    <span>Table <strong className="font-bold text-yellow-300">{tables.get(order.tableId) || order.tableId}</strong></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><FaBox className="text-zinc-500" /><span>{order.items.length} {order.items.length > 1 ? "items" : "item"}</span></div>
                    <div className="flex items-center gap-1 font-bold text-yellow-300"><FaRupeeSign size={12} /><span>{order.totalAmount.toFixed(2)}</span></div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
                  <FaUser className="text-zinc-500" />
                  <span>
                    {order.staffAlias && <>By: <strong className="text-zinc-400">{order.staffAlias}</strong>{order.customerName && ", "}</>}
                    {order.customerName && <>To: <strong className="text-zinc-400">{order.customerName}</strong></>}
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