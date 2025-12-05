import { Maximize, Menu, Minimize, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  bulkUpdateMenu,
  deleteCategory,
  deleteMenuItem,
  getMenu,
  updateMenuItem,
} from "../../../api/admin/menu.api";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import MenuInitialization from "./MenuInitialization";
import MenuManagementLayout from "./MenuManagementLayout";
import AddItemDrawer from "./components/AddItemDrawer";
import ConfirmModal from "./components/ConfirmModal";
import MenuContent from "./components/MenuContent";
import type { Category, MenuItem } from "./components/MenuSidebar";
import MenuSidebar from "./components/MenuSidebar";
import SettingsDrawer from "./components/SettingsDrawer";
import { SkeletonContent, SkeletonSidebar } from "./components/SkeletonLoader";

interface MenuDashboardProps {
  setActiveTab: (tab: any) => void;
  onEdit: (item: any) => void;
  onCreate: () => void;
  onFullscreenChange: (isFs: boolean) => void;
  isParentFullscreen: boolean; // New prop
}

const MenuDashboard: React.FC<MenuDashboardProps> = ({ setActiveTab, onEdit, onCreate, onFullscreenChange, isParentFullscreen }) => {
  const { rid } = useParams<{ rid: string }>();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branding, setBranding] = useState<any>({});
  const [taxes, setTaxes] = useState<any[]>([]);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuExists, setMenuExists] = useState(false);

  const [isAddItemDrawerOpen, setIsAddItemDrawerOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConfirmCategoryDeleteOpen, setIsConfirmCategoryDeleteOpen] =
    useState(false);

  const [itemToHandle, setItemToHandle] = useState<MenuItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    "all"
  );
  const [selectedFilter, setSelectedFilter] = useState<
    "All" | "Veg" | "Non-Veg"
  >("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const menuDashboardRef = useRef<HTMLDivElement>(null); // Ref for the main container

  const didAutoSelect = useRef(false);

  /* ================= FETCH MENU ================= */

  useEffect(() => {
    const fetchMenuData = async () => {
      if (!rid) return;

      try {
        setLoading(true);
        const res = await getMenu(rid);
        // Filter out items without itemId to prevent TypeError
        const validItems = (res.menu || []).filter((item: MenuItem) => item && item.itemId);
        setItems(validItems);
        setCategories(res.categories || []);
        setBranding(res.branding || {});
        setTaxes(res.taxes || []);
        setServiceCharge(res.serviceCharge || 0);
        setMenuExists(true);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setMenuExists(false);
        } else {
          setError("Failed to fetch menu data.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, [rid]);

  const refreshMenu = async () => {
    if (!rid) return;
    console.log("MenuDashboard: refreshMenu called. Fetching updated menu data...");
    try {
      const res = await getMenu(rid);
      // Filter out items without itemId to prevent TypeError
      const validItems = (res.menu || []).filter((item: MenuItem) => item && item.itemId);
      console.log("MenuDashboard: refreshMenu fetched data:", validItems);
      setItems(validItems);
      setCategories(res.categories || []);
      setBranding(res.branding || {});
      setTaxes(res.taxes || []);
      setServiceCharge(res.serviceCharge || 0);
      setMenuExists(true);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setMenuExists(false);
      } else {
        setError("Failed to fetch menu data.");
        console.error("MenuDashboard: Error fetching menu data during refresh:", err);
      }
    }
  };

  const handleMenuCreated = async () => {
    if (!rid) return;
    const res = await getMenu(rid);
    // Filter out items without itemId to prevent TypeError
    const validItems = (res.menu || []).filter((item: MenuItem) => item && item.itemId);
    setItems(validItems);
    setCategories(res.categories || []);
    setBranding(res.branding || {});
    setTaxes(res.taxes || []);
    setServiceCharge(res.serviceCharge || 0);
    setMenuExists(true);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceDroppableId = source.droppableId;
    const destDroppableId = destination.droppableId;

    if (
      sourceDroppableId === "categories-list" &&
      destDroppableId === "categories-list"
    ) {
      const reordered = Array.from(categories);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      setCategories(reordered);
      if (rid) await bulkUpdateMenu(rid, { categories: reordered });
      return;
    }

    if (
      sourceDroppableId === "menu-items" &&
      destDroppableId === "menu-items"
    ) {
      if (searchQuery || selectedFilter !== "All") {
        // TODO: Implement reordering with filters active.
        // This is complex because source/destination indices are for the filtered list.
        alert(
          "Drag-and-drop reordering is disabled when search or filters are active."
        );
        return;
      }
      const selectedCategory = categories.find(
        (c) => c._id === selectedCategoryId
      );
      if (!selectedCategory) return;

      const newItems = Array.from(selectedCategory.itemIds);
      const [reorderedItem] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, reorderedItem);

      const newCategories = categories.map((cat) =>
        cat._id === selectedCategory._id ? { ...cat, itemIds: newItems } : cat
      );

      setCategories(newCategories);
      if (rid) await bulkUpdateMenu(rid, { categories: newCategories });
      return;
    }

    // Handle moving an item to a different category
    if (sourceDroppableId === "menu-items" && destDroppableId.startsWith("category-")) {
        const destCategoryId = destDroppableId.replace("category-", "");
        const itemId = draggableId;

        if (destCategoryId === 'uncategorized' || destCategoryId === 'all') {
            return; // Cannot drop into virtual categories
        }

        let newCategoriesState = [...categories];

        // Find and remove from source category
        const sourceCategory = newCategoriesState.find(cat => cat.itemIds.includes(itemId));
        if (sourceCategory) {
            // Avoid moving item to the same category
            if (sourceCategory._id === destCategoryId) return;
            
            newCategoriesState = newCategoriesState.map(cat => 
                cat._id === sourceCategory._id
                    ? { ...cat, itemIds: cat.itemIds.filter(id => id !== itemId) }
                    : cat
            );
        }
        
        // Add to destination category
        newCategoriesState = newCategoriesState.map(cat => {
            if (cat._id === destCategoryId) {
                const newItems = Array.from(cat.itemIds);
                if (!newItems.includes(itemId)) {
                    newItems.splice(destination.index, 0, itemId);
                }
                return { ...cat, itemIds: newItems };
            }
            return cat;
        });

        setCategories(newCategoriesState);
        if (rid) {
            await bulkUpdateMenu(rid, { categories: newCategoriesState });
        }
    }
  };

  /* ================= MEMO DATA ================= */

  const categoriesWithUncategorized = useMemo(() => {
    const allCategorizedItemIds = new Set(categories.flatMap((c) => c.itemIds));

    const uncategorizedItems = items.filter(
      (item) => !allCategorizedItemIds.has(item.itemId)
    );

    if (uncategorizedItems.length > 0) {
      const uncategorizedCategory: Category = {
        _id: "uncategorized",
        name: "Un-categorized",
        itemIds: uncategorizedItems.map((item) => item.itemId),
        isMenuCombo: false,
      };
      return [...categories, uncategorizedCategory];
    }

    return categories;
  }, [categories, items]);

  const selectedCategory = useMemo(() => {
    if (selectedCategoryId === "all") {
      return {
        _id: "all",
        name: "All Items",
        itemIds: items.map((i) => i.itemId),
        isMenuCombo: false,
      };
    }

    return (
      categoriesWithUncategorized.find((c) => c._id === selectedCategoryId) ||
      null
    );
  }, [categoriesWithUncategorized, selectedCategoryId, items]);

  const filteredItems = useMemo(() => {
    if (!selectedCategory) return [];

    let list = items.filter((item) =>
      selectedCategory.itemIds.includes(item.itemId)
    );

    if (selectedFilter === "Veg")
      list = list.filter((item) => item.isVegetarian);
    if (selectedFilter === "Non-Veg")
      list = list.filter((item) => !item.isVegetarian);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [items, selectedCategory, selectedFilter, searchQuery]);

  /* ================= EARLY RETURNS ================= */

  if (loading) {
    return (
      <MenuManagementLayout
        sidebar={<SkeletonSidebar />}
        mainContent={<SkeletonContent />}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => {}}
        onFullscreenChange={onFullscreenChange}
      />
    );
  }

  if (error) return <div className="text-red-500">{error}</div>;
  if (!menuExists)
    return <MenuInitialization onMenuCreated={handleMenuCreated} />;

  /* ================= PREMIUM RENDER ================= */

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <MenuManagementLayout
          sidebar={
            <MenuSidebar
              categories={categoriesWithUncategorized}
              items={items}
              onCategoriesUpdate={setCategories}
              onCategorySelect={(category) => {
                setSelectedCategoryId(category._id);
                if (isSidebarOpen) toggleSidebar();
              }}
              selectedCategory={selectedCategory}
              onDeleteCategory={setCategoryToDelete}
              onRefreshMenu={refreshMenu}
            />
          }
          mainContent={
            <div className="flex-1 p-4 md:p-6">
              <div className="rounded-3xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl p-4 md:p-6">
                <MenuContent
                  items={filteredItems}
                  onAddItem={() => {
                    if (
                      !selectedCategory ||
                      selectedCategory._id === "all" ||
                      selectedCategory._id === "uncategorized"
                    ) {
                      toast.error(
                        "Please select a specific category to add an item."
                      );
                      return;
                    }
                    setSelectedItem(null);
                    setIsAddItemDrawerOpen(true);
                  }}
                  onItemSelect={(item) => {
                    const category = categories.find((c) =>
                      c.itemIds.includes(item.itemId)
                    );
                    setSelectedCategoryId(category?._id || null);
                    setSelectedItem(item);
                    setIsAddItemDrawerOpen(true);
                  }}
                  onOpenSettings={() => setIsSettingsDrawerOpen(true)}
                  selectedFilter={selectedFilter}
                  onFilterChange={setSelectedFilter}
                  searchQuery={searchQuery}
                  onSearchChange={(e) => setSearchQuery(e.target.value)}
                  onDeleteItem={(item) => {
                    setItemToHandle(item);
                    setIsConfirmModalOpen(true);
                  }}
                  onToggleStatus={async (item) => {
                    const original = item.isActive;
                    setItems((p) =>
                      p.map((i) =>
                        i.itemId === item.itemId
                          ? { ...i, isActive: !original }
                          : i
                      )
                    );
                    try {
                      if (!rid) return;
                      await updateMenuItem(rid, item.itemId, {
                        isActive: !original,
                      });
                    } catch {
                      setItems((p) =>
                        p.map((i) =>
                          i.itemId === item.itemId
                            ? { ...i, isActive: original }
                            : i
                        )
                      );
                    }
                  }}
                />
              </div>
            </div>
          }
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          onFullscreenChange={onFullscreenChange}
          modals={(isFullscreen) => (
            <>
              {/* ================= DRAWERS & MODALS ================= */}

              <AddItemDrawer
                isOpen={isAddItemDrawerOpen}
                onClose={() => {
                  setIsAddItemDrawerOpen(false);
                  setSelectedItem(null);
                }}
                category={selectedCategory}
                item={selectedItem}
                onItemSuccessfullyAddedAndMenuNeedsRefresh={refreshMenu} // New prop
              />

              <SettingsDrawer
                isOpen={isSettingsDrawerOpen}
                onClose={() => setIsSettingsDrawerOpen(false)}
                branding={branding}
                taxes={taxes}
                serviceCharge={serviceCharge}
              />

              <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={async () => {
                  if (!itemToHandle || !rid) return;
                  await deleteMenuItem(rid, itemToHandle.itemId);
                  setItems((p) =>
                    p.filter((i) => i.itemId !== itemToHandle.itemId)
                  );
                  setIsConfirmModalOpen(false);
                }}
                title="Delete Menu Item"
                message={`Delete "${itemToHandle?.name}" permanently?`}
              />

              <ConfirmModal
                isOpen={isConfirmCategoryDeleteOpen}
                onClose={() => setIsConfirmCategoryDeleteOpen(false)}
                onConfirm={async () => {
                  if (!categoryToDelete || !rid) return;
                  await deleteCategory(rid, categoryToDelete._id);
                  setCategories((p) =>
                    p.filter((c) => c._id !== categoryToDelete._id)
                  );
                  setIsConfirmCategoryDeleteOpen(false);
                }}
                title="Delete Category"
                message={`Delete "${categoryToDelete?.name}" permanently?`}
              />
            </>
          )}
        />
      </DragDropContext>
    </>
  );
};

export default MenuDashboard;
