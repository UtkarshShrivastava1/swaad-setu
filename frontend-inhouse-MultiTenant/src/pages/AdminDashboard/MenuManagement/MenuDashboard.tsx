import { Maximize, Menu, Minimize, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
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

import { useSocket } from "../../../context/SocketContext";

interface MenuDashboardProps {
  setActiveTab: (tab: any) => void;
  onEdit: (item: any) => void;
  onCreate: () => void;
  onFullscreenChange: (isFs: boolean) => void;
  isParentFullscreen: boolean; // New prop
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const MenuDashboard: React.FC<MenuDashboardProps> = ({ setActiveTab, onEdit, onCreate, onFullscreenChange, isParentFullscreen, searchQuery, setSearchQuery }) => {
  const { rid } = useParams<{ rid: string }>();
  const socket = useSocket();

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


  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const menuDashboardRef = useRef<HTMLDivElement>(null); // Ref for the main container

  const didAutoSelect = useRef(false);

  /* ================= FETCH MENU & SOCKET LISTENER ================= */

  const fetchMenuData = useCallback(async () => {
    if (!rid) return;

    try {
      setLoading(true);
      const res = await getMenu(rid);
      // Filter out items without itemId to prevent TypeError
      const validItems = (res.menu || []).filter((item: MenuItem) => item && item.itemId && !item.isDeleted);
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
  }, [rid]);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  useEffect(() => {
    if (!socket) return;

    const handleMenuUpdate = (data: any) => {
      console.log("Received menu_update event:", data);
      const validItems = (data.menu || []).filter((item: MenuItem) => item && item.itemId && !item.isDeleted);
      setItems(validItems);
      setCategories(data.categories || []);
      setBranding(data.branding || {});
      setTaxes(data.taxes || []);
      setServiceCharge(data.serviceCharge || 0);
      setMenuExists(true);
      toast.info("Menu has been updated in real-time!");
    };

    socket.on("menu_update", handleMenuUpdate);

    return () => {
      socket.off("menu_update", handleMenuUpdate);
    };
  }, [socket]);
  
  const handleMenuCreated = async () => {
    if (!rid) return;
    const res = await getMenu(rid);
    // Filter out items without itemId to prevent TypeError
    const validItems = (res.menu || []).filter((item: MenuItem) => item && item.itemId && !item.isDeleted);
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
      if (!selectedCategory) return;

      const draggedItemId = draggableId;
      const originalCategoryItemIds = Array.from(selectedCategory.itemIds);
      const filteredItemIds = filteredItems.map((item) => item.itemId);

      // 1. Remove the dragged item from its original position in the unfiltered list
      const currentItemIds = originalCategoryItemIds.filter(
        (id) => id !== draggedItemId
      );

      // 2. Determine the insertion point in the UNFILTERED list
      let insertIndex = -1;

      if (destination.index === 0) {
        // If dropping at the very beginning of the filtered list
        if (filteredItemIds.length > 0 && filteredItemIds[0] !== draggedItemId) {
          insertIndex = currentItemIds.indexOf(filteredItemIds[0]);
        } else {
          insertIndex = 0; // Or insert at the actual beginning if no other items or only dragged item
        }
      } else if (destination.index === filteredItemIds.length) {
        // If dropping at the very end of the filtered list
        insertIndex = currentItemIds.length;
      } else {
        // If dropping in between filtered items
        const itemAfterDest = filteredItemIds[destination.index];
        const itemBeforeDest = filteredItemIds[destination.index - 1];

        const indexAfter = currentItemIds.indexOf(itemAfterDest);
        const indexBefore = currentItemIds.indexOf(itemBeforeDest);

        if (indexAfter !== -1) {
          insertIndex = indexAfter;
        } else if (indexBefore !== -1) {
          insertIndex = indexBefore + 1;
        } else {
          // Fallback, should not happen if filtered items are present in original
          insertIndex = destination.index; // Approximate position
        }
      }

      // Ensure insertIndex is within bounds
      if (insertIndex < 0) insertIndex = 0;
      if (insertIndex > currentItemIds.length) insertIndex = currentItemIds.length;

      // Insert the dragged item at the determined index
      currentItemIds.splice(insertIndex, 0, draggedItemId);

      const newCategories = categories.map((cat) =>
        cat._id === selectedCategory._id
          ? { ...cat, itemIds: currentItemIds }
          : cat
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

  const selectedCategoryItems = useMemo(() => {
    if (!selectedCategory) return [];
    return items.filter(item => selectedCategory.itemIds.includes(item.itemId));
  }, [items, selectedCategory]);

  const filteredItems = useMemo(() => {
    if (!selectedCategory) return [];

    let list = selectedCategoryItems;

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
  }, [selectedCategory, selectedCategoryItems, selectedFilter, searchQuery]);

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
              onDeleteCategory={(category) => {
                setCategoryToDelete(category);
                setIsConfirmCategoryDeleteOpen(true);
              }}
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
                onItemSuccessfullyAddedAndMenuNeedsRefresh={fetchMenuData}
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
                  setIsConfirmModalOpen(false);
                  try {
                    await deleteMenuItem(rid, itemToHandle.itemId, false);
                    fetchMenuData();
                  } catch (error) {
                    console.error("Error deleting menu item:", error);
                  }
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
