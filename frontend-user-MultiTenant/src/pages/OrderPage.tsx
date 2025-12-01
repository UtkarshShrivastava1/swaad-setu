import { useParams } from "react-router-dom";
import OrderView from "../../components/Order/OrderView";

export default function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();

  if (!orderId) {
    // A fallback in case the orderId is not present in the URL
    return (
      <div className="flex items-center justify-center min-h-screen">
        Order ID is missing from the URL.
      </div>
    );
  }

  return <OrderView orderId={orderId} />;
}
