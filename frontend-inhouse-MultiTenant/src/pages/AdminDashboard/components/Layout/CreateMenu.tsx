"use client";
import { useEffect, useState } from "react";
import {
  addCategory,
  addMenuItem,
  createMenu,
  deleteCategory,
  deleteMenuItem,
  fetchMenu,
  restoreMenuItem,
} from "../../../../api/admin/menu.api";

export default function MenuBuilder({ onClose }) {
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    name: "",
    description: "",
    price: "",
    isVegetarian: false,
  });
  const [currentCategory, setCurrentCategory] = useState({
    name: "",
    isMenuCombo: false,
    itemIds: [] as string[],
  });

  const restaurantId = import.meta.env.VITE_RID || "";

  /* ---------------------------------------------------------------------- */
  // Load existing menu on mount
  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      try {
        const data = await fetchMenu(restaurantId);
        if (data.menu) setItems(data.menu);
        if (data.categories) setCategories(data.categories);
        if (data.branding?.title) setTitle(data.branding.title);
      } catch (err) {
        console.warn("No existing menu found. Create a new one.");
      }
    })();
  }, [restaurantId]);

  /* ---------------------------------------------------------------------- */
  // Add a new item locally & via API
  const handleAddItem = async () => {
    if (!currentItem.name || !currentItem.price)
      return alert("Enter item name and price");
    try {
      const itemPayload = {
        ...currentItem,
        price: parseFloat(currentItem.price),
      };
      setLoading(true);
      const res = await addMenuItem(restaurantId, itemPayload);
      setItems((prev) => [...prev, res.item]);
      setCurrentItem({
        name: "",
        description: "",
        price: "",
        isVegetarian: false,
      });
    } catch (err) {
      console.error("Add item error:", err);
      alert("Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  // Delete item (soft delete)
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to hide this item?")) return;
    await deleteMenuItem(restaurantId, itemId, true);
    setItems((prev) =>
      prev.map((it) => (it.itemId === itemId ? { ...it, isActive: false } : it))
    );
  };

  // Restore item
  const handleRestoreItem = async (itemId: string) => {
    await restoreMenuItem(restaurantId, itemId);
    setItems((prev) =>
      prev.map((it) => (it.itemId === itemId ? { ...it, isActive: true } : it))
    );
  };

  /* ---------------------------------------------------------------------- */
  // Add new category
  const toggleItemInCategory = (itemId: string) => {
    setCurrentCategory((prev) => {
      const updated = prev.itemIds.includes(itemId)
        ? prev.itemIds.filter((id) => id !== itemId)
        : [...prev.itemIds, itemId];
      return { ...prev, itemIds: updated };
    });
  };

  const handleAddCategory = async () => {
    if (!currentCategory.name) return alert("Enter category name");
    try {
      const res = await addCategory(restaurantId, currentCategory);
      setCategories((prev) => [...prev, res.category || currentCategory]);
      setCurrentCategory({ name: "", isMenuCombo: false, itemIds: [] });
    } catch (err) {
      console.error("Add category error:", err);
      alert("Failed to add category");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Delete this category?")) return;
    await deleteCategory(restaurantId, categoryId);
    setCategories((prev) => prev.filter((c) => c._id !== categoryId));
  };

  /* ---------------------------------------------------------------------- */
  // Save all changes (bulk)
  const handleSaveMenu = async () => {
    if (!title) return alert("Enter menu title");
    try {
      setLoading(true);
      const taxes = [{ name: "GST", percent: 5 }];
      const serviceCharge = 0;
      const branding = { title };

      await createMenu(restaurantId, {
        menu: items,
        categories,
        taxes,
        serviceCharge,
        branding,
      });

      alert("✅ Menu saved successfully!");
    } catch (err) {
      console.error("Save menu error:", err);
      alert("❌ Failed to save menu");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  return (
    <div className="min-h-screen p-8 bg-white rounded-3xl shadow-xl mt-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 relative">
        <h1 className="text-4xl font-extrabold text-amber-600 mb-2">
          🍽️ Admin Menu Manager
        </h1>
        <p className="text-lg opacity-80 text-amber-500 font-medium">
          Manage your restaurant’s menu, items & categories
        </p>
        <button
          onClick={() => onClose && onClose()}
          className="absolute top-0 right-0 text-amber-600 hover:text-amber-800"
        >
          ✖
        </button>
      </div>

      {/* Branding */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Branding</h2>
        <input
          type="text"
          placeholder="Menu Title"
          className="input input-bordered w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </section>

      {/* Add Item */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Menu Items</h2>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Name"
            className="input input-bordered"
            value={currentItem.name}
            onChange={(e) =>
              setCurrentItem({ ...currentItem, name: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Price"
            className="input input-bordered"
            value={currentItem.price}
            onChange={(e) =>
              setCurrentItem({ ...currentItem, price: e.target.value })
            }
          />
          <textarea
            placeholder="Description"
            className="textarea textarea-bordered"
            value={currentItem.description}
            onChange={(e) =>
              setCurrentItem({ ...currentItem, description: e.target.value })
            }
          />
          <label>
            <input
              type="checkbox"
              checked={currentItem.isVegetarian}
              onChange={(e) =>
                setCurrentItem({
                  ...currentItem,
                  isVegetarian: e.target.checked,
                })
              }
            />{" "}
            Vegetarian
          </label>

          <button onClick={handleAddItem} className="btn btn-primary">
            ➕ Add Item
          </button>
        </div>

        {items.length > 0 && (
          <div className="mt-5 border-t pt-4">
            <h3 className="font-semibold mb-3">Items</h3>
            <ul className="space-y-2">
              {items.map((it) => (
                <li
                  key={it.itemId}
                  className={`flex justify-between items-center ${
                    !it.isActive ? "opacity-50" : ""
                  }`}
                >
                  <span>
                    {it.name} – ₹{it.price}{" "}
                    {it.isVegetarian && (
                      <span className="text-green-600 font-bold">(Veg)</span>
                    )}
                  </span>
                  <div className="space-x-2">
                    {it.isActive ? (
                      <button
                        onClick={() => handleDeleteItem(it.itemId)}
                        className="btn btn-xs btn-error"
                      >
                        Hide
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestoreItem(it.itemId)}
                        className="btn btn-xs btn-success"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Categories</h2>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Category name"
            className="input input-bordered flex-1"
            value={currentCategory.name}
            onChange={(e) =>
              setCurrentCategory({ ...currentCategory, name: e.target.value })
            }
          />
          <button onClick={handleAddCategory} className="btn btn-secondary">
            ➕ Add Category
          </button>
        </div>

        {categories.map((cat) => (
          <div
            key={cat._id || cat.name}
            className="border p-3 rounded-md mb-2 flex justify-between items-center"
          >
            <span>
              {cat.name} {cat.isMenuCombo && "(Combo)"} (
              {cat.itemIds?.length || 0} items)
            </span>
            <button
              onClick={() => handleDeleteCategory(cat._id)}
              className="btn btn-xs btn-error"
            >
              Delete
            </button>
          </div>
        ))}
      </section>

      {/* Save */}
      <div className="text-right mt-8">
        <button
          onClick={handleSaveMenu}
          className={`btn btn-accent ${loading ? "loading" : ""}`}
        >
          {loading ? "Saving..." : "💾 Save Menu"}
        </button>
      </div>
    </div>
  );
}
