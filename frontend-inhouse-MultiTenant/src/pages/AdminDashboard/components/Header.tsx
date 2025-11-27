// src/components/ui/staff/Header.tsx
import React from "react";
import { Bell, Search, LogOut } from "lucide-react";

export default function Header({
  searchQuery,
  setSearchQuery,
  onOpenNotifications,
  onLogout,
  waiterCallCount,
}: {
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
  waiterCallCount: number;
}) {
  return (
    <header className="sticky top-0 z-50 bg-[#ffbe00] shadow-xl border-b border-[#051224]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-xl bg-[#051224] p-2 sm:p-2.5 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-lg sm:text-xl flex-shrink-0 shadow-lg text-[#ffbe00]">
              RB
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-semibold text-[#051224] truncate">
                RestaurantBoard
              </div>
              <div className="text-xs text-[#051224]/80 hidden sm:block">
                Staff Dashboard
              </div>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-[#051224] rounded-lg px-3 py-2 gap-2 border border-[#051224]/40 shadow-md hover:bg-[#0a1a35] transition-all">
              <Search className="h-4 w-4 text-[#ffbe00]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders..."
                className="bg-transparent placeholder:text-[#ffbe00]/70 text-sm text-[#ffbe00] outline-none w-32 sm:w-48"
              />
            </div>

            {/* Notification Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 sm:p-2.5 bg-[#051224] rounded-lg hover:bg-[#0a1a35] transition-all border border-[#051224]/40 shadow-md"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-[#ffbe00]" />
              {waiterCallCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#ffbe00] text-[#051224] text-xs rounded-full flex items-center justify-center font-semibold shadow-lg">
                  {waiterCallCount}
                </span>
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-[#051224] hover:bg-[#0a1a35] rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-[#ffbe00] font-semibold shadow-lg transition-all hover:shadow-xl"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <div className="flex items-center bg-[#051224] rounded-lg px-3 py-2 gap-2 border border-[#051224]/40 shadow-md">
            <Search className="h-4 w-4 text-[#ffbe00]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders, tables..."
              className="bg-transparent placeholder:text-[#ffbe00]/70 text-sm text-[#ffbe00] outline-none w-full"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
