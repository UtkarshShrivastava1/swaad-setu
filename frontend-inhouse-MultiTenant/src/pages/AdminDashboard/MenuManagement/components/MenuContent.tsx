import React from 'react';
import MenuItemCard from './MenuItemCard';
import { Search, Settings, Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';

interface MenuItem {
  itemId: string;
  name: string;
  price: number;
  isActive?: boolean;
  isVegetarian?: boolean; // Add this property for filtering
}

interface MenuContentProps {
  items: MenuItem[];
  onAddItem: () => void;
  onItemSelect: (item: MenuItem) => void;
  onOpenSettings: () => void;
  onItemsReorder: (newItems: MenuItem[]) => void; // New prop for reordering
  selectedFilter: "All" | "Veg" | "Non-Veg"; // New prop
  onFilterChange: (filter: "All" | "Veg" | "Non-Veg") => void; // New prop
  searchQuery: string; // New prop
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void; // New prop
}

const MenuContent: React.FC<MenuContentProps> = ({ items, onAddItem, onItemSelect, onOpenSettings, onItemsReorder, selectedFilter, onFilterChange, searchQuery, onSearchChange }) => {
  // Removed sortedItems to avoid interference with drag and drop
  // const sortedItems = [...items].sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1));

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(source.index, 1);
    newItems.splice(destination.index, 0, reorderedItem);

    onItemsReorder(newItems);
  };

  const filterButtonClass = (filterType: "All" | "Veg" | "Non-Veg") =>
    `px-4 py-2 rounded-md transition-colors duration-200 ${
      selectedFilter === filterType
        ? 'bg-yellow-400 text-black border-yellow-400'
        : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
            <input
              type="text"
              placeholder="Search items..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:border-yellow-500 focus:ring-yellow-500"
              value={searchQuery}
              onChange={onSearchChange}
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
        <div className="flex items-center gap-4">
          <button
            onClick={onAddItem}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500"
          >
            <Plus className="h-5 w-5" />
            Add Item
          </button>
          <button onClick={onOpenSettings} className="p-2 rounded-md hover:bg-gray-100 text-gray-700">
            <Settings className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="menu-items">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {items.map((item, index) => (
                <Draggable key={item.itemId} draggableId={item.itemId} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <MenuItemCard item={item} onClick={() => onItemSelect(item)} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default MenuContent;

