import { Clock, Minus, Plus, Utensils } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../stores/cart.store"; // Import useCart from Zustand
import type { CartItem, MenuItem } from "../../types/types";

type MenuAppProps = {
  menuData: {
    branding: { title: string };
    categories: Array<{
      name: string;
      itemIds: string[];
      _id: string;
      isMenuCombo?: boolean;
    }>;
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

  const filteredItems = menuData.menu.filter((item) => {
    if (!item.isActive) return false;

    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const category = activeCategory
      ? menuData.categories.find((cat) => cat.name === activeCategory)
      : null;
    const matchesCategory = category
      ? category.itemIds.includes(item.itemId)
      : true;

    const matchesVeg =
      vegFilter === "all"
        ? true
        : vegFilter === "veg"
          ? item.isVegetarian
          : !item.isVegetarian;

    // ✅ Handle combos properly
    if (showComboOnly) {
      // If a specific combo is selected
      if (selectedCombo) {
        const comboCategory = menuData.categories.find(
          (cat) => cat.isMenuCombo && cat.name === selectedCombo
        );
        return comboCategory
          ? comboCategory.itemIds.includes(item.itemId)
          : false;
      }

      // ✅ If "All Combos" is selected
      const allComboItems = menuData.categories
        .filter((cat) => cat.isMenuCombo)
        .flatMap((cat) => cat.itemIds);

      return allComboItems.includes(item.itemId);
    }

    return matchesSearch && matchesCategory && matchesVeg;
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
              return (
                <div
                  key={item._id}
                  className="card card-side bg-yellow-100/15 shadow-sm rounded-2xl overflow-hidden border border-gray-300 hover:border-yellow-700 group transition-all duration-300"
                >
                  {/* Left: Image */}
                  <figure className="w-32 h-auto rounded-xl overflow-hidden shadow-md relative group-hover:shadow-lg transition-shadow">
                    {item.image ? (
                      <img
                        src={
                          "https://www.vegrecipesofindia.com/wp-content/uploads/2020/01/paneer-butter-masala-1.jpg" ||
                          item.image
                        }
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
                        {/* <span className="text-5xl opacity-40">🍽️</span> */}
                        <img src="https://www.vegrecipesofindia.com/wp-content/uploads/2020/01/paneer-butter-masala-1.jpg" />
                      </div>
                    )}
                  </figure>

                  {/* Right: Card body with details and actions */}
                  <div className="card-body p-4 lg:p-5 flex flex-col justify-between flex-1">
                    {/* Item details */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center ${
                            item.isVegetarian
                              ? "border-green-600 bg-green-50"
                              : "border-red-600 bg-red-50"
                          }`}
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              item.isVegetarian ? "bg-green-600" : "bg-red-600"
                            }`}
                          />
                        </div>
                        <h3 className="font-bold text-gray-900 text-base lg:text-lg">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2 ml-7 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-3 ml-7">
                        <span className="font-bold text-gray-900 text-lg">
                          ₹{item.price}
                        </span>
                        {item.preparationTime && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                              <Clock size={12} />
                              {item.preparationTime} mins
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Cart Buttons */}
                    <div className="mt-4 flex items-center justify-center gap-2">
                      {!itemInCart ? (
                        <button
                          onClick={() => handleShowModal(item)}
                          className="w-28 lg:w-32 px-2 py-2 bg-white border-2 border-yellow-700 text-yellow-700 rounded-xl font-bold hover:bg-yellow-800 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 text-[10px]"
                        >
                          <Plus size={10} strokeWidth={3} /> ADD
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-yellow-700 rounded-xl px-3 py-2 w-28 lg:w-32 shadow-md">
                          <button
                            onClick={() => {
                              if (itemInCart && itemInCart.quantity > 1) {
                                updateQty(
                                  itemInCart.itemId,
                                  itemInCart.quantity - 1
                                );
                              } else if (itemInCart) {
                                removeItem(itemInCart.itemId);
                              }
                            }}
                            className="text-white hover:bg-yellow-800 rounded-lg p-1 transition-colors"
                          >
                            <Minus size={18} strokeWidth={3} />
                          </button>
                          <span className="flex-1 text-center font-bold text-white text-lg">
                            {itemInCart ? itemInCart.quantity : 0}
                          </span>
                          <button
                            onClick={() => {
                              if (itemInCart) {
                                updateQty(
                                  itemInCart.itemId,
                                  itemInCart.quantity + 1
                                );
                              } else {
                                handleShowModal(item);
                              }
                            }}
                            className="text-white hover:bg-yellow-800 rounded-lg p-1 transition-colors"
                          >
                            <Plus size={18} strokeWidth={3} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
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
                  setTimeout(() => setShowSuccessPop(false), 1500);
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
