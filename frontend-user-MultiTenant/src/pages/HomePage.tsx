import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import FooterNav from "../components/Layout/Footer";
import Header from "../components/Layout/Header";
import TableLanding from "./TableLanding";
import MenuPage from "./MenuPage";
import CartItem from "../components/Cart/NewCartItem";
import OrderView from "../components/Order/OrderView";
import { useTable } from "../context/TableContext";
import { useTenant } from "../context/TenantContext";
import { useCart } from "../stores/cart.store";
import { getOrder, type Order as ApiOrderType } from "../api/order.api"; // Import Order type

export default function HomePage() {
  const { table } = useTable();
  const { rid } = useTenant();
  const location = useLocation();

  const { items: cartItems } = useCart();
  const totalCartCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const tableNumber = table?.tableNumber || "";
  const [activeOrder, setActiveOrder] = useState<ApiOrderType | null>(null);

  useEffect(() => {
    const fetchActiveOrder = async () => {
      if (rid) {
        const sessionId = sessionStorage.getItem("resto_session_id");
        if (sessionId) {
          try {
            const ordersResponse = await getOrder(rid, sessionId);
            const existingOrders = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse ? [ordersResponse] : []);

            const foundOrder = existingOrders.find(
              (o) => o.status !== "completed" && o.status !== "cancelled"
            );
            setActiveOrder(foundOrder || null);
          } catch (error) {
            console.error("Error fetching active order in HomePage:", error);
            setActiveOrder(null);
          }
        }
      }
    };
    fetchActiveOrder();
  }, [rid, table?.tableNumber]); // Re-fetch if restaurant or table changes

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  const isRootPage = lastSegment === rid;

  const renderPage = () => {
    const secondToLastSegment = pathSegments[pathSegments.length - 2];

    if (secondToLastSegment === "order" && lastSegment) {
      return <OrderView key={lastSegment} orderId={lastSegment} />;
    }

    if (lastSegment === rid) {
      return <TableLanding key={lastSegment} />;
    }

    switch (lastSegment) {
      case "menu":
        return <MenuPage key="menu" />;
      case "table":
        return <TableLanding key="table" />;
      case "viewcart":
        return <CartItem key="viewcart" activeOrder={activeOrder} />;
      default:
        return <MenuPage key="default" />;
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {!isRootPage && (
        <Header
          variant="other"
          pageTitle="swaad Setu"
          tableNumber={tableNumber.toString()}
          waitTime="30-40 mins"
          table={table}
        />
      )}
      <main className="flex-grow">{renderPage()}</main>
      {!isRootPage && <FooterNav cartCount={totalCartCount} />}
    </div>
  );
}
