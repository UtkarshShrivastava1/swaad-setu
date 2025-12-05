import { useEffect, useState } from "react";
import {
  getTables,
  resetTable,
  toggleTableActive,
} from "../../../../api/admin/table.api";
import { useTenant } from "../../../../context/TenantContext";
import MenuLayout from "../../MenuLayout";
import AddTableModal from "../modals/AddTableModal";
import QRCodeModal from "../modals/QRCodeModal";
import SuccessModal from "../modals/SuccessModal";
import FooterNav from "./Footer";
import TableHeroSection from "./TableHero";

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
    const updatedTable = await toggleTableActive(rid, tableId, isActive);
    setTables((prev) =>
      prev.map((t) => (t._id === tableId ? updatedTable : t))
    );
    setSuccessOpen(true);
  }

  async function handleResetTable(tableId: string) {
    if (!rid) return;
    const updatedTable = await resetTable(rid, tableId);
    setTables((prev) =>
      prev.map((t) => (t._id === tableId ? updatedTable : t))
    );
    setSuccessOpen(true);
  }

  const handleOpenQrModal = (table: any) => {
    setSelectedTable(table);
    setModalType("qr");
  };

  return (
    <MenuLayout>
      <div className="min-h-screen w-full flex justify-center bg-gradient-to-br from-slate-100 via-amber-50 to-slate-100 py-8">
        <div className="w-full max-w-7xl px-4 space-y-8 animate-fadeIn">
          <TableHeroSection />

          <SuccessModal
            isOpen={successOpen}
            message="Table status updated successfully!"
            onClose={() => setSuccessOpen(false)}
            autoCloseDurationMs={1200}
          />

          {/* =================== TABLE PANEL =================== */}
          <section className="rounded-3xl border border-white/60 bg-white/90 backdrop-blur-xl shadow-2xl p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  Table Control Center
                  {refreshing && (
                    <span className="text-xs text-slate-500 animate-pulse">
                      Syncing…
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live status of your entire restaurant floor
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => loadTables(true)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shadow transition"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {/* States */}
            {loading && (
              <div className="py-20 text-center text-slate-500">
                <div className="h-10 w-10 mx-auto mb-3 border-2 border-dashed rounded-full animate-spin" />
                Loading floor data…
              </div>
            )}

            {error && (
              <div className="py-10 text-center text-red-500 font-medium">
                {error}
              </div>
            )}

            {/* =================== TABLE GRID =================== */}
            {!loading && !error && tables.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                {tables.map((table) => (
                  <div
                    key={table._id}
                    className={`relative group rounded-2xl border p-4 text-center transition-all hover:shadow-2xl hover:-translate-y-1 ${
                      !table.isActive
                        ? "bg-slate-200 border-slate-300 opacity-60 grayscale"
                        : table.status === "occupied"
                        ? "bg-rose-50 border-rose-200"
                        : table.status === "reserved"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    {/* Table Number */}
                    <div className="text-lg font-extrabold text-slate-900 mb-1">
                      Table {table.tableNumber}
                    </div>

                    <div className="text-xs text-slate-500">
                      Capacity: {table.capacity}
                    </div>

                    {/* Status Pill */}
                    <div
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-semibold capitalize ${
                        table.status === "available"
                          ? "bg-emerald-100 text-emerald-700"
                          : table.status === "occupied"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {table.status || "available"}
                    </div>

                    {table.currentSessionId && (
                      <div className="text-[10px] text-slate-400 mt-1 truncate">
                        Session: {table.currentSessionId}
                      </div>
                    )}

                    {/* Controls */}
                    <div className="mt-4 flex flex-col items-center gap-2">
                      {/* Toggle */}
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={table.isActive}
                          onChange={(e) =>
                            handleToggleActive(table._id, e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-amber-400 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:bg-white after:rounded-full after:transition peer-checked:after:translate-x-full"></div>
                        <span className="ml-2 text-xs font-medium text-slate-700">
                          {table.isActive ? "Active" : "Inactive"}
                        </span>
                      </label>

                      <div className="flex gap-2 flex-wrap justify-center">
                        {table.status !== "available" && (
                          <button
                            onClick={() => handleResetTable(table._id)}
                            className="px-2 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-semibold shadow transition"
                          >
                            Reset
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenQrModal(table)}
                          className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 text-[11px] font-semibold shadow transition"
                        >
                          QR Code
                        </button>
                      </div>
                    </div>

                    {/* Live Dot */}
                    <div
                      className={`absolute top-2 right-2 h-2 w-2 rounded-full animate-pulse ${
                        table.status === "available"
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      }`}
                    />
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && tables.length === 0 && (
              <div className="py-14 text-center text-slate-400">
                No tables configured yet.
              </div>
            )}
          </section>

          {/* MODALS */}


          <QRCodeModal
            isOpen={modalType === "qr"}
            onClose={() => setModalType(null)}
            table={selectedTable}
            restaurantId={rid}
          />

          <FooterNav activeTab="tables" />
        </div>
      </div>
    </MenuLayout>
  );
}
