import { useCallback, useEffect, useState } from "react";
import { FiInbox, FiRefreshCw } from "react-icons/fi";
import { isToday } from "date-fns";
import {
  getOrder,
  type Order,
  type OrderItem,
} from "../../../../api/admin/order.api";
import { getTables, type ApiTable } from "../../../../api/admin/table.api";
import { useTenant } from "../../../../context/TenantContext";
import FooterNav from "./Footer";
import OrderHeroSection from "./OrderHero";

const STATUS_CLASSES: Record<string, string> = {
  placed: "bg-slate-50 text-slate-800 border border-slate-200",
  preparing: "bg-amber-50 text-amber-700 border border-amber-200",
  ready: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  done: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

const FILTERS = [
  { label: "Current", key: "all" },
  { label: "Placed", key: "placed" },
  { label: "Preparing", key: "preparing" },
  { label: "Ready", key: "ready" },
  { label: "Paid", key: "done" },
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

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "all") {
      return true;
    }
    if (activeFilter === "done") {
      return (
        order.paymentStatus === "paid" &&
        isToday(new Date(order.createdAt.$date))
      );
    }
    return order.status === activeFilter;
  });

  function capitalize(word: string) {
    return word ? word.charAt(0).toUpperCase() + word.slice(1) : "";
  }

  const openCustomerPortal = () => {
    const PLACE_ORDER_LINK =
      import.meta.env.VITE_USER_LINK || "http://localhost:5173/";
    window.open(PLACE_ORDER_LINK, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-slate-100 via-amber-50/60 to-slate-100 py-8">
      <div className="w-full max-w-6xl px-4 lg:px-0 space-y-6">
        {/* Hero / Title */}
        <OrderHeroSection />

        {/* ---------- Orders Container ---------- */}
        <div className="rounded-3xl shadow-2xl border border-white/70 bg-white/90 backdrop-blur-xl overflow-hidden">
          {/* ---------- Header Row ---------- */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#051224] via-[#051224] to-[#051224] opacity-90" />
            <div className="relative px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                      Live Kitchen View
                    </span>
                  </div>
                  <h3 className="mt-1 text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    Orders Dashboard
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-100/90 mt-1">
                    Track, filter, and manage all running orders in real-time.
                  </p>
                </div>

                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="ml-1 p-2 rounded-full bg-white/10 text-amber-200 hover:bg-white/15 disabled:bg-slate-500/40 disabled:text-slate-200/70 disabled:cursor-not-allowed transition-all border border-white/20"
                  aria-label="Refresh Orders"
                >
                  <FiRefreshCw
                    className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                <div className="hidden sm:flex flex-col text-xs text-amber-100/80">
                  <span>New order opens customer portal</span>
                  <span className="opacity-80">
                    Use this at counter or for assisted ordering.
                  </span>
                </div>
                <button
                  onClick={openCustomerPortal}
                  className="flex items-center gap-2 bg-amber-300 text-[#051224] py-2.5 px-4 rounded-xl shadow-lg font-semibold text-sm hover:bg-amber-200 hover:shadow-xl active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-300 focus-visible:ring-offset-[#051224]"
                >
                  <span className="text-lg leading-none">＋</span>
                  <span>New Order</span>
                </button>
              </div>
            </div>
          </div>

          {/* ---------- Body ---------- */}
          <div className="p-6 space-y-5">
            {/* ---------- Filter Buttons ---------- */}
            <div className="flex flex-wrap gap-2 mb-2">
              {FILTERS.map((filt) => (
                <button
                  key={filt.key}
                  onClick={() => setActiveFilter(filt.key)}
                  className={`px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-semibold transition-all shadow-sm
                    ${
                      activeFilter === filt.key
                        ? "bg-[#051224] text-amber-300 border-[#051224] shadow-[0_10px_25px_rgba(5,18,36,0.4)] scale-[1.02]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                >
                  {filt.label}
                </button>
              ))}
            </div>

            {/* ---------- Loading & Empty States ---------- */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <div className="h-10 w-10 rounded-full border-2 border-dashed border-slate-300 animate-spin mb-3" />
                <p className="text-sm font-medium">
                  Fetching latest orders from the kitchen...
                </p>
              </div>
            )}

            {!loading && filteredOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 text-slate-500">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 shadow-inner">
                  <FiInbox className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-semibold mb-1">
                  No orders in{" "}
                  {activeFilter === "all"
                    ? "the system"
                    : `"${capitalize(activeFilter)}"`}
                  .
                </p>
                <p className="text-xs text-slate-500">
                  Once customers start ordering, you&apos;ll see them appear
                  here in real-time.
                </p>
              </div>
            )}

            {/* ---------- Orders List ---------- */}
            {!loading && filteredOrders.length > 0 && (
              <div className="grid gap-6">
                {filteredOrders.map((order) => (
                  <div
                    key={order._id.$oid}
                    className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all overflow-hidden"
                  >
                    {/* BILL HEADER */}
                    <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-white px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-100">
                      <div className="flex flex-col gap-1 text-xs sm:text-sm text-slate-800">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500 font-semibold">
                            Order
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 text-[11px] font-mono">
                            #{order._id?.$oid?.slice(-6) || "Missing ID"}
                          </span>
                        </div>
                        <div className="text-[13px] sm:text-sm text-slate-700">
                          Placed at{" "}
                          <span className="font-semibold">
                            {new Date(order.createdAt.$date).toLocaleString(
                              "en-IN",
                              {
                                hour12: true,
                              }
                            )}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] sm:text-sm">
                          <span>
                            Customer:{" "}
                            <span className="font-semibold">
                              {order.customerName || "Walk-in"}
                            </span>
                          </span>
                          {order.customerEmail && (
                            <span className="hidden sm:inline-block">
                              Email: {order.customerEmail}
                            </span>
                          )}
                          <span>
                            Table:{" "}
                            <span className="font-semibold">
                              {tables.get(order.tableId) ?? "—"}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                        <span
                          className={`px-3.5 py-1 rounded-full font-semibold border text-xs sm:text-sm flex items-center gap-1.5 ${
                            STATUS_CLASSES[order.status] ??
                            STATUS_CLASSES.placed
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                          {capitalize(order.status)}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full font-semibold text-xs sm:text-sm border flex items-center gap-1.5 ${
                            order.paymentStatus === "paid"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                          {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                    </div>

                    {/* ITEMS TABLE */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-[13px] sm:text-[14px] border-t border-slate-100">
                        <thead className="bg-slate-50/90 text-slate-700">
                          <tr>
                            <th className="p-2 pl-4 text-left font-semibold align-middle w-16">
                              #
                            </th>
                            <th className="p-2 text-left font-semibold align-middle">
                              Dish
                            </th>
                            <th className="p-2 text-center font-semibold align-middle w-16">
                              Qty
                            </th>
                            <th className="p-2 text-right font-semibold align-middle w-24">
                              MRP
                            </th>
                            <th className="p-2 pr-4 text-right font-semibold align-middle w-28">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items?.map((item: OrderItem, idx: number) => (
                            <tr
                              key={idx}
                              className="border-t border-slate-100 hover:bg-slate-50/80 text-slate-900"
                            >
                              <td className="p-2 pl-4 align-middle text-xs sm:text-sm text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="p-2 align-middle text-xs sm:text-sm">
                                {item.name}
                              </td>
                              <td className="p-2 text-center align-middle text-xs sm:text-sm">
                                {item.quantity}
                              </td>
                              <td className="p-2 text-right align-middle text-xs sm:text-sm">
                                ₹{item.priceAtOrder || item.price}
                              </td>
                              <td className="p-2 pr-4 text-right align-middle text-xs sm:text-sm font-medium">
                                ₹
                                {(
                                  (item.priceAtOrder || item.price) *
                                  item.quantity
                                ).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* BILL SUMMARY */}
                    <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/90">
                      <div className="flex flex-col items-end gap-0.5 text-xs sm:text-sm text-slate-700">
                        <div className="flex justify-between gap-6 w-full max-w-xs">
                          <span>Discount</span>
                          <span className="font-medium">
                            ₹{order.discountAmount ?? 0}
                          </span>
                        </div>

                        {order.appliedTaxes?.map((tax, idx) => (
                          <div
                            key={tax._id || idx}
                            className="flex justify-between gap-6 w-full max-w-xs"
                          >
                            <span>
                              {tax.name} ({tax.percent}
                              %)
                            </span>
                            <span className="font-medium">₹{tax.amount}</span>
                          </div>
                        ))}

                        <div className="flex justify-between gap-6 w-full max-w-xs">
                          <span>Service Charge</span>
                          <span className="font-medium">
                            ₹{order.serviceChargeAmount ?? 0}
                          </span>
                        </div>

                        <div className="flex justify-between gap-6 w-full max-w-xs mt-2 pt-2 border-t border-slate-300">
                          <span className="font-semibold text-slate-900">
                            Total
                          </span>
                          <span className="font-extrabold text-base text-slate-900">
                            ₹{order.totalAmount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <FooterNav activeTab="orders" />
    </div>
  );
}
