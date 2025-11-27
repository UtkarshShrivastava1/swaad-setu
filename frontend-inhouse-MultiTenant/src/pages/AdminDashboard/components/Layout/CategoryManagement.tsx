import { useEffect, useState } from "react";
import { FiChevronLeft, FiEdit2, FiPlusCircle, FiTrash2 } from "react-icons/fi";
import {
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "../../../../api/admin/menu.api";
import AddCategoryModal from "../modals/AddCategoryModal";
import { useTenant } from "../../../../context/TenantContext";

export default function CategoryManagement({ onBack }) {
  const { rid } = useTenant();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAddCategory, setOpenAddCategory] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [editedName, setEditedName] = useState("");

  async function loadCategories() {
    if (!rid) return;
    try {
      setLoading(true);
      const data = await fetchCategories(rid);
      setCategories(data.categories || []);
    } catch (err) {
      console.error("❌ Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(_id, catName) {
    if (!rid) return;
    if (!confirm(`Delete category "${catName}"?`)) return;
    try {
      const category = categories.find((c) => c.name === catName);
      if (!category || !category._id) {
        alert("Invalid category reference.");
        return;
      }
      await deleteCategory(rid, category._id, false);
      setCategories((prev) => prev.filter((c) => c.name !== catName));
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert("Failed to delete category.");
    }
  }

  async function handleUpdate(catId) {
    if (!rid) return;
    const category = categories.find((c) => c._id === catId);
    if (!category) return;
    if (!editedName.trim()) {
      alert("Category name cannot be empty.");
      return;
    }
    if (editedName === category.name) {
      // No change, just close editor
      setEditCategory(null);
      return;
    }
    try {
      await updateCategory(rid, catId, { name: editedName.trim() });
      setCategories((prev) =>
        prev.map((c) =>
          c._id === catId ? { ...c, name: editedName.trim() } : c
        )
      );
      setEditCategory(null);
    } catch (err) {
      console.error("❌ Update failed:", err);
      alert("Failed to update category.");
    }
  }

  useEffect(() => {
    loadCategories();
  }, [rid]);

  return (
    <div className="w-full max-w-5xl mx-auto bg-white shadow-xl rounded-3xl mt-8 p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-gray-600 hover:text-black"
          >
            <FiChevronLeft /> Back
          </button>
        </div>
        <div className="text-center items-center ">
          <h2 className="text-2xl  font-bold text-gray-800">
            🗂️ Category Management
          </h2>
        </div>

        <button
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 transition-transform"
          onClick={() => setOpenAddCategory(true)}
        >
          <FiPlusCircle /> Add Category
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-8">Loading categories...</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No categories found. Create one!
        </p>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-all"
            >
              {editCategory === cat._id ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="input input-neutral bg-white text-black
                     border border-gray-300 rounded-md px-3 py-1 flex-grow"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditCategory(null)}
                      className="btn btn-outline hover:bg-gray-300 text-gray-500 hover:text-black"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdate(cat._id)}
                      disabled={!editedName.trim() || editedName === cat.name}
                      className={`btn btn-outline text-black ${
                        !editedName.trim() || editedName === cat.name
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-300"
                      }`}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="font-bold text-gray-800">{cat.name}</h3>
                    <p className="text-sm text-gray-500">
                      {cat.itemCount ?? 0} items
                      {cat.isMenuCombo && " • Combo"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditCategory(cat._id);
                        setEditedName(cat.name);
                      }}
                      className="btn flex items-center gap-1 btn-outline p-2 rounded-lg hover:bg-yellow-400 text-black hover:text-white cursor-pointer"
                    >
                      <FiEdit2 /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id, cat.name)}
                      className="btn flex items-center gap-1 btn-outline p-2 rounded-lg text-black hover:text-white cursor-pointer hover:bg-red-500"
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <AddCategoryModal
        isOpen={openAddCategory}
        onClose={() => {
          setOpenAddCategory(false);
          loadCategories(); // refresh after add
        }}
        rid={rid}
        onCategoryAdded={(cat) => setCategories((prev) => [...prev, cat])}
      />
    </div>
  );
}
