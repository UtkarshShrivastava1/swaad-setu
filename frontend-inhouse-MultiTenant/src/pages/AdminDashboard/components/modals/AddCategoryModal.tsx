import { useState } from "react";
import { fetchMenu, updateMenu } from "../../../../api/admin/menu.api";
import ModalWrapper from "./ModalWrapper";

export default function AddCategoryModal({
  isOpen,
  onClose,
  rid,
  onCategoryAdded,
}) {
  const [name, setName] = useState("");
  const [isMenuCombo, setIsMenuCombo] = useState(false);
  const [comboMeta, setComboMeta] = useState({
    originalPrice: 0,
    discountedPrice: 0,
    saveAmount: 0,
    description: "",
    image: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return alert("Please enter category name");

    setLoading(true);
    setError("");

    try {
      // 1️⃣ Fetch current menu
      const existing = await fetchMenu(rid);
      if (!existing || !existing.categories) throw new Error("Menu not found");

      // 2️⃣ Append new category
      const newCategory = {
        name,
        itemIds: [],
        isMenuCombo,
        comboMeta: isMenuCombo
          ? {
              originalPrice: comboMeta.originalPrice,
              discountedPrice: comboMeta.discountedPrice,
              saveAmount:
                comboMeta.originalPrice - comboMeta.discountedPrice || 0,
              description: comboMeta.description,
              image: comboMeta.image,
            }
          : {
              originalPrice: 0,
              discountedPrice: 0,
              saveAmount: 0,
              description: "",
              image: "",
            },
      };

      const updatedMenu = {
        ...existing,
        categories: [...existing.categories, newCategory],
      };

      // 3️⃣ Update backend
      const result = await updateMenu(rid, updatedMenu);
      console.log(result)

      if (onCategoryAdded) onCategoryAdded(newCategory);
      setSuccess(true);

      setTimeout(() => { 
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to add category");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalWrapper title="Add New Category" isOpen={isOpen} onClose={onClose}>
      {success && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 bg-white rounded-xl shadow-lg px-6 py-8 flex flex-col items-center">
            <div className="text-4xl mb-2 text-green-500">✅</div>
            <div className="font-bold text-lg text-green-700 mb-1">
              Category Added!
            </div>
            <div className="text-slate-600 text-sm">
              New category saved successfully.
            </div>
          </div>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-5 text-black">
          {error && (
            <div className="text-red-600 bg-red-50 p-2 rounded">{error}</div>
          )}

          {/* Category Name */}
          <div>
            <label className="text-sm font-medium">Category Name</label>
            <input
              type="text"
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g. Soups, Desserts"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Combo Option */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isMenuCombo}
              onChange={(e) => setIsMenuCombo(e.target.checked)}
              className="w-5 h-5 accent-yellow-500"
            />
            <label className="font-medium text-sm">Is Combo Category?</label>
          </div>

          {isMenuCombo && (
            <>
              <div>
                <label className="text-sm font-medium">Original Price</label>
                <input
                  type="number"
                  value={comboMeta.originalPrice}
                  onChange={(e) =>
                    setComboMeta({
                      ...comboMeta,
                      originalPrice: +e.target.value,
                    })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Discounted Price</label>
                <input
                  type="number"
                  value={comboMeta.discountedPrice}
                  onChange={(e) =>
                    setComboMeta({
                      ...comboMeta,
                      discountedPrice: +e.target.value,
                    })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Combo Description</label>
                <textarea
                  value={comboMeta.description}
                  onChange={(e) =>
                    setComboMeta({ ...comboMeta, description: e.target.value })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Combo Image URL</label>
                <input
                  type="url"
                  value={comboMeta.image}
                  onChange={(e) =>
                    setComboMeta({ ...comboMeta, image: e.target.value })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 rounded-md font-semibold text-black"
              disabled={loading}
            >
              {loading ? "Saving..." : "Add Category"}
            </button>
          </div>
        </form>
      )}
    </ModalWrapper>
  );
}
