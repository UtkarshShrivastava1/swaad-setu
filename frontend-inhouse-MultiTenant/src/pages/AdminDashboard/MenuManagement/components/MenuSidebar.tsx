import type { DropResult } from "@hello-pangea/dnd";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { GripVertical, Pencil, Plus } from "lucide-react";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { bulkUpdateMenu } from "../../../../api/admin/menu.api";
import AddCategoryModal from "./AddCategoryModal";
import ComboBuilderModal from "./ComboBuilderModal";

export interface MenuItem {
  _id: string;
  itemId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  image?: string;
  isActive?: boolean;
  isVegetarian?: boolean;
  preparationTime?: number;
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
}

const MenuSidebar: React.FC<MenuSidebarProps> = ({
  categories,
  items,
  onCategoriesUpdate,
  onCategorySelect,
}) => {
  const { rid } = useParams<{ rid: string }>();
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isComboBuilderModalOpen, setIsComboBuilderModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'combos'>('categories'); // New state for tabs

  /* ================= DRAG END ================= */

  const onDragEnd = async (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newCategories = Array.from(categories);
    const [reorderedItem] = newCategories.splice(source.index, 1);
    newCategories.splice(destination.index, 0, reorderedItem);

    onCategoriesUpdate(newCategories);

    if (!rid) return;
    try {
      await bulkUpdateMenu(rid, { categories: newCategories });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error("Failed to save category order:", error);
      onCategoriesUpdate(categories);
    }
  };

  const handleAddCategory = (newCategory: Category) => {
    onCategoriesUpdate([...categories, newCategory]);
  };

  const handleOpenComboBuilder = (category: Category) => {
    setSelectedCategory(category);
    setIsComboBuilderModalOpen(true);
  };

  const handleCategoryUpdate = (updatedCategory: Category) => {
    const newCategories = categories.map((c) =>
      c._id === updatedCategory._id ? updatedCategory : c
    );
    onCategoriesUpdate(newCategories);
  };

  const tabButtonClass = (tabName: 'categories' | 'combos') =>
    `flex-1 py-2 text-center font-medium ${
      activeTab === tabName
        ? 'border-b-2 border-yellow-500 text-yellow-400'
        : 'text-gray-400 hover:text-white'
    }`;

  const regularCategories = categories.filter(cat => !cat.isMenuCombo);
  const comboCategories = categories.filter(cat => cat.isMenuCombo);

  return (
    <div className="p-4 h-full flex flex-col bg-black text-white">
      <div className="flex mb-4 border-b border-gray-700">
        <button
          className={tabButtonClass('categories')}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button
          className={tabButtonClass('combos')}
          onClick={() => setActiveTab('combos')}
        >
          Combos
        </button>
      </div>

      {activeTab === 'categories' && (
        <>
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">Categories</h2>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex-grow"
                >
                  {regularCategories.map((category, index) => {
                    if (!category || !category._id) return null;

                    return (
                      <Draggable
                        key={category._id}
                        draggableId={category._id}
                        index={index}
                      >
                        {(provided) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            onClick={() => onCategorySelect(category)}
                            className="flex items-center justify-between p-2 rounded-md bg-gray-800 hover:bg-gray-700 cursor-pointer select-none mb-2" // Themed list item
                          >
                            <div className="flex items-center gap-2">
                              <span {...provided.dragHandleProps}>
                                <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                              </span>
                              <span>{category.name}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="bg-gray-600 text-gray-300 px-2 py-1 rounded-full text-xs"> {/* Themed count span */}
                                {(category.itemIds || []).length}
                              </span>
                            </div>
                          </li>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>

          <button
            onClick={() => setIsAddCategoryModalOpen(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500" // Themed Add Category button
          >
            <Plus className="h-5 w-5" />
            Add Category
          </button>
        </>
      )}

      {activeTab === 'combos' && (
        <>
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">Combos</h2>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="combos">
              {(provided) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex-grow"
                >
                  {comboCategories.map((category, index) => {
                    if (!category || !category._id) return null;

                    return (
                      <Draggable
                        key={category._id}
                        draggableId={category._id}
                        index={index}
                      >
                        {(provided) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            onClick={() => onCategorySelect(category)}
                            className="flex items-center justify-between p-2 rounded-md bg-gray-800 hover:bg-gray-700 cursor-pointer select-none mb-2" // Themed list item
                          >
                            <div className="flex items-center gap-2">
                              <span {...provided.dragHandleProps}>
                                <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                              </span>
                              <span>{category.name} (Combo)</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenComboBuilder(category);
                                }}
                                className="p-1 bg-gray-700 hover:bg-gray-600 rounded-full text-white" // Themed edit button
                              >
                                <Pencil size={16} />
                              </button>
                              <span className="bg-gray-600 text-gray-300 px-2 py-1 rounded-full text-xs"> {/* Themed count span */}
                                {(category.itemIds || []).length}
                              </span>
                            </div>
                          </li>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>

          <button
            onClick={() => setIsComboBuilderModalOpen(true)} // Open ComboBuilderModal for new combo
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500" // Themed Add Combo button
          >
            <Plus className="h-5 w-5" />
            Add Combo
          </button>
        </>
      )}

      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onCategoryAdded={handleAddCategory}
      />

      <ComboBuilderModal
        isOpen={isComboBuilderModalOpen}
        onClose={() => setIsComboBuilderModalOpen(false)}
        category={selectedCategory}
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
