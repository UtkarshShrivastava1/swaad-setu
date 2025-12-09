import { ArrowLeft, Minus, Phone, Plus, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../../api/order.api";
import { useTable } from "../../context/TableContext";
import { useTenant } from "../../context/TenantContext";
import { useCart } from "../../stores/cart.store"; // Import useCart from Zustand
import { GENERIC_ITEM_IMAGE_FALLBACK } from "../../utils/constants";
import FooterNav from "../Layout/Footer";
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
  image?: string;
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

const NewCartItem = ({ activeOrder }: { activeOrder: ApiOrder | null }) => {
  const { items: cartItems, clear, updateQty, removeItem } = useCart();
  const [cartCount, setCartCount] = useState(0); // Still need this for display, derived from Zustand
  const [showSuccessPop, setShowSuccessPop] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [localOrderId, setLocalOrderId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { rid, tenant } = useTenant();
  const { tableId } = useTable();

  const sessionId =
    sessionStorage.getItem("resto_session_id") ||
    `sess_${Math.random().toString(36).substring(2, 12)}`;

  useEffect(() => {
    sessionStorage.setItem("resto_session_id", sessionId);
  }, [sessionId]);

  // Update cartCount whenever cartItems from Zustand changes
  useEffect(() => {
    setCartCount(
      cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
    );
  }, [cartItems]);

  // Sync localOrderId with activeOrder from parent
  useEffect(() => {
    if (activeOrder?._id) {
      setLocalOrderId(activeOrder._id);
    }
  }, [activeOrder]);

  // Determine if we have an active order - check both activeOrder prop and local tracking
  // This ensures we show "Add More Items" immediately after creating an order
  const orderExists = !!activeOrder || !!localOrderId;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const taxDetails =
    tenant?.taxes?.map((tax) => ({
      name: tax.name,
      amount: subtotal * (tax.percent / 100),
    })) ?? [];

  const serviceChargeAmount = tenant?.serviceCharge
    ? subtotal * (tenant.serviceCharge / 100)
    : 0;

  const grandTotal =
    subtotal +
    taxDetails.reduce((sum, tax) => sum + tax.amount, 0) +
    serviceChargeAmount;

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
      items: cartItems.map((item) => ({
        menuItemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        notes: item.notes || "",
      })),
    };

    try {
      const res: ApiOrder = await createOrder(rid, tableId!, payload);
      console.log("✅ Order created/merged:", res);

      const orderId = getOrderId(res);
      if (orderId) {
        setLocalOrderId(orderId); // Track order locally for immediate UI update
      }

      clear();
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
            // sessionStorage.setItem("session_id", res.order.sessionId); // Remove or comment out this line
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
    contact: string | null | undefined,
    email: string
  ) => {
    setIsPlacingOrder(true);

    const cleanedContact = (contact || "").replace(/\s+/g, "").trim();

    const payload = {
      sessionId,
      customerName: name,
      customerContact: cleanedContact,
      customerEmail: email,
      isCustomerOrder: true,
      ...(activeOrder?._id && { orderId: activeOrder._id }), // Conditionally add orderId
      items: cartItems.map((item) => ({
        menuItemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        notes: item.notes || "",
      })),
    };

    try {
      const res: ApiOrder = await createOrder(rid, tableId!, payload);
      console.log("✅ Order merged or created:", res);

      const orderId = getOrderId(res);
      if (orderId) {
        setLocalOrderId(orderId); // Track order locally for immediate UI update
      }

      clear();
      setShowSuccessPop(true);

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

  const initiatePlaceOrder = () => {
    if (!tableId) {
      setShowTablePicker(true);
      return;
    }

    const savedCustomerInfo = safeParse<{
      name: string;
      contact: string;
      email: string;
    }>(sessionStorage.getItem(`customerInfo_${tableId}`), null);

    if (savedCustomerInfo) {
      handleConfirmOrderWithSavedInfo(
        savedCustomerInfo.name,
        savedCustomerInfo.contact,
        savedCustomerInfo.email
      );
    } else {
      setShowCustomerModal(true);
    }
  };

  /** ---------- Clear info on table close/billing ---------- */
  useEffect(() => {
    const handleClearCustomerInfo = () => {
      if (tableId) {
        sessionStorage.removeItem(`customerInfo_${tableId}`);
      }
      sessionStorage.removeItem("ongoingOrders");
      setLocalOrderId(null);
    };
    window.addEventListener("clearTableSession", handleClearCustomerInfo);
    return () =>
      window.removeEventListener("clearTableSession", handleClearCustomerInfo);
  }, [tableId]);

  return (
    <div className="min-h-screen bg-gray-50 pb-32 flex flex-col">
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
              <ArrowLeft size={18} className="text-white" />
            </button>
            <span className="text-white font-bold text-base sm:text-lg">
              Cart
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-lg w-full mx-auto bg-white mt-6 rounded-2xl shadow p-0 overflow-hidden divide-y divide-gray-100">
        {/* Cart Items */}
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <div key={item.itemId} className="p-3 border-t-2 border-b-2 ">
              <div className="flex gap-4 items-center">
                <img
                  src={
                    item.image &&
                    item.image.startsWith("https://example.com/images/")
                      ? GENERIC_ITEM_IMAGE_FALLBACK
                      : item.image
                  }
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
                      onClick={() => updateQty(item.itemId, -1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black text-xl hover:bg-gray-200"
                    >
                      <Minus size={15} strokeWidth={2.5} />
                    </button>
                    <span className="px-4 text-base font-semibold text-blue-950">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.itemId, 1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black text-xl hover:bg-gray-200"
                    >
                      <Plus size={15} strokeWidth={2.5} />
                    </button>
                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.itemId)}
                      className="ml-2 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full"
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
            <div className="rounded-full bg-gray-100 p-4 mb-3 text-3xl">🛒</div>
            <h2 className="font-bold text-xl text-gray-700 mb-1">
              Your cart is empty
            </h2>
            <button
              className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg px-6 py-2 transition"
              onClick={() => navigate(`/t/${rid}/menu`)}
            >
              Browse Menu
            </button>
          </div>
        )}
        {/* Total Section */}
        {cartItems.length > 0 && (
          <div className="pt-4 pb-6 px-8 bg-gray-50 rounded-b-2xl">
            <div className="flex justify-between font-medium text-gray-600 mb-2">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            {taxDetails.map((tax) => (
              <div
                key={tax.name}
                className="flex justify-between font-medium text-gray-600 mb-2"
              >
                <span>{tax.name}</span>
                <span>₹{tax.amount.toFixed(2)}</span>
              </div>
            ))}

            {serviceChargeAmount > 0 && (
              <div className="flex justify-between font-medium text-gray-600 mb-2">
                <span>Service Charge</span>
                <span>₹{serviceChargeAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-gray-900 text-lg pt-2 mt-2 border-t">
              <span>Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
            <button
              className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-lg mt-3 shadow transition"
              onClick={initiatePlaceOrder}
            >
              {orderExists ? "Add More Items" : "Place Order"}
            </button>
            <button
              className="w-full py-2 rounded-lg bg-white border mt-2 font-medium text-gray-700 hover:bg-gray-100"
              onClick={clear}
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
      {/* Footer Navigation */}
      <FooterNav cartCount={cartCount} />

      {/* Customer Info Modal */}
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
                disabled={isPlacingOrder}
                className={`flex-1 py-2 rounded-md text-white ${
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
};

export default NewCartItem;
