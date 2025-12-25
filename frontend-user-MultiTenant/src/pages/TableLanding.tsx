import axios from "axios";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTable } from "../context/TableContext";
import { useTenant } from "../context/TenantContext";

interface Table {
  _id: string;
  tableNumber: number;
  capacity: number;
  status: "available" | "occupied";
  isActive: boolean;
  isDeleted: boolean;
  tableType: "dine_in" | "takeout"; // Added
  isSystem: boolean; // Added
}

export default function TableLanding() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedOrderType, setSelectedOrderType] = useState<
    "dine_in" | "takeout"
  >("dine_in");
  const [selectedTable, setSelectedTable] = useState("");
  const [loading, setLoading] = useState(true);

  const { rid, tenant } = useTenant();
  const { setTable } = useTable();

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    async function fetchTables() {
      try {
        const res = await axios.get(`${baseUrl}/api/${rid}/tables`);

        // ✅ ONLY AVAILABLE TABLES
        const availableTables = res.data.filter(
          (t: Table) =>
            t.isActive === true &&
            t.isDeleted === false &&
            t.status === "available"
        );

        setTables(availableTables);
      } catch (err) {
        console.error("❌ Error fetching tables:", err);
      } finally {
        setLoading(false);
      }
    }

    if (rid) fetchTables();
  }, [baseUrl, rid]);

  const handleBack = () => {
    const inhouseUrl = import.meta.env.VITE_INHOUSE_API_URL;
    if (inhouseUrl && rid) {
      window.location.href = `${inhouseUrl}/t/${rid}`;
    } else {
      console.error(
        "VITE_INHOUSE_API_URL or rid is not defined",
        inhouseUrl,
        rid
      );
    }
  };

  const handleConfirm = () => {
    if (selectedOrderType === "dine_in") {
      if (!selectedTable) {
        alert("Please select a table");
        return;
      }

      const table = tables.find((t) => t._id === selectedTable);
      if (!table) {
        alert("Invalid table selected");
        return;
      }

      setTable(table);
      navigate(`/t/${rid}/menu`);
    } else if (selectedOrderType === "takeout") {
      // Create a mock table object for takeout
      const takeoutTable: Table = {
        _id: "takeout-id",
        tableNumber: 999,
        capacity: 0, // Capacity doesn't apply to takeout
        status: "available", // Takeout table always available
        isActive: true,
        isDeleted: false,
        tableType: "takeout", // Mark as takeout
        isSystem: true, // Mark as system table
      };
      setTable(takeoutTable);
      navigate(`/t/${rid}/menu`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0b0c] text-white px-6">
      <div className="w-full max-w-md relative">
        <button
          onClick={handleBack}
          className="mb-4 sm:mb-0 sm:absolute sm:top-0 sm:right-full sm:mr-4 flex items-center gap-2 bg-yellow-500 text-black px-3 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-all"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-yellow-500/20 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-2xl p-4 mb-4">
              <img
                src="/logo.png"
                alt="Swaad Setu"
                className="h-16 w-auto object-contain"
              />
            </div>

            {tenant?.restaurantName && (
              <h1 className="text-3xl font-extrabold tracking-wide text-white">
                {tenant.restaurantName}
              </h1>
            )}
          </div>

          {/* Info */}
          <p className="text-sm text-gray-300 text-center mb-6 leading-relaxed">
            Please select your order type and table to continue.
            <br />
            <span className="text-gray-400 text-xs">
              Only available tables are shown for dine-in.
            </span>
          </p>

          {/* Order Type Selection */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => {
                setSelectedOrderType("dine_in");
                setSelectedTable("");
              }}
              className={`px-4 py-2 rounded-l-lg font-semibold transition-colors ${
                selectedOrderType === "dine_in"
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              Dine-in
            </button>
            <button
              onClick={() => {
                setSelectedOrderType("takeout");
                setSelectedTable("takeout-id");
              }}
              className={`px-4 py-2 rounded-r-lg font-semibold transition-colors ${
                selectedOrderType === "takeout"
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              Takeout
            </button>
          </div>

          {/* Table Selection (for Dine-in) */}
          {selectedOrderType === "dine_in" && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-yellow-400 mb-3 text-center">
                Select Your Table
              </h2>
              {loading ? (
                <p className="text-gray-400 text-center">Loading tables...</p>
              ) : tables.length === 0 ? (
                <p className="text-gray-400 text-sm text-center">
                  No tables available right now.
                </p>
              ) : (
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black 
                  border border-gray-700 text-gray-200 
                  focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Choose table</option>
                  {tables.map((t) => (
                    <option key={t._id} value={t._id}>
                      Table {t.tableNumber} • {t.capacity} seats
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Selected Table / Order Type Display */}
          <div className="text-center mb-6">
            {selectedTable === "takeout-id" ? (
              <p className="text-sm text-gray-300">
                <span className="text-yellow-400 font-semibold">
                  Takeout Order Selected
                </span>
              </p>
            ) : selectedTable ? (
              <p className="text-sm text-gray-300">
                Selected Table{" "}
                <span className="text-yellow-400 font-semibold">
                  {tables.find((t) => t._id === selectedTable)?.tableNumber}
                </span>
              </p>
            ) : (
              <p className="text-sm text-gray-500">No table selected</p>
            )}
          </div>

          {/* Confirm Button */}
          <div className="flex flex-col gap-4">
            <button
              onClick={handleConfirm}
              disabled={selectedOrderType === "dine_in" && !selectedTable}
              className="py-3 rounded-xl 
              bg-yellow-500 text-black font-semibold shadow-lg 
              hover:bg-yellow-400 transition-all disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          © 2025 swaad Setu
        </p>
      </div>
    </div>
  );
}
