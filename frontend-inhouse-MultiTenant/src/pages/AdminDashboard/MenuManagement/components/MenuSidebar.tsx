import type { DropResult } from "@hello-pangea/dnd";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { bulkUpdateMenu } from "../../../../api/admin/menu.api";
import AddCategoryModal from "./AddCategoryModal";
import ComboBuilderModal from "./ComboBuilderModal";

export interface MenuItem {
  _id: string;
  itemId: string;
  name:string;
  description?: string;
  price: number;
  currency?: string;
  image?: string;
  isActive?: boolean;
  isVegetarian?: boolean;
  preparationTime?: number;
  isChefSpecial?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  itemIds: string[];
  isMenuCombo: boolean;
}

interface MenuSidebarProps {
  categories: Category[];
  items: MenuItem[];
  onCategoriesUpdate: (categories: Category[]) => void;
  onCategorySelect: (category: Category) => void;
  selectedCategory: Category | null;
  onDeleteCategory: (category: Category) => void;
  onRefreshMenu: () => void;
}

const MenuSidebar: React.FC<MenuSidebarProps> = ({
  categories,
  items,
  onCategoriesUpdate,
  onCategorySelect,
  selectedCategory,
  onDeleteCategory,
  onRefreshMenu,
}) => {
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddingComboCategory, setIsAddingComboCategory] = useState(false); // New state
  const [isComboBuilderModalOpen, setIsComboBuilderModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState<"categories" | "combos">(
    "categories"
  );

  const handleOpenComboBuilder = (category: Category) => {
    setEditingCategory(category);
    setIsComboBuilderModalOpen(true);
  };

  const handleCategoryUpdate = (updatedCategory: Category) => {
    const newCategories = categories.map((c) =>
      c._id === updatedCategory._id ? updatedCategory : c
    );
    onCategoriesUpdate(newCategories);
  };

  const tabButtonClass = (tabName: "categories" | "combos") => {
    const baseClasses =
      "flex-1 py-2 px-4 rounded-lg text-center font-semibold transition-all duration-300 shadow-sm cursor-pointer";
    if (activeTab === tabName) {
      return `${baseClasses} bg-yellow-400 text-black`;
    }
    return `${baseClasses} bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white`;
  };

  const regularCategories = categories.filter(
    (cat) => cat && cat._id && !cat.isMenuCombo
  );
  const comboCategories = categories.filter(
    (cat) => cat && cat._id && cat.isMenuCombo
  );

  return (
    <div className="p-2 sm:p-4 h-full flex flex-col bg-black text-white border-r border-gray-700">
      <div className="flex mb-4 gap-2">
        <button
          className={tabButtonClass("categories")}
          onClick={() => setActiveTab("categories")}
        >
          Categories
        </button>
        <button
          className={tabButtonClass("combos")}
          onClick={() => setActiveTab("combos")}
        >
          Combos
        </button>
      </div>

      {activeTab === "categories" && (
        <div className="flex flex-col flex-grow min-h-0">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-lg sm:text-xl font-semibold text-yellow-400">
              Categories
            </h2>
            <button
              onClick={() => {
                setIsAddingComboCategory(false); // Ensure false for regular category
                setIsAddCategoryModalOpen(true);
              }}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 cursor-pointer text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
          </div>
          <div className="flex-grow overflow-y-auto">
            <Droppable droppableId="categories-list" type="category">
              {(provided) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {/* Static All Items */}
                  <li
                    onClick={() => onCategorySelect({ _id: 'all', name: 'All Items', itemIds: items.map(i => i.itemId), isMenuCombo: false })}
                    className={`flex items-center justify-between p-1 sm:p-2 rounded-md cursor-pointer select-none transition-colors mb-2 ${
                      selectedCategory?._id === 'all'
                        ? "bg-yellow-400 text-black"
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-sm sm:text-base">All Items</span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        selectedCategory?._id === 'all'
                          ? "bg-yellow-500"
                          : "bg-gray-600 text-gray-300"
                      }`}
                    >
                      {items.length}
                    </span>
                  </li>
                  {regularCategories.map((category, index) => {
                    const isSelected = selectedCategory?._id === category._id;
                    const isUncategorized = category._id === 'uncategorized';
                    return (
                      <Draggable
                        key={`category-${category._id}`}
                        draggableId={`category-${category._id}`}
                        index={index}
                        isDragDisabled={isUncategorized}
                        type="category"
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="mb-2"
                          >
                            <Droppable droppableId={`category-${category._id}`} type="item">
                              {(dropProvided, dropSnapshot) => (
                                <li
                                  ref={dropProvided.innerRef}
                                  {...dropProvided.droppableProps}
                                  onClick={() => onCategorySelect(category)}
                                  className={`flex items-center justify-between p-1 sm:p-2 rounded-md cursor-pointer select-none transition-colors ${
                                    isSelected
                                      ? "bg-yellow-400 text-black"
                                      : "bg-gray-800 hover:bg-gray-700"
                                  } ${dropSnapshot.isDraggingOver ? 'bg-green-500' : ''}`}
                                >
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    {!isUncategorized && (
                                      <span {...provided.dragHandleProps}>
                                        <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                                      </span>
                                    )}
                                    <span className="text-sm sm:text-base">{category.name}</span>
                                  </div>

                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs ${
                                        isSelected
                                          ? "bg-yellow-500"
                                          : "bg-gray-600 text-gray-300"
                                      }`}
                                    >
                                      {(category.itemIds || []).length}
                                    </span>
                                    {!isUncategorized && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteCategory(category);
                                        }}
                                        className="p-2 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-500"
                                        aria-label="Delete category"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    )}
                                  </div>
                                  {dropProvided.placeholder}
                                </li>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </div>
        </div>
      )}

      {activeTab === "combos" && (
        <div className="flex flex-col flex-grow min-h-0">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-lg sm:text-xl font-semibold text-yellow-400">
              Combos
            </h2>
            <button
              onClick={() => {
                setIsAddingComboCategory(true); // Indicate combo category creation
                setIsAddCategoryModalOpen(true); // Open AddCategoryModal
              }}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 cursor-pointer text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create Combo</span>
            </button>
          </div>
          <div className="flex-grow overflow-y-auto">
            <ul>
              {comboCategories.map((category) => {
                const isSelected = selectedCategory?._id === category._id;
                return (
                  <li
                    key={category._id}
                    onClick={() => onCategorySelect(category)}
                    className={`flex items-center justify-between p-1 sm:p-2 rounded-md cursor-pointer select-none transition-colors mb-2 ${
                      isSelected
                        ? "bg-yellow-400 text-black"
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-sm sm:text-base">{category.name}</span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          isSelected
                            ? "bg-yellow-500"
                            : "bg-gray-600 text-gray-300"
                        }`}
                      >
                        {(category.itemIds || []).length}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenComboBuilder(category);
                        }}
                        className="p-2 rounded-full hover:bg-blue-500/20 text-gray-400 hover:text-blue-500"
                        aria-label="Edit combo"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCategory(category);
                        }}
                        className="p-2 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-500"
                        aria-label="Delete combo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => {
          setIsAddCategoryModalOpen(false);
          setIsAddingComboCategory(false); // Reset on close
        }}
        onCategoryAdded={() => {
          onRefreshMenu();
          setIsAddCategoryModalOpen(false);
          setIsAddingComboCategory(false); // Reset on category added
        }}
        initialIsMenuCombo={isAddingComboCategory} // Pass the new prop
      />

      <ComboBuilderModal
        isOpen={isComboBuilderModalOpen}
        onClose={() => setIsComboBuilderModalOpen(false)}
        category={editingCategory}
        items={items}
        onCategoryUpdate={handleCategoryUpdate}
      />

      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
          Order saved.
        </div>
      )}
    </div>
  );
};

export default MenuSidebar;
