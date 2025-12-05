import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { updateCategory } from "../../../../api/admin/menu.api";
import ModalWrapper from "../../components/modals/ModalWrapper";

interface MenuItem {
  _id: string;
  name: string;
  price: number;
}

interface Category {
  _id: string;
  name: string;
  isMenuCombo: boolean;
  itemIds: string[];
  comboMeta?: {
    originalPrice: number;
    discountedPrice: number;
    description: string;
    image?: string | null;
  };
}

interface ComboBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  items: MenuItem[];
  onCategoryUpdate: (category: Category) => void;
  disablePortal?: boolean;
}

const ComboBuilderModal: React.FC<ComboBuilderModalProps> = ({
  isOpen,
  onClose,
  category,
  items,
  onCategoryUpdate,
  disablePortal = false,
}) => {
  const { rid } = useParams<{ rid: string }>();

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [comboPrice, setComboPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (category) {
      setSelectedItemIds(category.itemIds || []);
      setComboPrice(category.comboMeta?.discountedPrice || 0);
    }
  }, [category]);

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const totalValue = useMemo(() => {
    return selectedItemIds.reduce((total, itemId) => {
      const item = items.find((i) => i._id === itemId);
      return total + (item?.price || 0);
    }, 0);
  }, [selectedItemIds, items]);

  const savings = useMemo(
    () => totalValue - comboPrice,
    [totalValue, comboPrice]
  );

  const handleItemToggle = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rid || !category) return;

    setLoading(true);
    setError(null);

    try {
      const updatedCategory: Category = {
        ...category,
        itemIds: selectedItemIds,
        comboMeta: {
          originalPrice: totalValue,
          discountedPrice: comboPrice,
          description: selectedItemIds
            .map((id) => items.find((i) => i._id === id)?.name)
            .join(" + "),
          image: category.comboMeta?.image || null,
        },
      };

      await updateCategory(rid, updatedCategory._id, {
        itemIds: updatedCategory.itemIds,
        comboMeta: updatedCategory.comboMeta,
        name: updatedCategory.name,
        isMenuCombo: updatedCategory.isMenuCombo,
      });

      onCategoryUpdate(updatedCategory);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update combo.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !category) return null;

  return (
    <ModalWrapper
      title={`Combo Builder — ${category.name}`}
      isOpen={isOpen}
      onClose={onClose}
      disablePortal={disablePortal}
      maxWidth="max-w-5xl"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-5xl mx-auto flex h-full bg-gray-900 text-white rounded-2xl"
      >
        {/* ❌ PREMIUM CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          className="
          absolute top-4 right-4 z-50
          h-9 w-9 rounded-full
          bg-black text-yellow-400
          flex items-center justify-center
          shadow-lg hover:shadow-yellow-400/40
          hover:bg-zinc-900
          active:scale-95 transition
        "
          aria-label="Close"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 h-full gap-6">
        {/* Left Column Container */}
        <div className="flex flex-col flex-1 p-6">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-200">
              Available Items
            </h3>
            <p className="text-xs text-gray-400">Select items for this combo</p>
          </div>

          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3 w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white shadow-sm
                       focus:border-orange-400 focus:ring-orange-400"
          />

          {/* ✅ SCROLLABLE LIST */}
          <div className="flex-1 overflow-y-auto rounded-xl border border-gray-700 bg-gray-800 p-2 space-y-2">
            {filteredItems.map((item) => {
              const selected = selectedItemIds.includes(item._id);
              return (
                <label
                  key={item._id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    selected
                      ? "bg-orange-900 border-orange-700"
                      : "bg-gray-900 border-gray-700 hover:bg-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => handleItemToggle(item._id)}
                    className="h-4 w-4 text-orange-500 border-gray-500 rounded accent-orange-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-200 text-sm truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-400">₹{item.price}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Right Column Container */}
        <div className="w-96 flex flex-col shrink-0 border-l border-gray-700 bg-gray-800 p-6">
          {/* ✅ SUMMARY CONTENT (SCROLL SAFE) */}
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            <div>
              <h3 className="text-sm font-semibold text-gray-200">
                Combo Summary
              </h3>
              <p className="text-xs text-gray-400">Pricing & savings</p>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Total Item Value</span>
              <span className="font-semibold text-gray-100">₹{totalValue}</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Combo Price
              </label>
              <input
                type="number"
                value={comboPrice}
                onChange={(e) => setComboPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white
                       focus:border-orange-400 focus:ring-orange-400"
              />
            </div>

            <div className="flex justify-between items-center rounded-lg bg-gray-900 border border-gray-700 p-3">
              <span className="text-sm text-gray-300">Customer Saves</span>
              <span
                className={`text-sm font-bold ${
                  savings > 0 ? "text-emerald-500" : "text-gray-400"
                }`}
              >
                ₹{savings}
              </span>
            </div>

            {error && (
              <div className="text-xs text-red-400 font-medium">{error}</div>
            )}
          </div>

          {/* Action buttons (moved here) */}
          <div className="mt-auto pt-4 border-t border-gray-700 flex justify-end gap-3 bg-gray-900">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white
                   text-sm font-medium hover:bg-gray-600"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-orange-500 text-white
                   text-sm font-semibold shadow hover:bg-orange-600
                   disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Combo"}
            </button>
          </div>
        </div>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default ComboBuilderModal;
