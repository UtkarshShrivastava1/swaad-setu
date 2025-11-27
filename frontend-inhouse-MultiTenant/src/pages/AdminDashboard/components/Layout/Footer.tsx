import { AnimatePresence, motion } from "framer-motion";
import { Bell, FileText, Home, User, Utensils } from "lucide-react";

type FooterNavProps = {
  activeTab?: string;
  ordersCount?: number; // 👈 dynamic order count
  onTabChange?: (tabId: string) => void;
};

export default function FooterNav({
  activeTab = "dashboard",
  ordersCount = 0,
  onTabChange,
}: FooterNavProps) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
    { id: "menu", label: "Menu", icon: Utensils, href: "/menu" },
    { id: "orders", label: "Orders", icon: FileText, href: "/orders" },
    { id: "tables", label: "Tables", icon: Bell, href: "/tables" },
    { id: "more", label: "More", icon: User, href: "/more" },
  ];

  const handleClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    onTabChange?.(id);
  };

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
      <div className="grid grid-cols-5 py-2 sm:py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <a
              key={tab.id}
              href={tab.href}
              onClick={(e) => handleClick(tab.id, e)}
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

                {/* ===== Orders Badge ===== */}
                {tab.id === "orders" && ordersCount > 0 && (
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={ordersCount}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute -top-1 -right-1"
                    >
                      <div className="relative flex items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex min-w-[16px] h-4 px-[4px] bg-red-500 text-white text-[10px] font-bold rounded-full items-center justify-center shadow-md">
                          {ordersCount > 9 ? "9+" : ordersCount}
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
