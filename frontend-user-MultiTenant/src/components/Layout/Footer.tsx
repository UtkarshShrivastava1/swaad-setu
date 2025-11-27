import { AnimatePresence, motion } from "framer-motion";
import { FileText, ShoppingCart, Utensils } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTenant } from "../../context/TenantContext";

type FooterNavProps = {
  cartCount?: number;
};

export default function FooterNav({
  cartCount = 0,
}: FooterNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { rid } = useTenant();

  const activeTab = useMemo(() => {
    const path = location.pathname.split("/").pop();
    switch (path) {
      case "menu":
        return "menu";
      case "order":
      case "bill":
        return "myorder";
      case "viewcart":
        return "cart";
      default:
        return "menu";
    }
  }, [location.pathname]);

  const lastOrderHref = useMemo(() => {
    try {
      const storedOrdersString =
        sessionStorage.getItem("ongoingOrders") ||
        localStorage.getItem("ongoingOrders");
      if (!storedOrdersString) return `/t/${rid}/bill`;

      const parsed = JSON.parse(storedOrdersString);
      const orders = Array.isArray(parsed) ? parsed : [parsed];
      const latest = orders[orders.length - 1];
      const orderId = latest?.order?._id || latest?._id;
      return orderId ? `/t/${rid}/order/${orderId}` : `/t/${rid}/bill`;
    } catch (e) {
      console.error("⚠️ Failed to read ongoingOrders:", e);
      return `/t/${rid}/bill`;
    }
  }, [rid]);

  const tabs = [
    { id: "menu", label: "Menu", icon: Utensils, href: `/t/${rid}/menu` },
    { id: "cart", label: "Cart", icon: ShoppingCart, href: `/t/${rid}/viewcart` },
    { id: "myorder", label: "My Order", icon: FileText, href: lastOrderHref },
  ];

  return (
    <footer
      className="
        fixed bottom-4 left-1/2 -translate-x-1/2
        w-[92%] sm:w-[80%] md:w-[60%] lg:w-[50%] xl:w-[40%]
        bg-white/80 backdrop-blur-xl
        border border-yellow-200/40
        shadow-[0_8px_25px_rgba(255,200,0,0.25)]
        rounded-3xl z-50
        transition-all duration-300
        px-2 sm:px-4
      "
    >
      <div className="grid grid-cols-3 py-2 sm:py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <a
              key={tab.id}
              href={tab.href}
              onClick={(e) => {
                e.preventDefault();
                navigate(tab.href);
              }}
              className={`relative flex flex-col items-center justify-center transition-all duration-300 ${
                isActive
                  ? "text-yellow-500 scale-105"
                  : "text-gray-500 hover:text-yellow-500 hover:scale-105"
              }`}
            >
              {/* Glow behind active icon */}
              {isActive && (
                <div className="absolute -z-10 w-10 h-10 bg-yellow-100 rounded-full blur-md opacity-70 animate-pulse" />
              )}

              {/* Icon with badge */}
              <div className="relative">
                <Icon
                  size={window.innerWidth < 640 ? 22 : 26}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="mb-1"
                />

                {/* ===== Cart Badge ===== */}
                {tab.id === "cart" && cartCount > 0 && (
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={cartCount}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute -top-1 -right-1"
                    >
                      <div className="relative flex items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex min-w-[16px] h-4 px-[4px] bg-red-500 text-white text-[10px] font-bold rounded-full items-center justify-center shadow-md">
                          {cartCount > 9 ? "9+" : cartCount}
                        </span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[11px] sm:text-xs md:text-sm font-semibold transition ${
                  isActive ? "text-yellow-600" : "text-gray-600"
                }`}
              >
                {tab.label}
              </span>

              {/* Bottom Indicator Bar */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-gradient-to-r from-yellow-400 to-amber-300 shadow-sm" />
              )}
            </a>
          );
        })}
      </div>
    </footer>
  );
}
