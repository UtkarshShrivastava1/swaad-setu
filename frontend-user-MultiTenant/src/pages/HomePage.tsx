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

  const renderPage = () => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    const secondToLastSegment = pathSegments[pathSegments.length - 2];

    if (secondToLastSegment === "order" && lastSegment) {
      return <OrderView orderId={lastSegment} />;
    }

    if (lastSegment === rid) {
      return <TableLanding />;
    }

    switch (lastSegment) {
      case "menu":
        return <MenuPage />;
      case "table":
        return <TableLanding />;
      case "viewcart":
        return <CartItem />;
      default:
        return <MenuPage />;
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header
        variant="other"
        pageTitle="swaad Setu"
        tableNumber={tableNumber.toString()}
        waitTime="30-40 mins"
        table={table}
      />
      <main className="flex-grow">{renderPage()}</main>
      <FooterNav cartCount={totalCartCount} />
    </div>
  );
}
