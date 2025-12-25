import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getActiveOrderByTableId } from "../api/order.api";
import OrderView from "../components/Order/OrderView";
import { useTable } from "../context/TableContext";
import { useTenant } from "../context/TenantContext";

export default function OrderPage() {
  const { orderId: orderIdFromUrl } = useParams<{ orderId: string }>();
  const { tableId } = useTable();
  const { rid } = useTenant();
  const navigate = useNavigate();

  const [orderId, setOrderId] = useState<string | null>(orderIdFromUrl || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderIdFromUrl) {
      setOrderId(orderIdFromUrl);
      setLoading(false);
      return;
    }

    if (tableId && rid) {
      setLoading(true);
      getActiveOrderByTableId(rid, tableId)
        .then((activeOrder) => {
          if (activeOrder?._id) {
            setOrderId(activeOrder._id);
            // Optional: Replace URL to have a consistent link
            navigate(`/t/${rid}/order/${activeOrder._id}`, { replace: true });
          } else {
            setError("No active order found for this table.");
          }
        })
        .catch(() => {
          setError("Failed to fetch active order.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // If there's no tableId or rid, we can't fetch an order.
      // This might happen if someone navigates to /order without a table context.
      setError("Table context is not available.");
      setLoading(false);
    }
  }, [orderIdFromUrl, tableId, rid, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading order details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {error}
      </div>
    );
  }

  if (!orderId) {
    // This should ideally not be reached if logic is correct, but as a fallback:
    return (
      <div className="flex items-center justify-center min-h-screen">
        Could not determine the order to display.
      </div>
    );
  }

  return <OrderView orderId={orderId} />;
}
