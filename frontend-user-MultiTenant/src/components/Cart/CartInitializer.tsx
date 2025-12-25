import { useEffect } from "react";
import { useCart } from "@/stores/cart.store";
import { getOrderById } from "@/api/order.api";
import { useTenant } from "@/context/TenantContext";

const CartInitializer = () => {
  const { rid } = useTenant();
  const { initializeCartFromOrder, isInitialized, items, setInitialized } =
    useCart();

  useEffect(() => {
    const initialize = async () => {
      const activeOrderId = sessionStorage.getItem("active_order_id");
      const sessionId = sessionStorage.getItem("resto_session_id");

      // Condition to initialize:
      // 1. There is an active order ID.
      // 2. The cart is not already marked as initialized.
      // 3. The cart is currently empty (to avoid overwriting items added by the user).
      if (activeOrderId && !isInitialized && items.length === 0) {
        if (!rid || !sessionId) {
          console.error(
            "Tenant ID or Session ID is missing for initialization."
          );
          // Mark as initialized to prevent re-running with bad data
          setInitialized(true);
          return;
        }

        try {
          console.log(`Initializing cart from order: ${activeOrderId}`);
          const { order } = await getOrderById(rid, activeOrderId, sessionId);
          if (order) {
            initializeCartFromOrder(order);
          } else {
            // If order is not found, something is wrong.
            // Mark as initialized to prevent retries.
            setInitialized(true);
            console.warn(`Order with ID ${activeOrderId} not found.`);
          }
        } catch (error) {
          console.error("Failed to initialize cart from order:", error);
          // Mark as initialized to prevent retries even on error.
          setInitialized(true);
        }
      } else if (!activeOrderId && !isInitialized) {
        // If there's no active order and we haven't made a decision yet,
        // mark as initialized so we don't keep checking.
        setInitialized(true);
      }
    };

    // We only want to run this once on mount if the cart is not initialized.
    if (!isInitialized) {
      initialize();
    }
  }, [rid, initializeCartFromOrder, isInitialized, items.length, setInitialized]);

  return null; // This component renders nothing.
};

export default CartInitializer;
