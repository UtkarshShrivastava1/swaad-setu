import { Bell, LogOut, PlusCircle, Search } from "lucide-react";

export default function Header({
  searchQuery,
  setSearchQuery,
  onOpenNotifications,
  onLogout,
  waiterCallCount,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
  waiterCallCount: number;
}) {
  const PLACE_ORDER_LINK =
    import.meta.env.VITE_USER_LINK || "http://localhost:5173/";

  return (
    <header className="sticky top-0 z-50 bg-[#ffbe00] shadow-lg border-b border-[#051224]/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* ---------- LEFT: Brand ---------- */}
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#051224] p-2 sm:p-3 w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center font-extrabold text-xl text-[#ffbe00] shadow-md hover:scale-105 transition-transform">
              RB
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-semibold text-[#051224]">
                RestaurantBoard
              </span>
              <span className="text-xs sm:text-sm text-[#051224]/70 tracking-wide">
                Admin Dashboard
              </span>
            </div>
          </div>

          {/* ---------- CENTER: Search ---------- */}
          <div className="hidden md:flex flex-1 justify-center px-8">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="block w-full bg-white/20 border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[#051224] placeholder:text-[#051224]/60 focus:outline-none focus:bg-white/50 focus:ring-2 focus:ring-[#051224] transition-all"
              />
            </div>
          </div>

          {/* ---------- RIGHT: Actions ---------- */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* ➕ Place Order Button */}
            <a
              href={PLACE_ORDER_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 bg-[#051224] hover:bg-[#0a1a35] rounded-xl px-4 py-2.5 text-sm sm:text-base font-semibold text-[#ffbe00] shadow-md hover:shadow-xl transition-all"
            >
              <PlusCircle size={18} />
              Place Order
            </a>

            {/* Mobile Order Button (icon only) */}
            <a
              href={PLACE_ORDER_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="sm:hidden p-2.5 bg-[#051224] rounded-xl hover:bg-[#0a1a35] transition-all border border-[#051224]/30 shadow-md"
              title="Place Order"
            >
              <PlusCircle size={20} className="text-[#ffbe00]" />
            </a>

            {/* Notification Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 sm:p-3 bg-[#051224] rounded-xl hover:bg-[#0a1a35] transition-all border border-[#051224]/30 shadow-md hover:shadow-lg"
              title="Waiter Calls"
            >
              <Bell className="h-5 w-5 text-[#ffbe00]" />
              {waiterCallCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-[#ffbe00] text-[#051224] text-xs rounded-full flex items-center justify-center font-bold shadow-md">
                  {waiterCallCount}
                </span>
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-[#051224] hover:bg-[#0a1a35] rounded-xl px-3.5 sm:px-4 py-2.5 text-sm text-[#ffbe00] font-semibold shadow-md hover:shadow-xl transition-all"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
