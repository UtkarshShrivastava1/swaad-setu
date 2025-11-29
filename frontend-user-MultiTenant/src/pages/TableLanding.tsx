import axios from "axios";
import { useEffect, useState } from "react";
import { FaUtensils } from "react-icons/fa";
import { MdOutlineTableBar } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Hero from "../assets/Hero.jpg";
import { useTenant } from "../context/TenantContext";
import { useTable } from "../context/TableContext";

export default function TableLanding() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [loading, setLoading] = useState(true);

  const { rid } = useTenant();
  const { setTable } = useTable();

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    async function fetchTables() {
      try {
        const res = await axios.get(`${baseUrl}/api/${rid}/tables`);
        const availableTables = res.data.filter(
          (t) => t.isActive && !t.isDeleted
        );
        setTables(availableTables);
      } catch (err) {
        console.error("Error fetching tables:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTables();
  }, [baseUrl, rid]);

  const handleSave = () => {
    if (!selectedTable) return alert("Please select a table");

    const table = tables.find((t) => t._id === selectedTable);
    if (!table) return alert("Invalid table selected");

    setTable(table);
    navigate(`/t/${rid}/menu`);
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center brightness-75"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1400&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-black/50" />

      {/* Main Content */}
      <div className="relative z-10 text-center text-white px-6 py-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white/20 p-4 rounded-full shadow-lg mb-4">
            <FaUtensils className="text-4xl text-yellow-400" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-wide drop-shadow-lg">
            swaad Setu
          </h1>
          <p className="text-lg text-gray-200 mt-2 italic">
            “Flavors that tell a story”
          </p>
        </div>

        <div className="max-w-xl mx-auto bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-yellow-400/30">
          <p className="text-sm text-gray-200 mb-4">
            Welcome to{" "}
            <span className="font-semibold text-yellow-300">swaad Setu</span> —
            indulge in our signature dishes crafted with authentic spices and a
            touch of love.
          </p>

          <div className="mb-6">
            <img
              src={Hero}
              alt="Restaurant Food"
              className="rounded-2xl w-full shadow-lg border border-yellow-400/20"
            />
          </div>

          {/* Table selection info */}
          <p className="text-gray-200 font-medium mb-1">
            {selectedTable
              ? `Selected: Table ${
                  tables.find((t) => t._id === selectedTable)?.tableNumber
                }`
              : "No table selected"}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-500 text-black font-semibold shadow-lg hover:bg-yellow-400 transition-all"
            >
              <MdOutlineTableBar /> Select Table
            </button>

            <button
              onClick={() => {
                if (!selectedTable) {
                  alert("Please select a table first");
                  return;
                }
                navigate(`/t/${rid}/menu`);
              }}
              className="px-5 py-2.5 rounded-lg bg-white text-yellow-700 font-semibold shadow-lg hover:bg-yellow-50 transition-all"
            >
              View Menu 🍽️
            </button>
          </div>
        </div>

        <div className="mt-10 text-sm text-gray-300 italic">
          © 2025 swaad Setu • Taste the Tradition
        </div>
      </div>

      {/* Table Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl border border-yellow-400">
            <h2 className="text-lg font-semibold mb-4 text-yellow-700">
              Select Your Table
            </h2>

            {loading ? (
              <p className="text-gray-600">Loading tables...</p>
            ) : (
              <select
                className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-4"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
              >
                <option value="">Choose table</option>
                {tables.map((t) => (
                  <option key={t._id} value={t._id}>
                    Table {t.tableNumber} ({t.capacity} seats)
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
