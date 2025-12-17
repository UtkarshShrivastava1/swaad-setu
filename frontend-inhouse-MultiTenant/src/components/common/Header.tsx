import { Bell, LogOut, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Restaurant } from "../../api/restaurant.api";

interface HeaderProps {
  tenant: Restaurant | null;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
  waiterCallCount: number;
  role: "admin" | "staff";
}

export default function Header({
  tenant,
  searchQuery,
  setSearchQuery,
  onOpenNotifications,
  onLogout,
  waiterCallCount,
  role,
}: HeaderProps) {
  const restaurantName = tenant?.restaurantName || "RestaurantBoard";
  const dashboardTitle =
    role === "admin" ? "Admin Dashboard" : "Staff Dashboard";

  const navigate = useNavigate();

  const searchPlaceholder =
    role === "admin" ? "Search items..." : "Search orders, tables...";

  const handleLogout = () => {
    // Retrieve rid before logout clears state/storage
    const rid = (tenant as any)?.rid || localStorage.getItem("currentRid");
    onLogout();
    navigate(rid ? `/t/${rid}` : "/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full max-w-full overflow-x-hidden">
      {/* 🌌 GLASS NAVBAR */}
      <div className="relative w-full bg-black backdrop-blur-xl border-b border-neutral-800 shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* subtle glass highlight */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* ================= LEFT: LOGO ================= */}
            <div className="flex justify-start items-center flex-1">
              <img
                src="/logo.png"
                alt="SwaadSetu"
                className="h-8 sm:h-10 drop-shadow-[0_0_12px_rgba(245,158,11,0.15)]"
              />
            </div>

            {/* ================= CENTER: BRAND ================= */}
            <div className="flex justify-center min-w-0">
              <div className="text-center min-w-0">
                <div className="text-base sm:text-lg font-semibold text-amber-400 truncate">
                  {restaurantName}
                </div>
                <div className="text-xs text-amber-500 tracking-wide">
                  {dashboardTitle}
                </div>
              </div>
            </div>

            {/* ================= RIGHT: ACTIONS ================= */}
            <div className="flex justify-end items-center flex-1">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* 🔍 DESKTOP SEARCH */}
                <div className="hidden md:flex items-center gap-2 rounded-xl bg-amber-400 px-3 py-2 border border-amber-600 shadow-inner transition">
                  <Search className="h-4 w-4 text-black" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="bg-transparent placeholder:text-neutral-800 text-sm text-black outline-none w-28 lg:w-40"
                    autoComplete="off"
                  />
                </div>

                {/* 🔔 NOTIFICATIONS */}
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 border border-amber-600 shadow-md hover:shadow-lg transition focus:ring-2 focus:ring-black/40"
                >
                  <Bell className="h-5 w-5 text-black" />

                  {waiterCallCount > 0 && (
                    <>
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 animate-ping opacity-60" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow">
                        {waiterCallCount}
                      </span>
                    </>
                  )}
                </button>

                {/* 🚪 LOGOUT */}
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 border border-amber-600 shadow-md hover:shadow-lg transition focus:ring-2 focus:ring-black/40"
                >
                  <LogOut className="h-5 w-5 text-black" />
                </button>
              </div>
            </div>
          </div>

          {/* 📱 MOBILE SEARCH */}
          <div className="md:hidden pb-3">
            <div className="flex items-center bg-amber-400 rounded-xl px-3 py-2 gap-2 border border-amber-600 shadow-inner">
              <Search className="h-4 w-4 text-black" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="bg-transparent placeholder:text-neutral-800 text-sm text-black outline-none w-full"
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
