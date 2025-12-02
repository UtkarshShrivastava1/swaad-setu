import { useState, useEffect } from "react";
import { getMenu, addMenuItem } from "../../../../api/admin/menu.api";
import ModalWrapper from "./ModalWrapper";

interface Category {
  _id: string;
  name: string;
}

export default function AddMenuItemModal({
  isOpen,
  onClose,
  rid,
  onItemAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  rid: string;
  onItemAdded: (item: any) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [isVegetarian, setIsVegetarian] = useState(true);
  const [preparationTime, setPreparationTime] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function getCategories() {
      if (!rid) return;
      try {
        const data = (await getMenu(rid)) as any;
        setCategories(data.categories || []);
        if (data.categories?.length > 0) {
          setCategory(data.categories[0]._id);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    }
    if (isOpen) {
      getCategories();
    }
  }, [isOpen, rid]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || price <= 0)
      return alert("Please enter item name and price");

    setLoading(true);
    setError("");

    try {
      const itemData = {
        name,
        description,
        price,
        category,
        isVegetarian,
        preparationTime,
      };

      const res = (await addMenuItem(rid, itemData, imageFile || undefined)) as any;
      if (onItemAdded) onItemAdded(res.item);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalWrapper title="Add New Menu Item" isOpen={isOpen} onClose={onClose}>
      {success && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 bg-white rounded-xl shadow-lg px-6 py-8 flex flex-col items-center">
            <div className="text-4xl mb-2 text-green-500">✅</div>
            <div className="font-bold text-lg text-green-700 mb-1">
              Item Added!
            </div>
            <div className="text-slate-600 text-sm">
              New item saved successfully.
            </div>
          </div>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          {error && (
            <div className="text-red-600 bg-red-50 p-2 rounded">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g. Paneer Butter Masala"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Price</label>
              <input
                type="number"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g. Creamy and rich tomato-based gravy"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files ? setImageFile(e.target.files[0]) : null
              }
              className="mt-1 w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <select
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Preparation Time (min)</label>
              <input
                type="number"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                value={preparationTime}
                onChange={(e) => setPreparationTime(parseInt(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={isVegetarian}
                onChange={(e) => setIsVegetarian(e.target.checked)}
                className="w-5 h-5 accent-yellow-500"
              />
              <label className="font-medium text-sm">Is Vegetarian?</label>
            </div>
          </div>
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
              {loading ? "Saving..." : "Add Item"}
            </button>
          </div>
        </form>
      )}
    </ModalWrapper>
  );
}