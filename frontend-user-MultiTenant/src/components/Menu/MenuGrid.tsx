

import { Minus, Plus, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../stores/cart.store"; // Import useCart from Zustand
import type { CartItem, MenuItem, Category, DisplayableItem, ComboItem } from "../../types/types"; // Import new types
import { GENERIC_ITEM_IMAGE_FALLBACK } from "../../utils/constants";
import MenuCard from "./MenuCard"; // Assuming MenuCard is in the same directory
import ComboCard from "../combos/ComboCard"; // Import ComboCard
import ComboAdvertisement from "../combos/ComboAdvertisement";


type MenuAppProps = {
  menuData: {
    branding: { title: string };
    categories: Category[]; // Use the new Category type
    menu: MenuItem[];
    serviceCharge: number;
    taxes: Array<{ name: string; percent: number }>;
  };
  tableId?: string;
};

export default function RestaurantMenuApp({
  menuData,
  tableId = "5",
}: MenuAppProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [vegFilter, setVegFilter] = useState("all");
  const [showComboOnly, setShowComboOnly] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<MenuItem | null>(null); // Explicitly type modalItem
  const [selectedVariant, setSelectedVariant] = useState("half");
  const [chefNote, setChefNote] = useState("");
  const [showSuccessPop, setShowSuccessPop] = useState(false);
  const navigate = useNavigate();

  // Use Zustand store
  const { items: zustandCartItems, addItem, removeItem, updateQty } = useCart();

  const getPlatePrices = (
    item: MenuItem // This function is still needed for modal price display
  ) =>
    item && item.name === "Paneer Butter Masala"
      ? { half: 150, full: 250 }
      : { half: item.price, full: item.price * 2 };

  const handleShowModal = (item: MenuItem) => {
    setModalItem(item);
    setSelectedVariant("half");
    setChefNote("");
    setModalOpen(true);
  };

  const allDisplayableItems: DisplayableItem[] = useMemo(() => {
    const items: DisplayableItem[] = menuData.menu.map(item => ({ ...item, type: 'item' }));
    const combos: DisplayableItem[] = menuData.categories
      .filter(category => category.isMenuCombo && category.comboMeta)
      .map(comboCategory => ({
        _id: comboCategory._id,
        itemId: `combo-${comboCategory._id}`, // Unique ID for combo
        name: comboCategory.name,
        description: comboCategory.comboMeta!.description || '',
        price: comboCategory.comboMeta!.discountedPrice || 0,
        image: comboCategory.comboMeta!.image || null, // Use combo image
        isVegetarian: false, // Default, adjust if combo can be all veg
        preparationTime: null, // Default, adjust if combo has prep time
        isActive: true, // Assuming combos are active if listed
        type: 'combo',
        originalPrice: comboCategory.comboMeta!.originalPrice,
        saveAmount: comboCategory.comboMeta!.saveAmount,
        itemIds: comboCategory.itemIds, // Keep item IDs for internal use if needed
      }));
    return [...items, ...combos];
  }, [menuData]);

  const activeComboCategories = useMemo(() => {
    return menuData.categories.filter(category => category.isMenuCombo && category.comboMeta);
  }, [menuData.categories]);

  const handleViewCombo = (comboName: string) => {
    setShowComboOnly(true);
    setSelectedCombo(comboName);
    setActiveCategory(null);
  };


  const filteredItems = allDisplayableItems.filter((item) => {
    if (!item.isActive) return false;

    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
  
      let matchesCategory = true;

      if (activeCategory) {
        const category = menuData.categories.find(cat => cat.name === activeCategory);
        if (category) {
          if (item.type === 'item') {
            matchesCategory = category.itemIds.includes(item.itemId);
          } else if (item.type === 'combo') {
            // If an individual category is selected, combos should not match unless specifically selected
            matchesCategory = false;
          }
        }
      }

    const matchesVeg =
      vegFilter === "all"
        ? true
        : vegFilter === "veg"
          ? item.isVegetarian
          : !item.isVegetarian;

    if (showComboOnly) {
      if (selectedCombo) {
        // Only show the specific combo if selected
        return item.type === 'combo' && item.name === selectedCombo && matchesSearch && matchesVeg;
      }
      // Show all combos if showComboOnly is true and no specific combo selected
      return item.type === 'combo' && matchesSearch && matchesVeg;
    } else if (selectedCombo) {
      // If a specific combo is selected but showComboOnly is false, display only items in that combo
      const comboCategory = menuData.categories.find(
        (cat) => cat.isMenuCombo && cat.name === selectedCombo
      );
      if (comboCategory) {
        return item.type === 'item' && comboCategory.itemIds.includes(item.itemId) && matchesSearch && matchesVeg;
      }
      return false; // Should not happen if selectedCombo is valid
    }


    return matchesSearch && matchesCategory && matchesVeg && item.type === 'item';
  });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 pb-32">
      {showSuccessPop && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl px-10 py-8 flex flex-col items-center animate-in fade-in scale-in">
            <div className="text-green-500 mb-2 animate-bounce">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#22c55e" />
                <path
                  d="M7 13l3 3 5-5"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-green-600 mb-1">
              Added to Cart!
            </h2>
            <p className="text-sm text-gray-600 text-center">
              Your item was added successfully.
            </p>
          </div>
        </div>
      )}

      <div className="bg-[#ffbe00] shadow-lg py-3">
        <div className="max-w-screen-lg mx-auto flex flex-row items-center justify-between gap-2 px-2 sm:px-4">
          <h1 className="text-black text-base font-bold tracking-tight flex-shrink-0">
            Menu
          </h1>
          <div className="flex flex-row flex-nowrap items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1 bg-black px-2 py-1 md:px-3 rounded-full shadow">
              <span className="font-medium text-[11px] md:text-[14px] text-[#ffbe00]">
                Table {tableId}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-black px-2 py-1 md:px-3 rounded-full shadow">
              <span className="font-medium text-[11px] md:text-[14px] text-[#ffbe00]">
                30-40 mins
              </span>
            </div>
          </div>
        </div>
        <div className="max-w-screen-md mx-auto w-full mt-2 px-2 sm:px-4">
          <div className="flex items-center justify-between gap-2 mt-3 sm:mt-7 bg-base-200 rounded-2xl py-1 px-1 shadow w-full max-w-md mx-auto">
            <div className="flex items-center flex-grow bg-base-200 rounded-lg px-3">
              <input
                type="text"
                className="input input-md w-full border-none text-sm px-2 py-1 focus:outline-none text-[#ffbe00]"
                placeholder="Search for dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-500 hover:text-gray-600 px-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 bg-base-100 border rounded-lg px-2 py-2">
              <label className="text-[10px] font-medium text-[#ffbe00] hidden sm:block">
                Filter:
              </label>
              <select
                value={vegFilter}
                onChange={(e) => setVegFilter(e.target.value)}
                className="bg-base-100 text-[11px] sm:text-xs font-medium text-[#ffbe00] focus:outline-none"
              >
                <option value="all">All</option>
                <option value="veg">Veg</option>
                <option value="non-veg">Non-Veg</option>
              </select>
            </div>
          </div>
        </div>
        <div className="max-w-screen-lg mx-auto w-full px-2 sm:px-4 mt-3">
          <div className="px-4 py-1.5 pt-2 pb-1 flex gap-2 overflow-x-auto scrollbar-hide mt-2">
            <button
              onClick={() => {
                setActiveCategory(null);
                setShowComboOnly(false);
                setSelectedCombo(null);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${!activeCategory && !showComboOnly ? "bg-yellow-500 text-white" : "bg-base-100 text-[#ffbe00] hover:bg-black/60 hover:text-white"}`}
            >
              All Items
            </button>
            <button
              onClick={() => {
                setShowComboOnly(true);
                setSelectedCombo(null);
                setActiveCategory(null);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${showComboOnly && !selectedCombo ? "bg-yellow-500 text-white" : "bg-base-100 text-[#ffbe00] hover:bg-black/60 hover:text-white"}`}
            >
              All Combos
            </button>
            {menuData.categories.map((category) => (
              <button
                key={category._id}
                onClick={() => {
                  if (category.isMenuCombo) {
                    setShowComboOnly(true);
                    setSelectedCombo(category.name);
                    setActiveCategory(null);
                  } else {
                    setActiveCategory(category.name);
                    setShowComboOnly(false);
                    setSelectedCombo(null);
                  }
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${activeCategory === category.name || selectedCombo === category.name ? "bg-yellow-500 text-white" : "bg-base-100 text-[#ffbe00] hover:bg-black/60 hover:text-white"}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ComboAdvertisement comboCategories={activeComboCategories} onViewCombo={handleViewCombo} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Utensils size={40} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">No items found</p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
            {filteredItems.map((item) => {
              const itemInCart = zustandCartItems.find(
                (cartItem) => cartItem.itemId === item.itemId
              );

              // Function to handle adding items to cart (for both MenuCard and ComboCard)
              const handleAddItemToCart = (itemToAdd: MenuItem | ComboItem) => {
                if (itemToAdd.type === 'combo') {
                  const comboCartItem: CartItem = {
                    itemId: itemToAdd.itemId,
                    name: itemToAdd.name,
                    price: itemToAdd.price,
                    quantity: 1,
                    variant: 'combo',
                    notes: itemToAdd.description,
                  };
                  addItem(comboCartItem);
                } else {
                  // For regular menu items, still show modal for variants
                  handleShowModal(itemToAdd as MenuItem);
                }
                setShowSuccessPop(true);
                setTimeout(() => setShowSuccessPop(false), 500);
              };

              if (item.type === 'combo') {
                return (
                  <ComboCard
                    key={item.itemId}
                    combo={item as ComboItem}
                    onAdd={() => handleAddItemToCart(item)}
                  />
                );
              } else {
                return (
                  <MenuCard
                    key={item.itemId}
                    item={item as MenuItem}
                    onAdd={(itemToAdd) => handleAddItemToCart(itemToAdd)}
                  />
                );
              }
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && modalItem && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs mx-auto p-6">
            <h2 className="text-lg font-bold mb-2 text-black">
              {modalItem.name}
            </h2>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSelectedVariant("half")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border ${
                  selectedVariant === "half"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-100 text-yellow-700"
                }`}
              >
                Half Plate
                <br />₹{getPlatePrices(modalItem).half}
              </button>
              <button
                onClick={() => setSelectedVariant("full")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border ${
                  selectedVariant === "full"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-100 text-yellow-700"
                }`}
              >
                Full Plate
                <br />₹{getPlatePrices(modalItem).full}
              </button>
            </div>
            <textarea
              placeholder="Add a note for the chef (e.g., less spicy)..."
              value={chefNote}
              onChange={(e) => setChefNote(e.target.value)}
              className="w-full border rounded-md px-2 py-1 text-black text-sm mb-4 focus:ring-yellow-700 focus:border-yellow-700"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const prices = getPlatePrices(modalItem);
                  const price =
                    selectedVariant === "half" ? prices.half : prices.full;
                  const newItem: CartItem = {
                    itemId: modalItem.itemId,
                    name: `${modalItem.name} (${selectedVariant === "half" ? "Half Plate" : "Full Plate"})`,
                    price,
                    quantity: 1, // Always add 1 from modal
                  };
                  addItem(newItem);
                  setModalOpen(false);
                  setShowSuccessPop(true);
                  setTimeout(() => setShowSuccessPop(false), 500);
                }}
                className="flex-1 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 font-bold"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* <FooterNav activeTab="menu" cartCount={cartCount} /> */}
    </div>
  );
}
