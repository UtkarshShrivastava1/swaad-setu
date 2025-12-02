import { Flame, Leaf, Trash2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  addMenuItem,
  deleteMenuItem,
  updateMenuItem,
} from "../../../../api/admin/menu.api";

interface AddItemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category: { _id: string; name: string } | null;
  item: any | null;
  onItemAdded: (item: any) => void;
  onItemUpdated: (item: any) => void;
}

const AddItemDrawer: React.FC<AddItemDrawerProps> = ({
  isOpen,
  onClose,
  category,
  item,
  onItemAdded,
  onItemUpdated,
}) => {
  const { rid } = useParams<{ rid: string }>();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isVeg, setIsVeg] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [spiceLevel, setSpiceLevel] = useState(0);
  const [prepTime, setPrepTime] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMetadataCollapsed, setIsMetadataCollapsed] = useState(true);

  /* ================= PREFILL ================= */

  useEffect(() => {
    if (item) {
      setName(item.name);
      setPrice(String(item.price));
      setDescription(item.description || "");
      setIsVeg(item.isVegetarian);
      setIsActive(item.isActive);
      setSpiceLevel(item.metadata?.spiceLevel || 0);
      setPrepTime(String(item.metadata?.prepTime || ""));
      setImagePreview(item.image || null);
      setImageFile(null);
    } else {
      setName("");
      setPrice("");
      setDescription("");
      setIsVeg(true);
      setIsActive(true);
      setSpiceLevel(0);
      setPrepTime("");
      setImageFile(null);
      setImagePreview(null);
    }
  }, [item]);

  /* ================= IMAGE ================= */

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rid || !category) return;

    setLoading(true);
    setError(null);

    const payload = {
      item: {
        name,
        price: parseFloat(price),
        description,
        isVegetarian: isVeg,
        isActive,
        category: category.name, // ✅ BACKEND EXPECTS NAME
        metadata: {
          spiceLevel,
          prepTime: parseInt(prepTime || "0", 10),
        },
      },
    };

    try {
      if (item) {
        const res = await updateMenuItem(
          rid,
          item.itemId,
          payload,
          imageFile || undefined
        );

        onItemUpdated(res.data?.item || res.data);
      } else {
        const res = await addMenuItem(rid, payload, imageFile || undefined);

        onItemAdded(res.data?.item || res.data);
      }

      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err.message ||
          `Failed to ${item ? "update" : "add"} item`
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async () => {
    if (!rid || !item) return;
    if (!window.confirm("Delete this item?")) return;

    try {
      await deleteMenuItem(rid, item.itemId);
      onItemUpdated({ ...item, isActive: false });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to delete item");
    }
  };

  if (!isOpen) return null;

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-gray-900 shadow-xl text-white">
        <div className="p-6 h-full flex flex-col">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-yellow-400">
              {item ? "Edit Item" : "Add Item"} — {category?.name}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-700 text-gray-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
            <div className="flex-grow overflow-y-auto pr-4">
              {/* IMAGE PICKER */}
              <div className="relative w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-400 overflow-hidden bg-gray-800">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />

                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover pointer-events-none"
                  />
                ) : (
                  <p className="pointer-events-none text-gray-300">Click to select image</p>
                )}
              </div>

              {/* FIELDS */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-2 p-2 border border-gray-600 rounded bg-gray-800 text-white focus:border-yellow-500 focus:ring-yellow-500"
                  required
                />

                <input
                  type="number"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="p-2 border border-gray-600 rounded bg-gray-800 text-white focus:border-yellow-500 focus:ring-yellow-500"
                  required
                />

                <textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-2 p-2 border border-gray-600 rounded bg-gray-800 text-white focus:border-yellow-500 focus:ring-yellow-500"
                />
              </div>

              {/* TOGGLES */}
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-2">
                  <Leaf
                    className={isVeg ? "text-green-500" : "text-gray-400"}
                  />
                  <span>Vegetarian</span>
                  <input
                    type="checkbox"
                    checked={isVeg}
                    onChange={(e) => setIsVeg(e.target.checked)}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-600 rounded"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span>Active</span>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-600 rounded"
                  />
                </div>
              </div>

              {/* METADATA */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setIsMetadataCollapsed(!isMetadataCollapsed)}
                  className="w-full text-left font-semibold text-yellow-400 hover:text-yellow-500"
                >
                  Metadata
                </button>

                {!isMetadataCollapsed && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Flame />
                      <span>Spice</span>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        value={spiceLevel}
                        onChange={(e) => setSpiceLevel(Number(e.target.value))}
                      />
                    </div>

                    <input
                      type="number"
                      placeholder="Prep Time"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      className="p-2 border border-gray-600 rounded bg-gray-800 text-white focus:border-yellow-500 focus:ring-yellow-500"
                    />
                  </div>
                )}
              </div>

              {error && <div className="text-red-500 mt-4">{error}</div>}
            </div>

            {/* FOOTER */}
            <div className="mt-6 flex justify-between items-center">
              {item && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-md bg-red-500 text-white flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Item
                </button>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm hover:bg-gray-600 focus:outline-none"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-black bg-yellow-400 border border-transparent rounded-md shadow-sm hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  {loading
                    ? item
                      ? "Updating..."
                      : "Adding..."
                    : item
                    ? "Update Item"
                    : "Add Item"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddItemDrawer;
