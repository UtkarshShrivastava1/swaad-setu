"use client";
import { useEffect, useState } from "react";
import { FiEdit2, FiEye, FiEyeOff } from "react-icons/fi";
import {
  deleteMenuItem,
  fetchMenu,
  restoreMenuItem,
} from "../../../../api/admin/menu.api";
import CreateMenu from "./CreateMenu";
import FooterNav from "./Footer";
// import HeroSection from "./MenuHero";
// Import PBM.webp correctly as a direct path from public folder
// import PBM from "/PBM.webp"; // Corrected path

import { useTenant } from "../../../../context/TenantContext";

export default function MenuManagement({ setActiveTab, onEdit, onCreate }) {
  const { rid } = useTenant();
  const [activeFilter, setActiveFilter] = useState("all");
  const [menuData, setMenuData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------------------------------------------------------------------- */
  // Fetch menu from backend
  const loadMenu = async () => {
    if (!rid) return;
    try {
      setLoading(true);
      const data = await fetchMenu(rid);
      if (data) {
        setMenuData(data.menu || []);
        setCategories(data.categories || []);
      } else {
        setMenuData([]);
        setCategories([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch menu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [rid]);

  /* ---------------------------------------------------------------------- */
  // Compute filters dynamically (All + categories + Hidden)
  const FILTERS = [
    { label: "All Items", key: "all" },
    ...categories.map((c) => ({
      label: c.name,
      key: c.name.toLowerCase(),
    })),
    { label: "Hidden", key: "hidden" },
  ];

  /* ---------------------------------------------------------------------- */
  // Filter logic
  const filteredMenu =
    activeFilter === "all"
      ? menuData.filter((i) => i.isActive !== false)
      : activeFilter === "hidden"
      ? menuData.filter((i) => i.isActive === false)
      : (() => {
          const category = categories.find(
            (c) => c.name.toLowerCase() === activeFilter.toLowerCase()
          );
          if (!category) return [];
          return menuData.filter((item) =>
            category.itemIds.includes(item.itemId)
          );
        })();

  /* ---------------------------------------------------------------------- */
  // Disable (soft delete)
  const handleDisable = async (itemId) => {
    if (!rid) return;
    if (!confirm("Hide this item from the menu?")) return;
    try {
      await deleteMenuItem(rid, itemId, true); // soft delete
      setMenuData((prev) =>
        prev.map((it) =>
          it.itemId === itemId ? { ...it, isActive: false } : it
        )
      );
    } catch (err) {
      console.error("❌ Failed to disable item:", err);
      alert("Failed to disable item.");
    }
  };

  // Restore hidden item
  const handleRestore = async (itemId) => {
    if (!rid) return;
    try {
      await restoreMenuItem(rid, itemId);
      setMenuData((prev) =>
        prev.map((it) =>
          it.itemId === itemId ? { ...it, isActive: true } : it
        )
      );
    } catch (err) {
      console.error("❌ Restore error:", err);
      alert("Failed to restore item.");
    }
  };

  // Edit item (navigates to Edit screen)
  const handleEdit = (itemId) => {
    const item = menuData.find((i) => i.itemId === itemId);
    if (item) {
      onEdit(item);
    }
  };

  /* ---------------------------------------------------------------------- */
  // Image resolver — fallback image
  const getItemImage = (item) => {
    if (item.image && item.image.trim() !== "") return item.image;
    // Corrected path for fallback image
    return "/PBM.webp"; // fallback placeholder
  };

  /* ---------------------------------------------------------------------- */
  // Render
  return (
    <div className="w-full flex flex-col items-center py-4 min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <div className="w-full max-w-7xl px-3 md:px-6">
        {/* Hero Section */}
        {/* <HeroSection /> */}

        {/* Menu Management Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 mt-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-7 py-4 border-b border-gray-100 gap-3 flex-wrap">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              🍽️ Menu Management
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                className="px-6 py-3 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-400 shadow-lg font-bold text-black text-lg hover:scale-105 transition-transform cursor-pointer"
                onClick={onCreate}
              >
                + Add Item
              </button>

              <button
                className="px-6 py-3 rounded-full bg-yellow-400 shadow-lg font-bold text-black text-lg hover:scale-105 transition-transform cursor-pointer flex items-center gap-2"
                onClick={() => setActiveTab("categories")}
              >
                🗂️ Category Management
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 px-7 pt-5 pb-2">
            {FILTERS.map((filt) => (
              <button
                key={filt.key}
                onClick={() => setActiveFilter(filt.key)}
                className={`px-4 py-1.5 rounded-full text-base font-bold transition-all duration-150 cursor-pointer ${
                  activeFilter === filt.key
                    ? "bg-yellow-500 text-white shadow-lg"
                    : "bg-white border border-gray-400 text-gray-700 hover:bg-yellow-100"
                }`}
              >
                {filt.label}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-7 p-7">
            {loading ? (
              <div className="col-span-full text-center py-10 text-gray-500 font-semibold">
                Loading menu...
              </div>
            ) : menuData.length === 0 ? (
              <div className="flex flex-col items-center justify-center col-span-full py-12 bg-base-100 rounded-2xl shadow-md border border-base-200">
                <div className="text-7xl mb-4 animate-bounce">🍛</div>
                <p className="text-xl text-gray-600 font-semibold mb-4 text-center">
                  No dishes found.
                </p>
                <button
                  className="btn btn-warning btn-wide font-bold shadow-lg hover:scale-105"
                  onClick={() => setShowCreateMenu(true)}
                >
                  🍳 Create Your First Menu
                </button>
                {showCreateMenu && (
                  <CreateMenu onClose={() => setShowCreateMenu(false)} />
                )}
              </div>
            ) : filteredMenu.length === 0 ? (
              <div className="col-span-full text-center py-10 text-gray-500 font-semibold">
                No dishes match your filter.
              </div>
            ) : (
              filteredMenu.map((item) => (
                <div
                  key={item._id}
                  className={`bg-white rounded-3xl shadow-md border border-yellow-200 flex flex-col items-center p-6 transition-all hover:scale-105 ${
                    !item.isActive ? "opacity-60" : ""
                  }`}
                >
                  {/* Image */}
                  <div className="rounded-xl overflow-hidden border-2 border-yellow-300 mb-3 w-[230px] h-[150px]">
                    <img
                      src={getItemImage(item)} // Use getItemImage
                      alt={item.name}
                      className="object-cover w-full h-full"
                    />
                  </div>

                  {/* Info */}
                  <h2 className="text-[18px] font-extrabold text-gray-800 flex items-center gap-2 mb-1 text-center">
                    {item.name}
                  </h2>
                  <p className="text-sm text-gray-500 mb-2 text-center line-clamp-2">
                    {item.description || "Deliciously prepared!"}
                  </p>

                  <div className="flex gap-3 mb-3">
                    <span className="badge bg-yellow-400 text-white text-sm font-bold px-4 py-2 shadow-lg rounded-full">
                      ₹{item.price}
                    </span>
                    <span
                      className={`badge badge-outline ${
                        item.isActive
                          ? "outline-green-400"
                          : "outline-red-600"
                      } text-gray-700 text-xs font-bold px-3 py-2 shadow rounded-full`}
                    >
                      {item.isActive ? "Available" : "Hidden"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-auto">
                    <button
                      className="flex items-center gap-1 px-5 py-2 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 font-bold text-black text-sm shadow hover:scale-105"
                      onClick={() => handleEdit(item.itemId)}
                    >
                      <FiEdit2 /> Edit
                    </button>
                    {item.isActive ? (
                      <button
                        className="flex items-center gap-1 px-5 py-2 rounded-full bg-gradient-to-br from-orange-300 to-yellow-500 font-bold text-black text-sm shadow hover:scale-105"
                        onClick={() => handleDisable(item.itemId)}
                      >
                        <FiEyeOff /> Hide
                      </button>
                    ) : (
                      <button
                        className="flex items-center gap-1 px-5 py-2 rounded-full bg-gradient-to-br from-green-300 to-green-500 font-bold text-black text-sm shadow hover:scale-105"
                        onClick={() => handleRestore(item.itemId)}
                      >
                        <FiEye /> Restore
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* Footer */}
      <FooterNav activeTab="menu" />
    </div>
  );
}
