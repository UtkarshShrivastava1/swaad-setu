import { useEffect, useState, useCallback } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { getOrder, type Order, type OrderItem } from "../../../../api/admin/order.api";
import { getTables, type ApiTable } from "../../../../api/admin/table.api";
import { useTenant } from "../../../../context/TenantContext";
import FooterNav from "./Footer";
import OrderHeroSection from "./OrderHero";

const STATUS_CLASSES: Record<string, string> = {
  placed: "bg-gray-50 text-black border border-gray-300",
  preparing: "bg-yellow-50 text-yellow-600 border border-yellow-200",
  ready: "bg-green-50 text-green-600 border border-green-200",
  delivered: "bg-green-50 text-green-600 border border-green-200",
};

const FILTERS = [
  { label: "All Orders", key: "all" },
  { label: "Placed", key: "placed" },
  { label: "Preparing", key: "preparing" },
  { label: "Ready", key: "ready" },
  { label: "Delivered", key: "delivered" },
];

export default function OrdersManagement() {
  const { rid } = useTenant();
  const [activeFilter, setActiveFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!rid) return;
    setLoading(true);
    try {
      const [orderResult, tableResult] = await Promise.all([
        getOrder(rid),
        getTables(rid),
      ]);
      setOrders(orderResult || []);
      const tableMap = new Map(
        tableResult.map((table: ApiTable) => [table._id, table.tableNumber])
      );
      setTables(tableMap);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [rid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredOrders =
    activeFilter === "all"
      ? orders
      : orders.filter((order) => order.status === activeFilter);

  function capitalize(word: string) {
    return word ? word.charAt(0).toUpperCase() + word.slice(1) : "";
  }

  const openCustomerPortal = () => {
    const PLACE_ORDER_LINK =
      import.meta.env.VITE_USER_LINK || "http://localhost:5173/";
    window.open(PLACE_ORDER_LINK, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full flex flex-col items-center py-8 min-h-screen bg-gray-50">
      <div className="w-full max-w-5xl">
        <OrderHeroSection />

        {/* ---------- Orders Container ---------- */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* ---------- Header Row ---------- */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-gray-100 gap-2 bg-gradient-to-r from-yellow-400 to-yellow-300">
            <div className="flex items-center gap-4">
              <h3 className="text-lg sm:text-xl font-semibold text-[#051224]">
                Live Orders
              </h3>
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2 rounded-full bg-[#051224] text-[#ffbe00] hover:bg-[#0a1a35] disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                aria-label="Refresh Orders"
              >
                <FiRefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <button
              onClick={openCustomerPortal}
              className="flex items-center gap-2 bg-[#051224] hover:bg-[#0a1a35] text-[#ffbe00] py-2 px-4 rounded-xl shadow font-semibold transition text-sm hover:scale-[1.03] active:scale-[0.97] focus:ring-2 focus:ring-yellow-400"
            >
              <span className="text-lg leading-none">＋</span>
              <span>New Order</span>
            </button>
          </div>

          {/* ---------- Filter Buttons ---------- */}
          <div className="p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {FILTERS.map((filt) => (
                <button
                  key={filt.key}
                  onClick={() => setActiveFilter(filt.key)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition ${
                    activeFilter === filt.key
                      ? "bg-[#051224] text-[#ffbe00] shadow-md"
                      : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {filt.label}
                </button>
              ))}
            </div>

            {/* ---------- Loading & Empty States ---------- */}
            {loading && (
              <div className="text-center py-10 text-gray-500 animate-pulse">
                Loading orders...
              </div>
            )}

            {!loading && filteredOrders.length === 0 && (
              <div className="text-center text-gray-500 py-12 italic">
                No orders found for "{activeFilter}".
              </div>
            )}

            {/* ---------- Orders List ---------- */}
            <div className="grid gap-7">
              {filteredOrders.map((order) => (
                <div
                  key={order._id.$oid}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-0 overflow-hidden"
                >
                  {/* BILL HEADER */}
                  <div className="bg-yellow-400 text-black px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-col gap-1 text-sm sm:text-base">
                      <div>Order ID: {order._id.$oid}</div>
                      <div>
                        Date:{" "}
                        {new Date(order.createdAt.$date).toLocaleString("en-IN", {
                          hour12: true,
                        })}
                      </div>
                      <div>Customer: <strong>{order.customerName || "—"}</strong></div>
                      {order.customerEmail && <div>Email: {order.customerEmail}</div>}
                      <div>Table No: {tables.get(order.tableId) ?? "—"}</div>
                    </div>

                    <div className="flex flex-row flex-wrap gap-2">
                      <span
                        className={`px-4 py-1 rounded-full font-semibold border text-sm ${
                          STATUS_CLASSES[order.status] ?? STATUS_CLASSES.placed
                        }`}
                      >
                        {capitalize(order.status)}
                      </span>
                      <span
                        className={`px-4 py-1 rounded-full font-semibold border text-sm ${
                          order.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </div>

                  {/* ITEMS TABLE */}
                  <div className="overflow-x-auto p-0">
                    <table className="min-w-full table-fixed text-[15px] border-t border-indigo-100">
                      <thead className="bg-indigo-100 text-gray-800">
                        <tr>
                          <th className="p-2 pl-4 text-left font-bold align-middle">
                            S.no
                          </th>
                          <th className="p-2 text-left font-bold align-middle">
                            Dish Name
                          </th>
                          <th className="p-2 text-center font-bold align-middle">
                            Qty
                          </th>
                          <th className="p-2 text-right font-bold align-middle">
                            MRP
                          </th>
                          <th className="p-2 text-right font-bold align-middle">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items?.map((item: OrderItem, idx: number) => (
                          <tr
                            key={idx}
                            className="border-b border-slate-100 hover:bg-gray-50 text-black"
                          >
                            <td className="p-2 pl-4 align-middle">{idx + 1}</td>
                            <td className="p-2 align-middle">{item.name}</td>
                            <td className="p-2 text-center align-middle">
                              {item.quantity}
                            </td>
                            <td className="p-2 text-right align-middle">
                              ₹{item.price}
                            </td>
                            <td className="p-2 text-right align-middle">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* BILL SUMMARY */}
                  <div className="p-5 border-t border-slate-300 bg-slate-50">
                    <div className="flex flex-col items-end gap-1 text-sm text-gray-700">
                      <div>Discount: ₹{order.discountAmount ?? 0}</div>
                      {order.appliedTaxes?.map((tax, idx) => (
                        <div key={tax._id || idx}>
                          {tax.name} ({tax.percent}%): ₹{tax.amount}
                        </div>
                      ))}
                      <div>
                        Service Charge: ₹{order.serviceChargeAmount ?? 0}
                      </div>
                      <div className="font-bold text-base mt-2 text-gray-900">
                        Total: ₹{order.totalAmount}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <FooterNav activeTab="orders" />
    </div>
  );
}