import { Minus, Phone, Plus, Trash } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder, getOrder } from "../../api/order.api";
import { useTable } from "../../context/TableContext";
import { useTenant } from "../../context/TenantContext";
import TablePickerModal from "../TableSelect/TablePickerModal";

/** ---------- Types ---------- */
type CartItemType = {
  _id: string;
  itemId?: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  notes?: string;
};

type ApiOrder =
  | {
      order?: {
        _id?: string;
        sessionId?: string;
      };
      data?: { order?: { _id?: string; sessionId?: string } };
      _id?: string;
    }
  | any;

/** ---------- Utils ---------- */
const safeParse = <T,>(json: string | null, fallback: T): T => {
  try {
    return json ? (JSON.parse(json) as T) : fallback;
  } catch {
    return fallback;
  }
};

const getOrderId = (res: ApiOrder): string | null =>
  res?.order?._id || res?.data?.order?._id || res?._id || null;

/** ---------- Component ---------- */
export default function CartItem() {
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [showSuccessPop, setShowSuccessPop] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const navigate = useNavigate();
  const { rid } = useTenant();
  const { tableId } = useTable();

  const sessionId =
    sessionStorage.getItem("resto_session_id") ||
    `sess_${Math.random().toString(36).substring(2, 12)}`;

  /** ---------- Session bootstrap ---------- */
  useEffect(() => {
    sessionStorage.setItem("resto_session_id", sessionId);
  }, [sessionId]);

  /** ---------- Load cart ---------- */
  useEffect(() => {
    const storedCartObj = safeParse<Record<string, CartItemType>>(
      localStorage.getItem("cart"),
      {}
    );
    const items = Object.values(storedCartObj);
    setCartItems(items);
    setCartCount(items.reduce((sum, item) => sum + (item.quantity || 0), 0));
  }, []);

  /** ---------- Pre-fill customer info if saved for table ---------- */
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

  /** ---------- Derived totals ---------- */
  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  /** ---------- Cart operations ---------- */
  const persistCart = (items: CartItemType[]) => {
    const obj = Object.fromEntries(items.map((i) => [i._id, i]));
    localStorage.setItem("cart", JSON.stringify(obj));
  };

  const updateQuantity = (id: string, delta: number) => {
    const updatedItems = cartItems.map((item) =>
      item._id === id
        ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) }
        : item
    );
    setCartItems(updatedItems);
    setCartCount(updatedItems.reduce((sum, item) => sum + item.quantity, 0));
    persistCart(updatedItems);
  };

  const removeItem = (id: string) => {
    const updatedItems = cartItems.filter((item) => item._id !== id);
    setCartItems(updatedItems);
    setCartCount(updatedItems.reduce((sum, item) => sum + item.quantity, 0));
    persistCart(updatedItems);
  };

  const clearCart = () => {
    setCartItems([]);
    setCartCount(0);
    localStorage.removeItem("cart");
  };

  /** ---------- Misc ---------- */

  /** ---------- Place Order trigger ---------- */
  const initiatePlaceOrder = async () => {
    if (!cartItems.length) {
      alert("Your cart is empty!");
      return;
    }
    if (!tableId) {
      setShowTablePicker(true);
      return;
    }

    // Check for existing active order
    try {
      setIsPlacingOrder(true);
      const existingOrders = await getOrder(rid, sessionId);
      const activeOrder = existingOrders.find(
        (o) => o.status !== "completed" && o.status !== "cancelled"
      );

      if (activeOrder) {
        await handleConfirmOrderWithSavedInfo(
          activeOrder.customerName,
          activeOrder.customerContact || "",
          activeOrder.customerEmail
        );
        return;
      }
    } catch (error) {
      console.warn(
        "No existing order found or failed to fetch, proceeding to new order flow:",
        error
      );
    } finally {
      setIsPlacingOrder(false);
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

  /** ---------- First Order (asks details) ---------- */
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
    setIsPlacingOrder(true);

    const payload = {
      sessionId,
      customerName,
      customerContact: cleanedContact,
      customerEmail,
      isCustomerOrder: true,
      items: cartItems.map((item) => ({
        menuItemId: item.itemId || item._id,
        name: item.name,
        quantity: item.quantity,
        notes: item.notes || "",
      })),
    };

    try {
      const res: ApiOrder = await createOrder(rid, tableId!, payload);
      console.log("✅ Order created:", res);

      clearCart();
      setShowSuccessPop(true);

      // Persist for repeat orders at same table
      sessionStorage.setItem(
        `customerInfo_${tableId}`,
        JSON.stringify({
          name: customerName,
          contact: cleanedContact,
          email: customerEmail,
        })
      );

      const orderId = getOrderId(res);

      setTimeout(() => {
        setShowSuccessPop(false);

        if (orderId) {
          // Track ongoing orders (optional)
          const existing = safeParse<any[]>(
            sessionStorage.getItem("ongoingOrders"),
            []
          );
          existing.push(res);
          sessionStorage.setItem("ongoingOrders", JSON.stringify(existing));

          if (res?.order?.sessionId) {
            sessionStorage.setItem("session_id", res.order.sessionId);
            sessionStorage.setItem("resto_session_id", res.order.sessionId);
          }

          navigate(`/t/${rid}/order/${orderId}`);
        } else {
          alert("Order placed but could not retrieve order ID.");
        }
      }, 1200);
    } catch (error) {
      console.error("❌ Failed to place order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  /** ---------- Repeat Orders (skip modal, auto-merge) ---------- */
  const handleConfirmOrderWithSavedInfo = async (
    name: string,
    contact: string,
    email: string
  ) => {
    setIsPlacingOrder(true);

    const cleanedContact = contact.replace(/\s+/g, "").trim();

    const payload = {
      sessionId,
      customerName: name,
      customerContact: cleanedContact,
      customerEmail: email,
      isCustomerOrder: true,
      items: cartItems.map((item) => ({
        menuItemId: item.itemId || item._id,
        name: item.name,
        quantity: item.quantity,
        notes: item.notes || "",
      })),
    };

    try {
      const res: ApiOrder = await createOrder(rid, tableId!, payload);
      console.log("✅ Order merged or created:", res);

      clearCart();
      setShowSuccessPop(true);

      const orderId = getOrderId(res);

      setTimeout(() => {
        setShowSuccessPop(false);
        if (orderId) navigate(`/t/${rid}/order/${orderId}`);
      }, 1000);
    } catch (error) {
      console.error("❌ Failed to place order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  /** ---------- Clear info on table close/billing ---------- */
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

  // ... rest of the component is the same
  // ...

  return (
    <div className="bg-white min-h-screen pb-32 flex flex-col">
      {showTablePicker && (
        <TablePickerModal onClose={() => setShowTablePicker(false)} />
      )}
      <div className="inline-block bg-[#ffbe00] border-b border-[#051224]/20 shadow-lg sticky top-0 z-20">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 sm:p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <span className="text-white">←</span>
            </button>
            <span className="text-white font-bold text-base sm:text-lg">
              Cart
            </span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-2xl mx-auto w-full p-4 flex-1">
        {cartItems.length > 0 ? (
          <>
            <h2 className="font-bold text-gray-600 text-xl mb-4 flex items-center gap-2">
              <span className="text-lg rounded-full bg-gray-100 p-2">🛒</span>
              Your Cart
            </h2>

            {/* Items */}
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <div key={item._id} className="p-3 border-t-2 border-b-2 ">
                  <div className="flex gap-4 items-center">
                    <img
                      src={item.image || undefined}
                      alt={item.name}
                      className="w-20 h-auto rounded-xl object-cover text-black border-2 "
                    />
                    <div className="flex-1">
                      {/* First row: Name and price */}
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900 text-base truncate">
                          {item.name}
                        </span>

                        <span className="font-bold text-orange-600 text-lg mb-1">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                      {/* Second row: Qty controls */}
                      <div className="flex items-center gap-0 mt-3">
                        <button
                          onClick={() => updateQuantity(item._id, -1)}
                          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black text-xl hover:bg-gray-200 cursor-pointer"
                        >
                          <Minus size={15} strokeWidth={2.5} />
                        </button>
                        <span className="px-4 text-base font-semibold text-blue-950">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, 1)}
                          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black text-xl hover:bg-gray-200 cursor-pointer"
                        >
                          <Plus size={15} strokeWidth={2.5} />
                        </button>
                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item._id)}
                          className="ml-2 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full cursor-pointer"
                          title="Remove item"
                        >
                          <Trash size={16} strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="rounded-full bg-gray-100 p-4 mb-3 text-3xl">
                  🛒
                </div>
                <h2 className="font-bold text-xl text-gray-700 mb-1">
                  Your cart is empty
                </h2>
                <button
                  className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg px-6 py-2 transition cursor-pointer"
                  onClick={() => navigate(`/t/${rid}/menu`)}
                >
                  Browse Menu
                </button>
              </div>
            )}

            {/* Totals */}
            {cartItems.length > 0 && (
              <div className="pt-4 pb-6 px-8 bg-gray-50 rounded-b-2xl">
                <div className="flex justify-between font-medium text-gray-600 mb-2">
                  <span>Subtotal</span>
                  <span>₹{totalAmount}</span>
                </div>
                <div className="flex justify-between font-medium text-gray-600 mb-2">
                  <span>Delivery</span>
                  <span>₹10.50</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-lg mb-1">
                  <span>Total</span>
                  <span>₹{(totalAmount + 10.5).toFixed(2)}</span>
                </div>
                <button
                  className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-lg mt-3 shadow transition cursor-pointer"
                  onClick={initiatePlaceOrder}
                >
                  Place Order
                </button>
                <button
                  className="w-full py-2 rounded-lg bg-white border mt-2 font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
                  onClick={clearCart}
                >
                  Clear Cart
                </button>
              </div>
            )}

            {/* Actions */}
            {/* <div className="flex gap-2">
              <button
                className="flex-1 py-3 rounded-lg bg-white border font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={clearCart}
              >
                Clear Cart
              </button>
              <button
                className="flex-1 py-3 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
                onClick={initiatePlaceOrder}
                disabled={!cartItems.length}
              >
                Place Order
              </button>
            </div> */}
          </>
        ) : (
          // Empty cart view
          <div className="my-12 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-gray-100 p-4 mb-3 text-3xl">🛒</div>
            <h2 className="font-bold text-xl text-gray-700 mb-1">
              Your cart is empty
            </h2>
            <p className="text-gray-500 mb-4">
              Add some delicious items to get started!
            </p>
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-6 py-2 transition-all cursor-pointer"
              onClick={() => navigate(`/t/${rid}/menu`)}
            >
              Browse Menu
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      {/* <FooterNav activeTab="cart" cartCount={cartCount} /> */}

      {/* Customer Info Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0  bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full space-y-5 shadow-lg animate-in fade-in text-black">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Enter your details
            </h2>

            <input
              type="text"
              placeholder="Your Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 text-black"
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
                className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 text-black"
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
              className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 text-black"
            />

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 py-2 rounded-md border text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={isPlacingOrder}
                className={`flex-1 py-2 rounded-md text-white cursor-pointer ${
                  isPlacingOrder
                    ? "bg-yellow-400 cursor-not-allowed"
                    : "bg-yellow-600 hover:bg-yellow-700"
                } transition`}
              >
                {isPlacingOrder ? "Placing..." : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl px-10 py-8 flex flex-col items-center animate-bounce">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#22c55e" />
              <path
                d="M7 13l3 3 5-5"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h2 className="text-lg font-semibold text-green-600 mt-2 mb-1">
              Order Placed!
            </h2>
            <p className="text-gray-700 text-center">
              Your order was placed successfully.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
