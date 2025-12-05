import { AnimatePresence, motion } from "framer-motion";
import { Bell, FileText, Home, MoreHorizontal, Utensils } from "lucide-react";
import React from "react";

type TabId = "dashboard" | "menu" | "orders" | "tables" | "more";

type FooterNavProps = {
  activeTab?: string;
  ordersCount?: number;
  onTabChange?: (tabId: TabId) => void;
};

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
  { id: "menu", label: "Menu", icon: Utensils, href: "admin/menu" },
  { id: "orders", label: "Orders", icon: FileText, href: "/orders" },
  { id: "tables", label: "Tables", icon: Bell, href: "/tables" },
  { id: "more", label: "More", icon: MoreHorizontal, href: "/more" },
] as const;

export default function FooterNav({
  activeTab = "dashboard",
  ordersCount = 0,
  onTabChange,
}: FooterNavProps) {
  const handleClick = (id: TabId, e: React.MouseEvent) => {
    e.preventDefault();
    onTabChange?.(id);
  };

  return (
    <footer
      className="
        fixed bottom-3 left-1/2 -translate-x-1/2
        w-[95%] max-w-lg
        bg-gray-800/70 backdrop-blur-xl
        border border-white/10
        shadow-2xl shadow-black/40
        rounded-2xl z-50
      "
    >
      <div className="flex items-center justify-around p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <a
              key={tab.id}
              href={tab.href}
              onClick={(e) => handleClick(tab.id, e)}
              className={`relative flex flex-col items-center justify-center w-16 h-14 rounded-xl text-gray-300 transition-colors duration-300 z-10 ${
                isActive ? "" : "hover:bg-white/10"
              }`}
            >
              {/* Sliding Pill Background for Active Tab */}
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg shadow-md"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              {/* Icon with Badge */}
              <div className="relative">
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`relative z-10 transition-colors duration-300 ${
                    isActive ? "text-gray-900" : ""
                  }`}
                />

                {tab.id === "orders" && ordersCount > 0 && (
                  <AnimatePresence>
                    <motion.div
                      key={ordersCount}
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
                      <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-500 text-white text-[10px] font-bold">
                          {ordersCount > 9 ? "9+" : ordersCount}
                        </span>
                      </span>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {/* Label */}
              <span
                className={`relative z-10 text-xs font-medium transition-colors duration-300 ${
                  isActive ? "text-gray-900" : ""
                }`}
              >
                {tab.label}
              </span>
            </a>
          );
        })}
      </div>
    </footer>
  );
}
