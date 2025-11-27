import { FiEdit2, FiHelpCircle, FiSave, FiXCircle } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { updateMenu, fetchMenu } from "../../../../api/admin/menu.api";
import Header from "../../components/Layout/Header";
import MenuLayout from "../../MenuLayout";
import { useTenant } from "../../../../context/TenantContext";
// import { FiSave, FiXCircle, FiEdit2, FiHelpCircle } from "react-icons/fi";

export default function EditMenu() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { rid } = useTenant();

  const [form, setForm] = useState({
    name: state?.item?.name || "",
    price: state?.item?.price || 0,
    description: state?.item?.description || "",
    category: state?.item?.category || "Main Course",
    isAvailable: state?.item?.isAvailable ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSave = async () => {
    if (!rid) return;
    setLoading(true);
    setError("");
    try {
      const existingMenu = await fetchMenu(rid);
      const updatedMenu = {
        ...existingMenu,
        menu: existingMenu.menu.map((m) =>
          m._id === state.item._id ? { ...m, ...form } : m
        ),
      };
      await updateMenu(rid, updatedMenu);
      navigate(`/t/${rid}/admin-dashboard`);
    } catch {
      setError("Error updating menu. Please try again.");
    }
    setLoading(false);
  };

  return (
    <MenuLayout>
      <div className="flex flex-col items-center min-h-screen p-6 bg-[#ecf0f3]">
        <div className="w-full max-w-md rounded-3xl bg-[#f7f8fa] shadow-[0_8px_32px_rgba(149,156,176,0.18)] p-10 mt-8 relative border-none">
          <div className="flex flex-row items-center mb-7 gap-2">
            <FiEdit2 className="text-yellow-600 text-2xl" />
            <h2 className="text-3xl font-extrabold text-center text-gray-700">
              Edit Dish
            </h2>
          </div>

          <form className="space-y-7">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2 pl-1">
                Dish Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full py-3 px-5 rounded-xl bg-[#eef2f6] focus:bg-white shadow-inner border-none text-gray-800 font-semibold placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-300 transition"
                placeholder="Enter dish name"
              />
              <span className="flex items-center text-xs text-gray-400 pt-2 gap-1 pl-1">
                <FiHelpCircle /> Name as shown to customers
              </span>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2 pl-1">
                Price <span className="ml-1 text-xs text-gray-400">(₹)</span>
              </label>
              <input
                type="number"
                name="price"
                min="0"
                value={form.price}
                onChange={handleChange}
                className="w-full py-3 px-5 rounded-xl bg-[#eef2f6] focus:bg-white shadow-inner border-none text-gray-800 font-semibold placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-300 transition"
                placeholder="Set price"
              />
              <span className="flex items-center text-xs text-gray-400 pt-2 gap-1 pl-1">
                <FiHelpCircle /> Best value for this dish
              </span>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2 pl-1">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                className="w-full py-3 px-5 rounded-xl bg-[#eef2f6] focus:bg-white shadow-inner border-none text-gray-800 font-semibold placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-300 transition resize-none"
                placeholder="Short description of the dish"
              ></textarea>
              <span className="flex items-center text-xs text-gray-400 pt-2 gap-1 pl-1">
                <FiHelpCircle /> Optional: highlight ingredients
              </span>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2 pl-1">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full py-3 px-5 rounded-xl bg-[#eef2f6] focus:bg-white shadow-inner border-none text-gray-800 font-semibold focus:ring-2 focus:ring-yellow-300 transition"
              >
                <option>Main Course</option>
                <option>Starters</option>
                <option>Breads</option>
                <option>Beverages</option>
                <option>Desserts</option>
              </select>
            </div>

            <div className="flex items-center gap-5 mt-3">
              <span className="text-sm font-semibold pl-1">Availability</span>
              <div className="relative">
                <label className="inline-flex relative items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={form.isAvailable}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-7 bg-gray-200 rounded-full peer peer-checked:bg-yellow-400 transition-all duration-300"></div>
                  <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-md peer-checked:translate-x-5 transition-transform duration-300"></div>
                </label>
                <span className="text-xs text-gray-400 absolute left-16 top-1">
                  {form.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>
          </form>

          {error && (
            <div className="mb-5 mt-5 text-red-600 text-center rounded-xl bg-red-50 py-2">
              {error}
            </div>
          )}

          <div className="flex flex-row gap-6 justify-between pt-7">
            <button
              className="flex items-center justify-center w-1/2 gap-2 px-6 py-3 rounded-2xl bg-[#eef2f6] shadow-lg font-semibold text-gray-700 hover:bg-yellow-300 hover:text-black transition-all text-base"
              onClick={() => navigate(`/t/${rid}/admin-dashboard`)}
              disabled={loading}
            >
              <FiXCircle className="text-xs" />
              Cancel
            </button>
            <button
              className="flex items-center justify-center w-1/2 gap-2 px-6 py-3 rounded-2xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-400 shadow-lg text-black font-bold hover:scale-105 focus:ring-2 focus:ring-yellow-400 transition-transform  text-xs"
              onClick={handleSave}
              disabled={loading}
            >
              <FiSave className="text-xl" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </MenuLayout>
  );
}
