import { Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder, getOrdersByTable } from "../../api/order.api";
import { useTable } from "../../context/TableContext";
import { useTenant } from "../../context/TenantContext";
import { useCart } from "../../stores/cart.store";
import TablePickerModal from "../TableSelect/TablePickerModal";

type ApiOrder =
  | {
      order?: { _id?: string; sessionId?: string };
      data?: { _id?: string; order?: { _id?: string; sessionId?: string } };
      _id?: string;
    }
  | any;

const safeParse = <T,>(json: string | null, fallback: T): T => {
  try {
    return json ? (JSON.parse(json) as T) : fallback;
  } catch {
    return fallback;
  }
};

const getOrderId = (res: ApiOrder): string | null =>
  res?.order?._id ||
  res?.data?.order?._id ||
  res?._id ||
  res?.data?._id ||
  null;

export default function CartDrawer() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal)();
  const remove = useCart((s) => s.remove);
  const updateQty = useCart((s) => s.updateQty);
  const clear = useCart((s) => s.clear);

  const { tableId } = useTable();
  const { rid } = useTenant();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [hasActiveOrder, setHasActiveOrder] = useState(false);

  const sessionId =
    sessionStorage.getItem("resto_session_id") ||
    `sess_${Math.random().toString(36).substring(2, 12)}`;

  useEffect(() => {
    sessionStorage.setItem("resto_session_id", sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (tableId && rid) {
      getOrdersByTable(rid, tableId).then((ordersForTable) => {
        const activeOrder = ordersForTable.find(
          (o) => o.status !== "completed" && o.status !== "cancelled"
        );
        setHasActiveOrder(!!activeOrder);
      });
    } else {
      setHasActiveOrder(false);
    }
  }, [rid, tableId]);

  useEffect(() => {
    if (tableId) {
      const savedInfo = sessionStorage.getItem(`customerInfo_${tableId}`);
      if (savedInfo) {
        const { name, contact, email } = safeParse<{
          name: string;
          contact: string;
          email: string;
        }>(savedInfo, { name: "", contact: "", email: "" });
        if (name) setCustomerName(name);
        if (contact) setCustomerContact(contact);
        if (email) setCustomerEmail(email);
      }
    }
  }, [tableId]);

  const initiatePlaceOrder = async () => {
    if (items.length === 0) return alert("Your cart is empty.");
    if (!tableId) return setShowTablePicker(true);

    setLoading(true);
    try {
      const ordersForTable = await getOrdersByTable(rid, tableId);
      const activeOrder = ordersForTable.find(
        (o) => o.status !== "completed" && o.status !== "cancelled"
      );

      if (activeOrder) {
        await placeOrderWithDetails(
          activeOrder.customerName,
          activeOrder.customerContact || "",
          activeOrder.customerEmail,
          false,
          activeOrder
        );
      } else {
        const savedInfo = sessionStorage.getItem(`customerInfo_${tableId}`);
        if (savedInfo) {
          const { name, contact, email } = safeParse<any>(savedInfo, {});
          if (name && contact) {
            await placeOrderWithDetails(name, contact, email || "", false);
          } else {
            setShowCustomerModal(true);
          }
        } else {
          setShowCustomerModal(true);
        }
      }
    } catch (err) {
      console.error("Failed to initiate order placement:", err);
      alert("Could not place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const placeOrderWithDetails = async (
    name: string,
    contact: string,
    email: string | null,
    isNewCustomer: boolean,
    activeOrder: ApiOrder | null = null
  ) => {
    const payload = {
      sessionId,
      customerName: name,
      customerContact: contact,
      customerEmail: email,
      isCustomerOrder: true,
      ...(activeOrder?._id && { orderId: activeOrder._id }),
      items: items.map((i) => ({
        menuItemId: i.itemId,
        name: i.name,
        quantity: i.quantity,
        notes: i.notes || "",
      })),
    };

    try {
      const res = await createOrder(rid, tableId!, payload);

      if (isNewCustomer) {
        sessionStorage.setItem(
          `customerInfo_${tableId}`,
          JSON.stringify({ name, contact, email })
        );
      }

      const orderId = getOrderId(res);
      if (orderId) {
        sessionStorage.setItem("active_order_id", orderId);
        clear();
        navigate(`/t/${rid}/order/${orderId}`);
      } else {
        throw new Error("Order placed but no order ID returned.");
      }
    } catch (err: any) {
      console.error("Order placement failed:", err);
      alert(`Failed to place order: ${err.message}`);
    }
  };

  /* ================= DARK UI ================= */

  return (
    <>
      {showTablePicker && (
        <TablePickerModal onClose={() => setShowTablePicker(false)} />
      )}

      {/* ================= CUSTOMER MODAL ================= */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 text-white p-6 rounded-2xl max-w-md w-full space-y-5 shadow-2xl border border-white/10">
            <h2 className="text-2xl font-bold text-yellow-400 text-center">
              Enter your details
            </h2>

            <input
              type="text"
              placeholder="Your Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 px-4 py-2 rounded-xl focus:outline-none"
            />

            <div className="relative">
              <input
                type="tel"
                placeholder="Your Contact Number"
                value={customerContact}
                onChange={(e) =>
                  setCustomerContact(e.target.value.replace(/[^0-9]/g, ""))
                }
                className="w-full bg-gray-800 border border-white/10 px-4 py-2 rounded-xl focus:outline-none"
                maxLength={10}
              />
              <Phone
                className="absolute right-3 top-3 text-gray-500"
                size={18}
              />
            </div>

            <input
              type="email"
              placeholder="Your Email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 px-4 py-2 rounded-xl focus:outline-none"
            />

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  placeOrderWithDetails(
                    customerName,
                    customerContact,
                    customerEmail,
                    true
                  )
                }
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-yellow-500 text-black font-bold"
              >
                {loading ? "Placing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FLOATING DARK CART ================= */}
      <aside className="fixed right-4 bottom-4 w-80 bg-gray-950/95 border border-white/10 rounded-2xl shadow-2xl p-4 backdrop-blur-xl text-white">
        <h4 className="font-bold mb-3 text-yellow-400">Your Cart</h4>

        <div className="divide-y divide-white/10 max-h-56 overflow-auto mb-3">
          {items.length === 0 && (
            <div className="text-sm text-gray-500 py-4 text-center">
              Cart is empty
            </div>
          )}

          {items.map((it) => (
            <div key={it.itemId} className="py-2 flex justify-between gap-2">
              <div>
                <div className="font-medium text-sm">{it.name}</div>
                <div className="text-xs text-gray-400">
                  ₹{it.price} × {it.quantity}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() =>
                      updateQty(it.itemId, Math.max(1, it.quantity - 1))
                    }
                    className="px-2 text-sm border border-white/10 rounded"
                  >
                    −
                  </button>
                  <button
                    onClick={() => updateQty(it.itemId, it.quantity + 1)}
                    className="px-2 text-sm border border-white/10 rounded"
                  >
                    +
                  </button>
                  <button
                    onClick={() => remove(it.itemId)}
                    className="text-xs text-red-400 ml-2"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="text-sm font-semibold">
                ₹{(it.price * it.quantity).toFixed(0)}
              </div>
            </div>
          ))}
        </div>

        {/* SUMMARY */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-gray-400">Subtotal</div>
            <div className="font-bold text-lg text-yellow-400">
              ₹{subtotal.toFixed(0)}
            </div>
          </div>

          <button
            onClick={initiatePlaceOrder}
            disabled={loading || items.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 disabled:opacity-40"
          >
            {loading
              ? "Placing..."
              : hasActiveOrder
                ? "Add More Items"
                : "Place Order"}
          </button>
        </div>

        <div className="text-xs text-gray-500">
          Table: {tableId || "Not selected"}
        </div>
      </aside>
    </>
  );
}
