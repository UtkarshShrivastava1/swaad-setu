import { useEffect } from "react";

interface OrderStatusLogoutProps {
  /** The current status of the order (e.g., 'pending', 'paid', 'delivered') */
  status: string | undefined;
  /** The function to call to log the user out */
  onLogout: () => void;
}

/**
 * A component that automatically triggers a logout
 * when the order status changes to "paid".
 * This is a "headless" component and renders nothing to the DOM.
 */
export const OrderStatusLogout = ({
  status,
  onLogout,
}: OrderStatusLogoutProps) => {
  useEffect(() => {
    if (status === "paid") {
      onLogout();
    }
  }, [status, onLogout]); // Effect runs when status or onLogout function changes

  return null; // This component does not render any UI
};
