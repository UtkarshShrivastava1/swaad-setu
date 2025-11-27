import { useEffect, useState } from "react";
import {
  getTables,
  toggleTableActive,
  resetTable,
} from "../../../../api/admin/table.api";
import MenuLayout from "../../MenuLayout";
import AddTableModal from "../modals/AddTableModal";
import FooterNav from "./Footer";
import TableHeroSection from "./TableHero";
import SuccessModal from "../modals/SuccessModal";
import { useTenant } from "../../../../context/TenantContext";
import QRCodeModal from "../modals/QRCodeModal";

export default function TableManagementPage() {
  const { rid } = useTenant();
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalType, setModalType] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);

  async function loadTables(showRefresh = false) {
    if (!rid) return;
    try {
      if (showRefresh) setRefreshing(true);
      setLoading(true);
      const data = await getTables(rid);
      setTables(data || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to fetch tables");
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  }

  useEffect(() => {
    loadTables();
    const interval = setInterval(() => loadTables(true), 15000);
    return () => clearInterval(interval);
  }, [rid]);

  async function handleToggleActive(tableId: string, isActive: boolean) {
    if (!rid) return;

    try {
      const updatedTable = await toggleTableActive(rid, tableId, isActive);
      setTables((prev) =>
        prev.map((t) => (t._id === tableId ? updatedTable : t))
      );
      setSuccessOpen(true);
    } catch (err: any) {
      console.error("❌ Toggle active failed:", err);
      alert(err.message || "Failed to toggle table status.");
    }
  }

  async function handleResetTable(tableId: string) {
    if (!rid) return;

    try {
      const updatedTable = await resetTable(rid, tableId);
      setTables((prev) =>
        prev.map((t) => (t._id === tableId ? updatedTable : t))
      );
      setSuccessOpen(true);
    } catch (err: any) {
      console.error("❌ Reset table failed:", err);
      alert(err.message || "Failed to reset table.");
    }
  }

  const handleOpenQrModal = (table: any) => {
    setSelectedTable(table);
    setModalType("qr");
  };

  return (
    <MenuLayout>
      <div className="w-full flex flex-col items-center py-8 min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
        <div className="w-full max-w-6xl space-y-10 text-black animate-fadeIn">
          <TableHeroSection />

          <SuccessModal
            isOpen={successOpen}
            message="Table status updated successfully!"
            onClose={() => setSuccessOpen(false)}
            autoCloseDurationMs={1000} // auto close after 1 second
          />

          <section className="bg-white shadow-lg rounded-2xl border border-gray-200 p-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                🪑 Table Management
                {refreshing && (
                  <span className="text-xs text-gray-500 animate-pulse">
                    (Refreshing…)
                  </span>
                )}
              </h3>

              <div className="flex gap-2">
                <button
                  className="px-4 py-1.5 rounded-md bg-yellow-400 hover:bg-yellow-500 text-black font-medium shadow transition"
                  onClick={() => setModalType("table")}
                >
                  ➕ Add New Table
                </button>
                <button
                  className="px-4 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium shadow transition"
                  onClick={() => loadTables(true)}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            <hr className="mb-4" />

            {loading ? (
              <p className="text-center text-gray-500 py-5">Loading Tables...</p>
            ) : error ? (
              <p className="text-center text-red-500 py-5">{error}</p>
            ) : tables.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tables.map((table) => (
                  <div
                    key={table._id}
                    className={`relative p-4 rounded-xl border text-center transition-all transform hover:scale-[1.03] hover:shadow-xl ${
                      !table.isActive
                        ? "bg-gray-200 border-gray-300 filter grayscale opacity-60"
                        : table.status === "occupied"
                        ? "bg-red-50 border-red-300"
                        : table.status === "reserved"
                        ? "bg-yellow-50 border-yellow-300"
                        : "bg-yellow-50 border-yellow-300"
                    }`}
                  >
                    <div className="text-lg font-semibold text-gray-800 mb-1">
                      🪑 Table {table.tableNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      Capacity: {table.capacity}
                    </div>

                    <div
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        table.status === "available"
                          ? "bg-green-100 text-green-700"
                          : table.status === "occupied"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {table.status || "available"}
                    </div>

                    {table.currentSessionId && (
                      <div className="text-[11px] text-gray-400 mt-1 italic">
                        Session: {table.currentSessionId}
                      </div>
                    )}

                    <div className="flex justify-center flex-wrap gap-2 mt-3">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={table.isActive}
                          onChange={(e) =>
                            handleToggleActive(table._id, e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400"></div>
                        <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                          {table.isActive ? "Active" : "Inactive"}
                        </span>
                      </label>
                      {table.status !== "available" && (
                        <button
                          onClick={() => handleResetTable(table._id)}
                          className="px-2 py-1 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium shadow transition"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenQrModal(table)}
                        className="px-2 py-1 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium shadow transition"
                      >
                        QR Code
                      </button>
                    </div>

                    <div
                      className={`absolute top-1 right-1 h-2 w-2 rounded-full animate-pulse transition-all ${
                        table.status === "available"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-4">
                No tables available.
              </p>
            )}
          </section>
        </div>

        <AddTableModal
          isOpen={modalType === "table"}
          onClose={() => setModalType(null)}
          rid={rid}
          onTableCreated={() => loadTables()}
        />

        <QRCodeModal
          isOpen={modalType === "qr"}
          onClose={() => setModalType(null)}
          table={selectedTable}
          restaurantId={rid}
        />

        <FooterNav activeTab="tables" />
      </div>
    </MenuLayout>
  );
}
