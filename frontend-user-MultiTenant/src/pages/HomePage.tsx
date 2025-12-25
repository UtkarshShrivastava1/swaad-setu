import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import CartItem from "../components/Cart/NewCartItem";
import FooterNav from "../components/Layout/Footer";
import SubHeader from "../components/common/SubHeader";
import Header from "../components/Layout/Header";
import OrderView from "../components/Order/OrderView";
import { useTable } from "../context/TableContext";
import { useTenant } from "../context/TenantContext";
import { useCart } from "../stores/cart.store";
import MenuPage from "./MenuPage";
import TableLanding from "./TableLanding";

export default function HomePage() {
  const { table, tableId, activeOrder } = useTable(); // Use activeOrder from context
  const { rid } = useTenant();
  const location = useLocation();

  const { items: cartItems } = useCart();
  const totalCartCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const tableNumber = table?.tableNumber || "";

  const sessionId =
    sessionStorage.getItem("resto_session_id") ||
    `sess_${Math.random().toString(36).substring(2, 12)}`;
  useEffect(() => {
    sessionStorage.setItem("resto_session_id", sessionId);
  }, [sessionId]);

  /* ================= ROUTE LOGIC ================= */

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  const secondToLastSegment = pathSegments[pathSegments.length - 2];
  const isRootPage = lastSegment === rid;
  const showSubHeader = !isRootPage && lastSegment !== 'table';


  const renderPage = () => {
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

  /* ================= PREMIUM DARK SHELL ================= */

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-hidden">
      {/* ============ HEADER (GLASS) ============ */}
      {!isRootPage && (
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-black/60 border-b border-white/10">
          <Header
            variant="other"
            pageTitle="Swaad Setu"
            tableNumber={tableNumber.toString()}
            waitTime="30–40 mins"
            table={table}
          />
           {showSubHeader && <SubHeader />}
        </div>
      )}

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-grow relative z-10 pb-20">
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
          {renderPage()}
        </div>
      </main>

      {/* ============ FOOTER NAV (FLOATING SAFE) ============ */}
      {!isRootPage && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/70 backdrop-blur-xl border-t border-white/10">
          <FooterNav cartCount={totalCartCount} />
        </div>
      )}
    </div>
  );
}
