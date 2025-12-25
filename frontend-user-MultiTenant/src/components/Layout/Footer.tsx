import { AnimatePresence, motion } from "framer-motion";
import { FileText, Loader, ShoppingCart, Utensils } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getActiveOrderByTableId } from "../../api/order.api";
import { useTable } from "../../context/TableContext";
import { useTenant } from "../../context/TenantContext";

type FooterNavProps = {
  cartCount?: number;
};

type TabId = "menu" | "cart" | "myorder";

export default function FooterNav({ cartCount = 0 }: FooterNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { rid } = useTenant();
  const { tableId } = useTable();
  const [isCheckingOrder, setIsCheckingOrder] = useState(false);

  const activeTab = useMemo<TabId>(() => {
    const path = location.pathname.split("/").pop();
    if (location.pathname.includes("/order/")) return "myorder";

    switch (path) {
      case "menu":
        return "menu";
      case "bill":
        return "myorder";
      case "viewcart":
        return "cart";
      default:
        return "menu";
    }
  }, [location.pathname]);

  const handleMyOrderClick = async () => {
    if (!tableId || !rid) {
      alert("Table information is not available.");
      return;
    }

    setIsCheckingOrder(true);
    try {
      const activeOrder = await getActiveOrderByTableId(rid, tableId);
      if (activeOrder?._id) {
        navigate(`/t/${rid}/order/${activeOrder._id}`);
      } else {
        alert("No active order found.");
      }
    } catch (err) {
      console.error("Failed to check for active order:", err);
      alert("Could not check for an active order. Please try again.");
    } finally {
      setIsCheckingOrder(false);
    }
  };

  const tabs: {
    id: TabId;
    label: string;
    icon: any;
    action: () => void;
  }[] = [
    {
      id: "menu",
      label: "Menu",
      icon: Utensils,
      action: () => navigate(`/t/${rid}/menu`),
    },
    {
      id: "cart",
      label: "Cart",
      icon: ShoppingCart,
      action: () => navigate(`/t/${rid}/viewcart`),
    },
    {
      id: "myorder",
      label: "My Order",
      icon: isCheckingOrder ? Loader : FileText,
      action: handleMyOrderClick,
    },
  ];

  return (
    <footer
      className="
        fixed bottom-0 left-0 right-0
        bg-gray-900/80 backdrop-blur-xl
        border-t border-white/10
        shadow-2xl shadow-black/40
        z-50
        transition-all duration-300
        px-1 sm:px-2 md:px-3
        pb-[env(safe-area-inset-bottom)]
      "
    >
      <div className="flex items-center justify-around py-2 sm:py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={tab.action}
              disabled={isCheckingOrder && tab.id === "myorder"}
              className={`relative flex flex-col items-center justify-center
                w-16 sm:w-20 md:w-24
                h-12 sm:h-14 md:h-16
                rounded-xl sm:rounded-2xl
                transition-all duration-300
                z-10
                ${isActive ? "" : "hover:bg-white/10 active:scale-95"}
                disabled:opacity-50 disabled:cursor-wait
              `}
            >
              {/* ===== Sliding Active Pill ===== */}
              {isActive && (
                <motion.div
                  layoutId="active-pill-customer"
                  className="
                    absolute inset-0
                    bg-gradient-to-br from-yellow-400 to-amber-500
                    rounded-xl sm:rounded-2xl
                    shadow-md
                  "
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              {/* ===== Icon + Badge ===== */}
              <div className="relative">
                <Icon
                  size={22}
                  className={`
                    relative z-10
                    transition-all duration-300
                    sm:w-7 sm:h-7
                    ${isActive ? "text-gray-900" : "text-gray-100"}
                    ${isCheckingOrder && tab.id === 'myorder' ? 'animate-spin' : ''}
                  `}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                {/* ===== Cart Badge ===== */}
                {tab.id === "cart" && cartCount > 0 && (
                  <AnimatePresence>
                    <motion.div
                      key={cartCount}
                      initial={{ scale: 0.5, opacity: 0, y: -5 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                      className="absolute -top-1.5 -right-2"
                    >
                      <span className="relative flex h-4 w-4 sm:h-5 sm:w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span
                          className="
                          relative inline-flex items-center justify-center
                          rounded-full
                          h-4 w-4 sm:h-5 sm:w-5
                          bg-red-500 text-white
                          text-[9px] sm:text-[10px]
                          font-bold
                        "
                        >
                          {cartCount > 9 ? "9+" : cartCount}
                        </span>
                      </span>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {/* ===== Label ===== */}
              <span
                className={`
                  relative z-10
                  mt-1
                  text-xs sm:text-sm
                  font-bold
                  transition-colors duration-300
                  ${isActive ? "text-gray-900" : "text-gray-100"}
                `}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
