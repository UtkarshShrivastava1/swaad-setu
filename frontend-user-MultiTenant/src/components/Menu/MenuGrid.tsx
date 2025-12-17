import { Minus, Plus, Utensils, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useCart } from "../../stores/cart.store";
import type {
  CartItem,
  Category,
  ComboItem,
  DisplayableItem,
  MenuItem,
} from "../../types/types";
import ComboAdvertisement from "../combos/ComboAdvertisement";
import ComboCard from "../combos/ComboCard";
import MenuCard from "./MenuCard";

type MenuAppProps = {
  menuData: {
    branding: { title: string };
    categories: Category[];
    menu: MenuItem[];
    serviceCharge: number;
    taxes: Array<{ name: string; percent: number }>;
  };
};

export default function RestaurantMenuApp({ menuData }: MenuAppProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [vegFilter, setVegFilter] = useState("all");
  const [showComboOnly, setShowComboOnly] = useState(false);
  const [showChefSpecialOnly, setShowChefSpecialOnly] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<string | null>(null);
  const [showSuccessPop, setShowSuccessPop] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [chefNote, setChefNote] = useState("");
  const [modalQuantity, setModalQuantity] = useState(1);

  const { addItem } = useCart();

  const handleShowModal = (item: MenuItem) => {
    setModalItem(item);
    setChefNote("");
    setModalQuantity(1);
    setModalOpen(true);
  };

  const handleAddItemToCart = (itemToAdd: MenuItem | ComboItem) => {
    if (itemToAdd.type === "combo") {
      addItem({
        itemId: itemToAdd.itemId,
        name: itemToAdd.name,
        price: itemToAdd.price,
        quantity: 1,
        variant: "combo",
        notes: (itemToAdd as ComboItem).description,
        image: itemToAdd.image,
      });
      setShowSuccessPop(true);
      setTimeout(() => setShowSuccessPop(false), 600);
    } else {
      handleShowModal(itemToAdd as MenuItem);
    }
  };

  /* ================= DISPLAYABLE ITEMS ================= */

  const allDisplayableItems: DisplayableItem[] = useMemo(() => {
    const items: DisplayableItem[] = menuData.menu.map((item) => ({
      ...item,
      type: "item",
    }));

    const combos: DisplayableItem[] = menuData.categories
      .filter((category) => category.isMenuCombo && category.comboMeta)
      .map((comboCategory) => ({
        _id: comboCategory._id,
        itemId: comboCategory._id,
        name: comboCategory.name,
        description: comboCategory.comboMeta!.description || "",
        price: comboCategory.comboMeta!.discountedPrice || 0,
        image: comboCategory.comboMeta!.image || null,
        isVegetarian: false,
        preparationTime: null,
        isActive: true,
        type: "combo",
        originalPrice: comboCategory.comboMeta!.originalPrice,
        saveAmount: comboCategory.comboMeta!.saveAmount,
        itemIds: comboCategory.itemIds,
      }));

    return [...items, ...combos];
  }, [menuData]);

  const activeComboCategories = useMemo(() => {
    return menuData.categories.filter(
      (category) => category.isMenuCombo && category.comboMeta
    );
  }, [menuData.categories]);

  const handleViewCombo = (comboName: string) => {
    setShowComboOnly(true);
    setSelectedCombo(comboName);
    setActiveCategory(null);
  };

  /* ================= FILTER ================= */

  const filteredItems = allDisplayableItems.filter((item) => {
    if (!item.isActive) return false;

    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesVeg =
      vegFilter === "all"
        ? true
        : vegFilter === "veg"
          ? item.isVegetarian
          : !item.isVegetarian;

    if (showChefSpecialOnly) {
      if (item.type !== "item") return false;
      let parsedMeta: Record<string, any> | null = null;
      const metadata = (item as MenuItem).metadata;
      if (metadata) {
        if (typeof metadata === "string") {
          try {
            parsedMeta = JSON.parse(metadata);
          } catch (e) {
            parsedMeta = null;
          }
        } else {
          parsedMeta = metadata;
        }
      }
      return !!parsedMeta?.chefSpecial && matchesSearch && matchesVeg;
    }

    let matchesCategory = true;

    if (activeCategory) {
      const category = menuData.categories.find(
        (cat) => cat.name === activeCategory
      );
      if (category) {
        if (item.type === "item") {
          matchesCategory = category.itemIds.includes(item.itemId);
        } else {
          matchesCategory = false;
        }
      }
    }

    if (showComboOnly) {
      if (selectedCombo) {
        return (
          item.type === "combo" &&
          item.name === selectedCombo &&
          matchesSearch &&
          matchesVeg
        );
      }
      return item.type === "combo" && matchesSearch && matchesVeg;
    } else if (selectedCombo) {
      const comboCategory = menuData.categories.find(
        (cat) => cat.isMenuCombo && cat.name === selectedCombo
      );
      if (comboCategory) {
        return (
          item.type === "item" &&
          comboCategory.itemIds.includes(item.itemId) &&
          matchesSearch &&
          matchesVeg
        );
      }
      return false;
    }

    return (
      matchesSearch && matchesCategory && matchesVeg && item.type === "item"
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black pb-40 text-white">
      {/* ================= SUCCESS POP ================= */}
      {showSuccessPop && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="bg-gray-900 rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center animate-in fade-in zoom-in border border-white/10">
            <div className="mb-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                ✓
              </div>
            </div>
            <h2 className="text-lg font-bold text-emerald-400 mb-1">
              Added to cart
            </h2>
            <p className="text-sm text-gray-400">Enjoy your meal 😋</p>
          </div>
        </div>
      )}

      {/* ================= DARK HEADER ================= */}
      <div className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl shadow-lg border-b border-white/10">
        <div className="my-4 px-4">
          <ComboAdvertisement
            comboCategories={activeComboCategories}
            onViewCombo={handleViewCombo}
          />
        </div>

        {/* SEARCH + FILTER */}
        <div className="max-w-2xl mx-auto px-4 pb-3 mt-4">
          <div className="flex items-center gap-2 bg-gray-900 rounded-xl p-2 border border-white/10">
            <input
              type="text"
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
              placeholder="Search for dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X size={16} className="text-gray-400" />
              </button>
            )}

            <select
              value={vegFilter}
              onChange={(e) => setVegFilter(e.target.value)}
              className="bg-black rounded-lg px-2 py-1 text-xs font-semibold text-yellow-400 border border-white/10"
            >
              <option value="all">All</option>
              <option value="veg">Veg</option>
              <option value="non-veg">Non-Veg</option>
            </select>
          </div>
        </div>

        {/* CATEGORY CHIPS */}
        <div className="max-w-7xl mx-auto px-4 pb-3 overflow-x-auto flex gap-2 scrollbar-hide">
          <button
            onClick={() => {
              setActiveCategory(null);
              setShowComboOnly(false);
              setSelectedCombo(null);
              setShowChefSpecialOnly(false);
            }}
            className={`px-4 py-1 rounded-full text-xs font-semibold border ${
              !activeCategory && !showComboOnly && !showChefSpecialOnly
                ? "bg-yellow-500 text-black border-yellow-500"
                : "bg-gray-900 text-gray-300 border-white/10"
            }`}
          >
            All Items
          </button>

          <button
            onClick={() => {
              setShowComboOnly(true);
              setSelectedCombo(null);
              setActiveCategory(null);
              setShowChefSpecialOnly(false);
            }}
            className={`px-4 py-1 rounded-full text-xs font-semibold border ${
              showComboOnly && !selectedCombo
                ? "bg-yellow-500 text-black border-yellow-500"
                : "bg-gray-900 text-gray-300 border-white/10"
            }`}
          >
            All Combos
          </button>

          <button
            onClick={() => {
              setShowChefSpecialOnly(true);
              setActiveCategory(null);
              setShowComboOnly(false);
              setSelectedCombo(null);
            }}
            className={`px-4 py-1 rounded-full text-xs font-semibold border ${
              showChefSpecialOnly
                ? "bg-yellow-500 text-black border-yellow-500"
                : "bg-gray-900 text-gray-300 border-white/10"
            }`}
          >
            ⭐ Chef's Special
          </button>

          {menuData.categories
            .filter((category) => !category.isMenuCombo)
            .map((category) => (
              <button
                key={category._id}
                onClick={() => {
                  setActiveCategory(category.name);
                  setShowComboOnly(false);
                  setSelectedCombo(null);
                  setShowChefSpecialOnly(false);
                }}
                className={`px-4 py-1 rounded-full text-xs font-semibold border ${
                  activeCategory === category.name
                    ? "bg-yellow-500 text-black border-yellow-500"
                    : "bg-gray-900 text-gray-300 border-white/10"
                }`}
              >
                {category.name}
              </button>
            ))}
        </div>
      </div>

      {/* ================= GRID ================= */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Utensils size={40} className="text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg">No items found</p>
            <p className="text-gray-500 text-sm mt-2">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              if (item.type === "combo") {
                return (
                  <ComboCard
                    key={`combo-${item.itemId}`}
                    combo={item as ComboItem}
                    onAdd={() => handleAddItemToCart(item)}
                  />
                );
              }

              return (
                <MenuCard
                  key={`item-${item.itemId}`}
                  item={item as MenuItem}
                  onAdd={() => handleAddItemToCart(item)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ================= DARK MODAL FOR NOTES ================= */}
      {modalOpen && modalItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-3">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/10 animate-in zoom-in">
            <h2 className="text-lg font-black mb-3 text-yellow-400">
              {modalItem.name}
            </h2>

            <textarea
              placeholder="Note for the chef... e.g., make it extra spicy"
              value={chefNote}
              onChange={(e) => setChefNote(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm mb-4 text-white placeholder-gray-500"
            />

            {/* START: Quantity Controls */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-300">
                Quantity
              </span>
              <div className="flex items-center gap-2 bg-gray-800 rounded-xl p-1 border border-white/10">
                <button
                  onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-white hover:bg-yellow-500 hover:text-black transition-all duration-200"
                >
                  <Minus size={16} />
                </button>
                <span className="px-4 text-base font-bold text-white min-w-[2rem] text-center">
                  {modalQuantity}
                </span>
                <button
                  onClick={() => setModalQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-white hover:bg-yellow-500 hover:text-black transition-all duration-200"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            {/* END: Quantity Controls */}

            <div className="flex gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-300 border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const newItem: CartItem = {
                    itemId: modalItem.itemId,
                    name: modalItem.name,
                    price: modalItem.price,
                    quantity: modalQuantity,
                    notes: chefNote,
                    image: modalItem.image,
                  };

                  addItem(newItem);
                  setModalOpen(false);
                  setShowSuccessPop(true);
                  setTimeout(() => setShowSuccessPop(false), 600);
                }}
                className="flex-1 py-2 rounded-lg bg-yellow-500 text-black font-bold"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
