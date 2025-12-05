import { Bell, LogOut, Search } from "lucide-react";
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
  const initials =
    tenant?.restaurantName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2) || "RB";

  const restaurantName = tenant?.restaurantName || "RestaurantBoard";
  const dashboardTitle =
    role === "admin" ? "Admin Dashboard" : "Staff Dashboard";

  const searchPlaceholder =
    role === "admin" ? "Search items..." : "Search orders, tables...";

  return (
    <header className="sticky top-0 z-50 w-full max-w-full overflow-x-hidden">
      {/* ✅ GLASS BAR — ORIGINAL COLORS BUT PREMIUM SHADES */}
      <div className="relative w-full max-w-full bg-[#ffbe00]/95 backdrop-blur-xl border-b border-[#051224]/20 shadow-lg overflow-hidden">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            {/* ================= BRAND ================= */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative rounded-xl bg-[#051224] w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center font-extrabold text-[#ffbe00] shadow-[0_0_20px_rgba(5,18,36,0.6)]">
                {initials}
              </div>

              <div className="min-w-0">
                <div className="text-base sm:text-lg font-semibold text-[#051224] truncate">
                  {restaurantName}
                </div>
                <div className="text-xs text-[#051224]/70 hidden sm:block">
                  {dashboardTitle}
                </div>
              </div>
            </div>

            {/* ================= ACTIONS ================= */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 🔍 DESKTOP SEARCH */}
              <div className="hidden md:flex items-center gap-2 rounded-lg bg-[#051224]/95 px-3 py-2 shadow-md border border-[#051224]/30">
                <Search className="h-4 w-4 text-[#ffbe00]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="bg-transparent placeholder:text-[#ffbe00]/60 text-sm text-[#ffbe00] outline-none w-40"
                />
              </div>

              {/* 🔔 NOTIFICATION */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2.5 rounded-lg bg-[#051224]/95 hover:bg-[#051224] border border-[#051224]/40 shadow-md transition"
              >
                <Bell className="h-5 w-5 text-[#ffbe00]" />
                {waiterCallCount > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 animate-ping opacity-70" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                      {waiterCallCount}
                    </span>
                  </>
                )}
              </button>

              {/* 🚪 LOGOUT */}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 bg-[#051224] hover:bg-[#0a1a35] rounded-lg px-4 py-2.5 text-sm text-[#ffbe00] font-semibold shadow-md transition"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* ✅ MOBILE SEARCH */}
          <div className="md:hidden pb-3 w-full">
            <div className="flex items-center bg-[#051224] rounded-lg px-3 py-2 gap-2 border border-[#051224]/40 shadow-md w-full">
              <Search className="h-4 w-4 text-[#ffbe00]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="bg-transparent placeholder:text-[#ffbe00]/60 text-sm text-[#ffbe00] outline-none w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
