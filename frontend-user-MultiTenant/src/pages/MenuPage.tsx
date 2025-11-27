import { useQuery } from "@tanstack/react-query";
import { fetchMenu } from "../api/menu.api";
import { useCart } from "../stores/cart.store";
import RestaurantMenuApp from "../components/Menu/MenuGrid";
import { useTenant } from "../context/TenantContext";

export default function MenuPage() {
  const tNumber = sessionStorage.getItem("resto_table_number");
  const { rid } = useTenant();

  const {
    data: menu,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["menu", rid],
    queryFn: async () => {
      if (!rid) throw new Error("Restaurant ID not found");
      const res = await fetchMenu(rid);

      // No `response`, so check the real keys!
      if (!res || !res.menu || res.menu.length === 0) {
        throw new Error("Menu not found");
      }

      return res; // the whole object is what you want as menu data!
    },
    enabled: !!rid, // only fetch if rid is available
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });






  const add = useCart((s) => s.addItem);

  const handleAdd = (payload: {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
  }) => {
    add(payload);
  };

  return (
    <div className="min-h-screen bg-gray-50">
     

      <main className="max-w-full h-auto mx-auto">
        {isLoading && (
          <div className="text-center text-gray-500">Loading menu…</div>
        )}
          {error && (
            <div className="text-center text-red-500">
              Failed to load menu: {error.message || String(error)}
            </div>
          )}

        {/* {menu && (
          <MenuGrid
            items={menu.items.filter((i:MenuItem) => i.isActive !== false)}
            onAdd={handleAdd}
          />
        )} */}
        {menu && (
  <RestaurantMenuApp 
    menuData={menu}
    tableId={tNumber}
    onAddToCart={handleAdd}
  />
)}
      </main>
      {/* <FooterNav
        activeTab='menu'
        onTabChange={(newTab) => {
          setActiveTab(newTab);
          setView("list"); // Reset nested views on tab switch
        }}
        hasOrders={true} // Optionally, adjust as per live data
      /> */}

      {/* <CartDrawer /> */}
    </div>
  );
}
