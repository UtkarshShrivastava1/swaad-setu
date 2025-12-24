import { createOrder } from "@/api/order.api";
import { useTable } from "@/context/TableContext";
import { useTenant } from "@/context/TenantContext";
import { useCart } from "@/stores/cart.store"; // Import useCart from Zustand
import { useMenuStore } from "@/stores/menu.store";
import { usePricingStore } from "@/stores/pricing.store";
import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FooterNav from "../Layout/Footer";
import TablePickerModal from "../TableSelect/TablePickerModal";
import { CartItem } from "./CartItem";

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
  const { menuData } = useMenuStore();
  const { pricingConfig, fetchPricingConfig } = usePricingStore();

  useEffect(() => {
    if (rid) {
      fetchPricingConfig(rid);
    }
  }, [rid, fetchPricingConfig]);

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

  // Debug logging
  useEffect(() => {
    console.log("Tenant data:", tenant);
    console.log("Menu data from store:", menuData);
    console.log("Pricing config from store:", pricingConfig);
    console.log("📊 Order Status:", {
      activeOrderId: activeOrder?._id,
      // localOrderId, // REMOVED to avoid ReferenceError
      orderExists,
      tableId,
      cartItemsCount: cartItems.length,
      isPlacingOrder,
    });
  }, [
    activeOrder,
    // localOrderId, // REMOVED from dependencies
    orderExists,
    tableId,
    cartItems.length,
    isPlacingOrder,
    tenant,
    menuData,
    pricingConfig,
  ]);

  // Sync localOrderId with activeOrder and sessionStorage for persistence
  useEffect(() => {
    const activeOrderIdKey = `activeOrderId_${tableId}`;
    console.log(`[localOrderId useEffect] Running for tableId: ${tableId}, activeOrder: ${activeOrder?._id}`);

    if (activeOrder?._id) {
      console.log("🔵 Setting localOrderId from activeOrder (prop):", activeOrder._id);
      setLocalOrderId(activeOrder._id);
      sessionStorage.setItem(activeOrderIdKey, activeOrder._id); // Persist the server's truth
    } else {
      // If activeOrder prop is null, check sessionStorage for a previously known active order for this table
      const storedOrderId = sessionStorage.getItem(activeOrderIdKey);
      console.log(`[localOrderId useEffect] No activeOrder prop. Checking sessionStorage for key: ${activeOrderIdKey}. Stored value: ${storedOrderId}`);
      if (storedOrderId) {
        console.log("🟡 Setting localOrderId from sessionStorage:", storedOrderId);
        setLocalOrderId(storedOrderId);
      } else {
        console.log("🔴 No activeOrder prop or stored order. Clearing localOrderId.");
        setLocalOrderId(null);
        sessionStorage.removeItem(activeOrderIdKey); // Ensure cleanup if no order exists
      }
    }
  }, [activeOrder, tableId]); // Dependencies: activeOrder and tableId

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const priceAdjustments: {
    name: string;
    amount: number;
    type: string;
  }[] = [];

  if (pricingConfig) {
    // Taxes
    if (pricingConfig.taxes) {
      for (const tax of pricingConfig.taxes) {
        priceAdjustments.push({
          name: `${tax.name} (${tax.percent}%)`,
          amount: subtotal * (tax.percent / 100),
          type: "tax",
        });
      }
    }

    // Service Charge
    if (pricingConfig.serviceChargePercent) {
      priceAdjustments.push({
        name: `Service Charge (${pricingConfig.serviceChargePercent}%)`,
        amount: subtotal * (pricingConfig.serviceChargePercent / 100),
        type: "service_charge",
      });
    }

    // Global Discount
    if (pricingConfig.globalDiscountPercent) {
      const discountAmount =
        subtotal * (pricingConfig.globalDiscountPercent / 100);
      priceAdjustments.push({
        name: `Global Discount (${pricingConfig.globalDiscountPercent}%)`,
        amount: -discountAmount, // Negative amount for discount
        type: "discount",
      });
    }
  }

  // Log the full breakdown for debugging
  useEffect(() => {
    console.log("Full Price Breakdown:", {
      subtotal,
      adjustments: priceAdjustments,
    });
  }, [subtotal, priceAdjustments]);

  const grandTotal =
    subtotal + priceAdjustments.reduce((sum, adj) => sum + adj.amount, 0);

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

    // Prioritize using customer details from the active order if it exists
    if (activeOrder) {
      handleConfirmOrderWithSavedInfo(
        activeOrder.customerName,
        activeOrder.customerContact,
        activeOrder.customerEmail
      );
      return;
    }

    // Fallback to checking sessionStorage if there's no active order
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
    <div className="min-h-screen bg-gray-900 text-white pb-32 flex flex-col relative">
      {showTablePicker && (
        <TablePickerModal onClose={() => setShowTablePicker(false)} />
      )}
      {/* Modern Header */}
      <div className="bg-gray-800/80 backdrop-blur-sm border-b border-yellow-500/20 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl bg-gray-700/50 hover:bg-gray-600/70 transition-all duration-200"
              >
                <ArrowLeft
                  size={20}
                  className="text-yellow-400"
                  strokeWidth={2.5}
                />
              </button>
              <div>
                <h1 className="font-bold text-xl sm:text-2xl tracking-tight text-yellow-400">
                  Your Order
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm">
                  {cartItems.length} {cartItems.length === 1 ? "item" : "items"}{" "}
                  in your cart
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Cart Container */}
      <div className="max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Cart Items Section */}
        <div className="bg-gray-800/50 rounded-2xl shadow-lg overflow-hidden border border-gray-700">
          {cartItems.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {cartItems.map((item) => (
                <CartItem
                  key={item.cartItemId || item.itemId}
                  item={item}
                  onUpdateQty={(cartItemId, qty) => updateQty(cartItemId, qty)}
                  onRemove={(cartItemId) => removeItem(cartItemId)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 px-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 mb-6">
                <span className="text-5xl">🛒</span>
              </div>
              <h2 className="font-bold text-2xl text-white mb-3">
                Your cart is empty
              </h2>
              <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                Looks like you haven't added anything to your cart yet.
              </p>
              <button
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold rounded-xl px-8 py-3.5 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={() => navigate(`/t/${rid}/menu`)}
              >
                Explore Menu
              </button>
            </div>
          )}
        </div>
        {/* Order Summary Card */}
        {cartItems.length > 0 && (
          <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-700">
            <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-700">
              <h3 className="font-bold text-lg text-white">Order Summary</h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between items-center text-gray-300">
                <span className="font-medium">Subtotal</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Unified Price Adjustments */}
              {priceAdjustments.map((adj, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center ${
                    adj.amount < 0 ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  <span className="font-medium text-sm">{adj.name}</span>
                  <span className="font-semibold text-sm">
                    {adj.amount < 0 ? "-₹" : "₹"}
                    {Math.abs(adj.amount).toFixed(2)}
                  </span>
                </div>
              ))}

              {/* Divider */}
              <div className="border-t border-dashed border-gray-600 my-4"></div>

              {/* Grand Total */}
              <div className="flex justify-between items-center bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl px-4 py-3 border border-yellow-500/20">
                <span className="font-bold text-lg text-white">
                  Total Amount
                </span>
                <span className="font-bold text-2xl text-yellow-400">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={initiatePlaceOrder}
                >
                  {orderExists ? (
                    <>
                      <Plus size={20} strokeWidth={2.5} />
                      Add to Existing Order
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Place Order
                    </>
                  )}
                </button>
                <button
                  className="w-full py-3 rounded-xl bg-gray-700/50 border-2 border-gray-600 font-semibold text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={() => navigate(`/t/${rid}/menu`)}
                >
                  <Plus size={16} />
                  Add more items
                </button>

                <button
                  className="w-full py-3 rounded-xl bg-gray-700/50 border-2 border-gray-600 font-semibold text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-all duration-200"
                  onClick={clear}
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Footer Navigation */}
      <FooterNav cartCount={cartCount} />

      {/* Modern Customer Info Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div
            className="bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-700"
            style={{
              animation: "slideUp 0.3s ease-out",
            }}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-6 py-5 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-yellow-400 text-center">
                Customer Details
              </h2>
              <p className="text-gray-400 text-sm text-center mt-1">
                Please fill in your information to continue
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-gray-900 border-2 border-gray-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-white"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">
                  Contact Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={customerContact}
                    onChange={(e) =>
                      setCustomerContact(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    className="w-full bg-gray-900 border-2 border-gray-700 px-4 py-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-white"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  <svg
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-gray-900 border-2 border-gray-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-600 text-gray-300 font-semibold hover:bg-gray-700 hover:border-gray-500 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmOrder}
                  disabled={isPlacingOrder}
                  className={`flex-1 py-3 rounded-xl text-black font-bold transition-all ${
                    isPlacingOrder
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {isPlacingOrder ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Placing...
                    </span>
                  ) : (
                    "Confirm Order"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Success Popup */}
      {showSuccessPop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="bg-gray-800 rounded-2xl shadow-2xl px-12 py-10 flex flex-col items-center max-w-sm mx-4 border border-gray-700"
            style={{
              animation: "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Success Icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4 shadow-lg">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 13l3 3 7-7"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Order Placed!
            </h2>
            <p className="text-gray-400 text-center leading-relaxed">
              Your order has been successfully sent to the kitchen.
            </p>

            {/* Animated Dots Effect */}
            <div className="mt-6 flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add custom animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.8);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};
export default NewCartItem;
