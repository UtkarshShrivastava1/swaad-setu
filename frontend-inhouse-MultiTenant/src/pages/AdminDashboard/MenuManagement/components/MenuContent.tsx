import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Plus, Search, Settings } from "lucide-react";
import React from "react";
import MenuItemCard from "./MenuItemCard";

interface MenuItem {
  itemId: string;
  name: string;
  price: number;
  isActive?: boolean;
  isVegetarian?: boolean;
  isChefSpecial?: boolean;
}

interface MenuContentProps {
  items: MenuItem[];
  onAddItem: () => void;
  onItemSelect: (item: MenuItem) => void;
  onOpenSettings: () => void;
  selectedFilter: "All" | "Veg" | "Non-Veg";
  onFilterChange: (filter: "All" | "Veg" | "Non-Veg") => void;
  searchQuery: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteItem: (item: MenuItem) => void;
  onToggleStatus: (item: MenuItem) => void;
}

const MenuContent: React.FC<MenuContentProps> = ({
  items,
  onAddItem,
  onItemSelect,
  onOpenSettings,
  selectedFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onDeleteItem,
  onToggleStatus,
}) => {
  const filterButtonClass = (filterType: "All" | "Veg" | "Non-Veg") =>
    `px-4 py-2 rounded-md transition-colors duration-200 ${
      selectedFilter === filterType
        ? "bg-yellow-400 text-black border-yellow-400"
        : "border border-gray-300 text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* ================= TOP BAR ================= */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full sm:w-auto bg-white dark:bg-gray-800 text-black dark:text-white focus:border-yellow-500 focus:ring-yellow-500"
              value={searchQuery}
              onChange={onSearchChange}
              autoComplete="off"
            />
          </div>

          <div className="flex gap-2">
            <button
              className={filterButtonClass("All")}
              onClick={() => onFilterChange("All")}
            >
              All
            </button>
            <button
              className={filterButtonClass("Veg")}
              onClick={() => onFilterChange("Veg")}
            >
              Veg
            </button>
            <button
              className={filterButtonClass("Non-Veg")}
              onClick={() => onFilterChange("Non-Veg")}
            >
              Non-Veg
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddItem}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ================= DRAGGABLE GRID ================= */}
      <Droppable droppableId="menu-items" type="item">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {items?.length > 0 &&
              items.map((item, index) => {
                const safeId = String(item.itemId); // ✅ HARD SAFETY FIX

                if (!safeId) {
                  console.warn("Missing itemId for draggable:", item);
                  return null; // ✅ prevents crash
                }

                return (
                  <Draggable
                    key={safeId}
                    draggableId={safeId} // ✅ always string & defined
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="h-full"
                      >
                        <MenuItemCard
                          item={item}
                          onClick={() => onItemSelect(item)}
                          onDeleteItem={() => onDeleteItem(item)}
                          onToggleStatus={() => onToggleStatus(item)}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default MenuContent;
