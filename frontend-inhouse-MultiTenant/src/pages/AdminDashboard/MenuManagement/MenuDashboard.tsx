import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getMenu } from "../../../api/admin/menu.api";
import MenuInitialization from "./MenuInitialization";
import MenuManagementLayout from "./MenuManagementLayout";
import AddItemDrawer from "./components/AddItemDrawer";
import MenuContent from "./components/MenuContent";
import MenuSidebar from "./components/MenuSidebar";
import SettingsDrawer from "./components/SettingsDrawer";
import { SkeletonContent, SkeletonSidebar } from "./components/SkeletonLoader";

import type { Category, MenuItem } from "./components/MenuSidebar";

const MenuDashboard = () => {
  const { rid } = useParams<{ rid: string }>();

  const [menuData, setMenuData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuExists, setMenuExists] = useState(false);

  const [isAddItemDrawerOpen, setIsAddItemDrawerOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Veg" | "Non-Veg">(
    "All"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const didAutoSelect = useRef(false);

  /* ================= FETCH MENU ================= */

  useEffect(() => {
    const fetchMenuData = async () => {
      if (!rid) return;

      try {
        setLoading(true);
        console.log("Fetching menu data for rid:", rid);
        const res = await getMenu(rid);
        console.log("Menu API response data:", res); // Log the raw response
        setMenuData(res); // Assign res directly as it's already res.data due to interceptor
        setMenuExists(true);
      } catch (err: any) {
        console.error("Error fetching menu data:", err); // Log the full error
        if (err.response?.status === 404) {
          setMenuExists(false);
          console.log("Menu does not exist for rid:", rid);
        } else {
          setError("Failed to fetch menu data.");
        }
      } finally {
        setLoading(false);
        console.log("Loading state after fetch:", false);
      }
    };

    fetchMenuData();
  }, [rid]);

  const handleMenuCreated = async () => {
    if (!rid) return;

    const res = await getMenu(rid);
    const data = res.data;

    const safeItems = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.menu)
      ? data.menu
      : [];

    const safeFilteredItems = safeItems.filter(
      (i: any) => i && typeof i.itemId === "string"
    );

    setMenuData({
      ...data,
      items: safeFilteredItems,
      categories: data.categories || [],
    });

    setMenuExists(true);
  };

  const handleFilterChange = (filter: "All" | "Veg" | "Non-Veg") => {
    setSelectedFilter(filter);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  /* ================= STATE UPDATES ================= */

  const handleCategoriesUpdate = (updatedCategories: Category[]) => {
    setMenuData((prev: any) => ({
      ...prev,
      categories: updatedCategories,
    }));
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleOpenAddItemDrawer = (category: Category) => {
    setSelectedCategory(category);
    setSelectedItem(null);
    setIsAddItemDrawerOpen(true);
  };

  const handleOpenEditItemDrawer = (item: MenuItem) => {
    const category = categories.find((c) => c.itemIds.includes(item.itemId));

    setSelectedCategory(category || null);
    setSelectedItem(item);
    setIsAddItemDrawerOpen(true);
  };

  const handleItemAdded = (newItem: MenuItem) => {
    setMenuData((prev: any) => ({
      ...prev,
      menu: [...(prev.menu || []), newItem],
    }));
  };

  const handleItemUpdated = (updatedItem: MenuItem) => {
    if (!updatedItem || !updatedItem.itemId) {
      console.error("Invalid updated item:", updatedItem);
      return;
    }

    setMenuData((prev: any) => {
      const safeItems = Array.isArray(prev?.items)
        ? prev.items.filter((i: any) => i && i.itemId)
        : [];

      const exists = safeItems.some(
        (i: MenuItem) => i.itemId === updatedItem.itemId
      );

      const newItems = exists
        ? safeItems.map((i: MenuItem) =>
            i.itemId === updatedItem.itemId ? updatedItem : i
          )
        : [...safeItems, updatedItem]; // fallback safety

      return {
        ...prev,
        items: newItems, // ✅ CORRECT KEY
      };
    });
  };

  const handleItemsReorder = (newItems: MenuItem[]) => {
    setMenuData((prev: any) => ({
      ...prev,
      menu: newItems,
    }));
  };

  const handleSettingsUpdate = (updatedSettings: any) => {
    setMenuData((prev: any) => ({
      ...prev,
      ...updatedSettings,
    }));
  };

  /* ================= BACKEND DATA ================= */

  const items: MenuItem[] = menuData?.menu || [];
  const categories: Category[] = menuData?.categories || [];

  console.log("Current categories (for debug):", categories);
  console.log("Current items (for debug):", items);

  const branding = menuData?.branding || {};
  const taxes = menuData?.taxes || [];
  const serviceCharge = menuData?.serviceCharge || 0;

  /* ================= AUTO SELECT FIRST CATEGORY ================= */

  useEffect(() => {
    if (!didAutoSelect.current && categories.length > 0) {
      setSelectedCategory(categories[0]);
      didAutoSelect.current = true;
      console.log("Auto-selected first category:", categories[0]);
    }
  }, [categories]);

  /* ================= FILTERED ITEMS ================= */

  const filteredItems = useMemo(() => {
    console.log("selectedCategory for filtering:", selectedCategory);
    if (!selectedCategory) return [];

    let itemsToFilter = items.filter((item) =>
      selectedCategory.itemIds.includes(item.itemId)
    );

    if (selectedFilter === "Veg") {
      itemsToFilter = itemsToFilter.filter((item) => item.isVegetarian);
    } else if (selectedFilter === "Non-Veg") {
      itemsToFilter = itemsToFilter.filter((item) => !item.isVegetarian);
    }

    if (searchQuery) {
      const lowerCaseSearchQuery = searchQuery.toLowerCase();
      itemsToFilter = itemsToFilter.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerCaseSearchQuery) ||
          (item.description &&
            item.description.toLowerCase().includes(lowerCaseSearchQuery))
      );
    }

    console.log("Filtered items:", itemsToFilter);
    return itemsToFilter;
  }, [items, selectedCategory, selectedFilter, searchQuery]);

  /* ================= EARLY RETURNS ================= */

  if (loading) {
    return (
      <MenuManagementLayout
        sidebar={<SkeletonSidebar />}
        mainContent={<SkeletonContent />}
      />
    );
  }

  if (error) return <div className="text-red-500">{error}</div>;

  if (!menuExists) {
    return <MenuInitialization onMenuCreated={handleMenuCreated} />;
  }

  /* ================= FINAL RENDER ================= */

  return (
    <>
      <MenuManagementLayout
        sidebar={
          <MenuSidebar
            categories={categories}
            items={items}
            onCategoriesUpdate={handleCategoriesUpdate}
            onCategorySelect={handleCategorySelect}
          />
        }
        mainContent={
          <MenuContent
            items={filteredItems}
            onAddItem={() =>
              handleOpenAddItemDrawer(selectedCategory || categories[0])
            }
            onItemSelect={handleOpenEditItemDrawer}
            onOpenSettings={() => setIsSettingsDrawerOpen(true)}
            onItemsReorder={handleItemsReorder}
            selectedFilter={selectedFilter}
            onFilterChange={handleFilterChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />
        }
      />

      <AddItemDrawer
        isOpen={isAddItemDrawerOpen}
        onClose={() => setIsAddItemDrawerOpen(false)}
        category={selectedCategory}
        item={selectedItem}
        onItemAdded={handleItemAdded}
        onItemUpdated={handleItemUpdated}
      />

      <SettingsDrawer
        isOpen={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
        branding={branding}
        taxes={taxes}
        serviceCharge={serviceCharge}
        onSettingsUpdate={handleSettingsUpdate}
      />
    </>
  );
};

export default MenuDashboard;



