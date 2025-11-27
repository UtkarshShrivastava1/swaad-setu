import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPublicBill } from "../../api/order.api"; // ✅ new API function
import FooterNav from "../Layout/Footer";

import { useTenant } from "../../context/TenantContext";

export default function RunningBill() {
  const navigate = useNavigate();
  const { rid } = useTenant();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const tableNumber = sessionStorage.getItem("resto_table_number") || ""; 

  useEffect(() => {
    const storedOrdersString =
      sessionStorage.getItem("ongoingOrders") ||
      localStorage.getItem("ongoingOrders");

    if (storedOrdersString) {
      try {
        const parsedOrders = JSON.parse(storedOrdersString);
        if (Array.isArray(parsedOrders)) {
          setOrders([...parsedOrders].reverse());
        } else if (parsedOrders) {
          setOrders([parsedOrders]);
        }
      } catch (e) {
        console.error("Error parsing stored orders:", e);
        setOrders([]);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchBills() {
      if (!orders.length) return;

      setLoading(true);
      const sessionId = sessionStorage.getItem("session_id");
      if (!sessionId) {
        console.warn(
          "⚠️ No session_id found in sessionStorage — skipping bill fetch."
        );
        setLoading(false);
        return;
      }

      try {
        const updatedOrders = await Promise.all(
          orders.map(async (entry) => {
            const orderId = entry?.order?._id || entry?._id;
            if (!orderId) return entry;

            try {
              const billRes = await getPublicBill(rid, orderId, sessionId);
              const bill = billRes?.bill;

              if (bill) {
                return { ...entry, bill }; // merge new bill data
              }
            } catch (err) {
              console.error(`Failed to fetch bill for order ${orderId}:`, err);
            }

            return entry;
          })
        );

        setOrders(updatedOrders);
      } finally {
        setLoading(false);
      }
    }

    fetchBills();
  }, [orders.length, rid]);

  const handleCallWaiter = () => {
    alert("Waiter has been called! 🍽️");
  };

  if (!orders.length) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 pb-32 flex flex-col">
        <div className="inline-block bg-[#ffbe00] border-b border-[#051224]/20 shadow-lg sticky top-0 z-20">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="p-1.5 sm:p-2 rounded-full hover:bg-white/30 transition-colors">
                <span className="text-white">←</span>
              </button>
              <span className="text-white font-bold text-base sm:text-lg">Bill</span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No ongoing orders found.
        </div>
        <FooterNav activeTab="bill" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 pb-32 text-black">
      <div className="inline-block bg-[#ffbe00] border-b border-[#051224]/20 shadow-lg sticky top-0 z-20">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 sm:p-2 rounded-full hover:bg-white/30 transition-colors">
              <span className="text-white">←</span>
            </button>
            <span className="text-white font-bold text-base sm:text-lg">All Bills</span>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto p-4 space-y-7">
        {loading && (
          <div className="text-center text-gray-400 animate-pulse">
            Fetching updated bill details...
          </div>
        )}

        {orders.map((entry, idx) => {
          const { order = {}, preBill = {}, bill = {} } = entry;
          const display = bill.totalAmount ? bill : preBill || {};
          const {
            customerName = "N/A",
            customerEmail = "N/A",
            tableId = "N/A",
            items = order.items || [],
            subtotal,
            serviceChargeAmount,
            totalAmount,
            taxes = [],
            extras = [],
            _id,
          } = { ...order, ...display };

          return (
            <div
              key={_id || idx}
              className="bg-white rounded-xl shadow-md p-4 border mb-6 transition hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">
                  Order #{_id ? String(_id).slice(-6).toUpperCase() : idx + 1}
                </h2>
                <div className="text-xs text-gray-400">
                  Table:{" "}
                  <span className="font-semibold text-gray-600">{tableId}</span>
                </div>
              </div>

              <div className="mb-2 text-sm">
                <span className="block text-gray-700">
                  <strong>Name:</strong> {customerName}
                </span>
                <span className="block text-gray-700">
                  <strong>Email:</strong> {customerEmail}
                </span>
              </div>

              <h3 className="font-medium mt-2 mb-1">Order Items</h3>
              <ul className="divide-y divide-gray-200 mb-2">
                {items.map((item: any) => (
                  <li
                    key={item.menuItemId || item._id}
                    className="py-2 flex justify-between text-sm"
                  >
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>₹{(item.price ?? 0) * item.quantity}</span>
                  </li>
                ))}
              </ul>

              {extras.length > 0 && (
                <div className="mt-1 text-sm text-gray-700">
                  {extras.map((extra: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span>{extra.name}</span>
                      <span>₹{extra.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1 mt-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal ?? 0}</span>
                </div>

                {(taxes || []).map((tax: any, tidx: number) => (
                  <div
                    key={tidx}
                    className="flex justify-between text-sm text-gray-700"
                  >
                    <span>
                      {tax.name} ({tax.rate ?? tax.percent}%)
                    </span>
                    <span>₹{tax.amount}</span>
                  </div>
                ))}

                <div className="flex justify-between">
                  <span>Service Charge</span>
                  <span>₹{serviceChargeAmount ?? 0}</span>
                </div>

                <div className="flex justify-between font-bold text-lg border-t-2 border-gray-300 mt-2 pt-2">
                  <span>Total</span>
                  <span>₹{totalAmount ?? 0}</span>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      <FooterNav activeTab="bill" />
    </div>
  );
}
