import { Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder, getOrder } from "../../api/order.api";
import { useTable } from "../../context/TableContext";
import { useTenant } from "../../context/TenantContext";
import { useCart } from "../../stores/cart.store";
import TablePickerModal from "../TableSelect/TablePickerModal";

type ApiOrder =
  | {
      order?: {
        _id?: string;
        sessionId?: string;
      };
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

  const sessionId =
    sessionStorage.getItem("resto_session_id") ||
    `sess_${Math.random().toString(36).substring(2, 12)}`;

  useEffect(() => {
    sessionStorage.setItem("resto_session_id", sessionId);
  }, [sessionId]);

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
    if (items.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    if (!tableId) {
      setShowTablePicker(true);
      return;
    }

    // Check for existing active order
    try {
      setLoading(true);
      const ordersResponse = await getOrder(rid, sessionId);
      const existingOrders = Array.isArray(ordersResponse)
        ? ordersResponse
        : ordersResponse
          ? [ordersResponse]
          : [];

      const activeOrder = existingOrders.find(
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
        return;
      }
    } catch (error) {
      console.warn(
        "No existing order found or failed to fetch, proceeding to new order flow:",
        error
      );
    } finally {
      setLoading(false);
    }

    const savedInfo = sessionStorage.getItem(`customerInfo_${tableId}`);
    if (savedInfo) {
      const { name, contact, email } = safeParse<{
        name: string;
        contact: string;
        email: string;
      }>(savedInfo, { name: "", contact: "", email: "" });
      if (name && contact && email) {
        handleConfirmOrderWithSavedInfo(name, contact, email);
        return;
      }
    }
    setShowCustomerModal(true);
  };

  const handleConfirmOrder = async () => {
    const cleanedContact = customerContact.replace(/\s+/g, "").trim();
    if (
      !customerName.trim() ||
      !customerEmail.trim() ||
      !cleanedContact.trim()
    ) {
      alert("Please fill in all details (name, contact, email).");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanedContact)) {
      alert("Please enter a valid 10-digit contact number.");
      return;
    }

    setShowCustomerModal(false);
    await placeOrderWithDetails(
      customerName,
      cleanedContact,
      customerEmail,
      true
    );
  };

  const handleConfirmOrderWithSavedInfo = async (
    name: string,
    contact: string,
    email: string
  ) => {
    await placeOrderWithDetails(name, contact, email, false);
  };

  const placeOrderWithDetails = async (
    name: string,
    contact: string,
    email: string,
    isNewCustomer: boolean,
    activeOrder: ApiOrder | null = null
  ) => {
    const payload = {
      sessionId,
      customerName: name,
      customerContact: contact,
      customerEmail: email,
      isCustomerOrder: true,
      ...(activeOrder?.order?._id && { orderId: activeOrder.order._id }), // Conditionally add orderId
      items: items.map((i) => ({
        menuItemId: i.itemId,
        name: i.name,
        quantity: i.quantity,
        notes: i.notes || "",
      })),
    };

    try {
      setLoading(true);
      const res = await createOrder(rid, tableId!, payload);

      if (isNewCustomer) {
        sessionStorage.setItem(
          `customerInfo_${tableId}`,
          JSON.stringify({
            name,
            contact,
            email,
          })
        );
      }

      const orderId = getOrderId(res);

      if (orderId) {
        sessionStorage.setItem("active_order_id", orderId);
        console.log("Active order ID set in CartDrawer:", orderId);
        clear();
        navigate(`/t/${rid}/order/${orderId}`);
      } else {
        alert(
          `Order placed but no order ID returned. Please check your orders. Response: ${JSON.stringify(
            res
          )}`
        );
      }
    } catch (err: any) {
      console.error("Failed to place order:", err);
      alert("Failed to place order: " + (err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClearCustomerInfo = () => {
      if (tableId) {
        sessionStorage.removeItem(`customerInfo_${tableId}`);
      }
      sessionStorage.removeItem("ongoingOrders");
    };
    window.addEventListener("clearTableSession", handleClearCustomerInfo);
    return () =>
      window.removeEventListener("clearTableSession", handleClearCustomerInfo);
  }, [tableId]);

  return (
    <>
      {showTablePicker && (
        <TablePickerModal onClose={() => setShowTablePicker(false)} />
      )}
      {showCustomerModal && (
        <div className="fixed inset-0 text-black bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full space-y-5 shadow-lg animate-in fade-in">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Enter your details
            </h2>

            <input
              type="text"
              placeholder="Your Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              autoFocus
            />

            <div className="relative">
              <input
                type="tel"
                placeholder="Your Contact Number"
                value={customerContact}
                onChange={(e) =>
                  setCustomerContact(e.target.value.replace(/[^0-9]/g, ""))
                }
                className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <Phone
                className="absolute right-3 top-3 text-gray-400"
                size={18}
              />
            </div>

            <input
              type="email"
              placeholder="Your Email for billing"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
            />

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 py-2 rounded-md border text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={loading}
                className={`flex-1 py-2 rounded-md text-white ${
                  loading
                    ? "bg-yellow-400 cursor-not-allowed"
                    : "bg-yellow-600 hover:bg-yellow-700"
                } transition`}
              >
                {loading ? "Placing..." : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}
      <aside className="fixed right-4 bottom-4 w-80 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
        <h4 className="font-semibold mb-2">Your Cart</h4>

        {/* Items */}
        <div className="divide-y divide-gray-100 max-h-56 overflow-auto mb-3">
          {items.length === 0 && (
            <div className="text-sm text-gray-500 py-4 text-center">
              Cart is empty
            </div>
          )}
          {items.map((it) => (
            <div
              key={it.itemId}
              className="py-2 flex items-center justify-between gap-2"
            >
              <div>
                <div className="font-medium text-sm">{it.name}</div>
                <div className="text-xs text-gray-500">
                  ₹{it.price} × {it.quantity}
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() =>
                      updateQty(it.itemId, Math.max(1, it.quantity - 1))
                    }
                    className="px-2 text-sm border rounded"
                  >
                    -
                  </button>
                  <button
                    onClick={() => updateQty(it.itemId, it.quantity + 1)}
                    className="px-2 text-sm border rounded"
                  >
                    +
                  </button>
                  <button
                    onClick={() => remove(it.itemId)}
                    className="text-xs text-red-500 ml-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-sm font-medium">
                ₹{(it.price * it.quantity).toFixed(0)}
              </div>
            </div>
          ))}
        </div>

        {/* Summary + Actions */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-gray-500">Subtotal</div>
            <div className="font-semibold">₹{subtotal.toFixed(0)}</div>
          </div>
          <button
            onClick={initiatePlaceOrder}
            disabled={loading || items.length === 0}
            className={`px-3 py-2 rounded text-white font-medium ${
              loading
                ? "bg-gray-400 cursor-wait"
                : "bg-green-600 hover:bg-green-500"
            } disabled:opacity-50`}
          >
            {loading ? "Placing..." : "Place Order"}
          </button>
        </div>

        <div className="text-xs text-gray-400">
          Table: {tableId || "Not selected"}
        </div>
      </aside>
    </>
  );
}
