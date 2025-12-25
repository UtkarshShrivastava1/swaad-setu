import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchMenu } from "../api/menu.api";
import RestaurantMenuApp from "../components/Menu/MenuGrid";
import { useTenant } from "../context/TenantContext";
import { useMenuStore } from "../stores/menu.store";

import RefreshButton from "../components/common/RefreshButton";

export default function MenuPage() {
  const { rid } = useTenant();
  const { setMenuData } = useMenuStore();

  const {
    data: menu,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["menu", rid],
    queryFn: async () => {
      if (!rid) throw new Error("Restaurant ID not found");
      const res = await fetchMenu(rid);
      console.log("Fetched Menu Data:", res); // Log the menu data

      if (!res || !res.menu || res.menu.length === 0) {
        throw new Error("Menu not found");
      }

      return res;
    },
    enabled: !!rid,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  useEffect(() => {
    if (menu) {
      setMenuData(menu);
    }
  }, [menu, setMenuData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white relative overflow-hidden">
      <RefreshButton />
      {/* ================= LOADING STATE ================= */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[60vh] text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin" />
            <p className="text-gray-400 text-sm tracking-wide">Loading menu…</p>
          </div>
        </div>
      )}

      {/* ================= ERROR STATE ================= */}
      {error && (
        <div className="flex items-center justify-center min-h-[60vh] px-6">
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl px-6 py-5 shadow-xl text-center max-w-md">
            <h2 className="font-bold text-lg mb-1">Failed to load menu</h2>
            <p className="text-sm opacity-90">
              {error.message || String(error)}
            </p>
          </div>
        </div>
      )}

      {/* ================= MENU & COMBOS ================= */}
      {!isLoading && !error && menu && (
        <main className="max-w-full h-auto mx-auto relative z-10">
          <RestaurantMenuApp
            menuData={menu}
          />
        </main>
      )}
    </div>
  );
}
