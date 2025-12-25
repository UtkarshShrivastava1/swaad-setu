import { useEffect, useState } from "react";
import RefreshButton from "../../../../components/common/RefreshButton";
import { getTables, resetTable, toggleTableActive, type ApiTable } from "../../../../api/admin/table.api";
import { useTenant } from "../../../../context/TenantContext";
import QRCodeModal from "../modals/QRCodeModal";
import { toast } from "react-toastify";
import { UtensilsCrossed, QrCode, ZapOff, Check, X } from "lucide-react";

export default function TableManagementPage() {
  const { rid } = useTenant();
  const [tables, setTables] = useState<ApiTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<ApiTable | null>(null);

  async function loadTables(showRefresh = false) {
    if (!rid) return;
    try {
      setLoading(true);
      const data = await getTables(rid);
      setTables(data || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to fetch tables");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTables();
  }, [rid]);

  async function handleToggleActive(tableId: string, isActive: boolean) {
    if (!rid) return;
    const updatedTable = await toggleTableActive(rid, tableId, isActive);
    setTables((prev) => prev.map((t) => (t._id === tableId ? updatedTable : t)));
    toast.success("Table status updated successfully!", { autoClose: 2000 });
  }

  async function handleResetTable(tableId: string) {
    if (!rid) return;
    const updatedTable = await resetTable(rid, tableId);
    setTables((prev) => prev.map((t) => (t._id === tableId ? updatedTable : t)));
    toast.success("Table status updated successfully!", { autoClose: 2000 });
  }

  const handleOpenQrModal = (table: ApiTable) => {
    setSelectedTable(table);
    setIsQrModalOpen(true);
  };

  const getStatusStyles = (table: ApiTable) => {
    if (!table.isActive) return { bg: "bg-zinc-800", text: "text-zinc-500", border: "border-zinc-700", dot: "bg-zinc-600" };
    switch (table.status) {
      case "occupied": return { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", dot: "bg-red-500" };
      case "reserved": return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-500" };
      default: return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-500" };
    }
  }

  return (
    <div className="w-full">
      {selectedTable && <QRCodeModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} table={selectedTable} restaurantId={rid} />}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-yellow-400">Table Management</h1>
          <p className="text-sm text-zinc-400">Live status of your entire restaurant floor.</p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <RefreshButton onClick={() => loadTables(true)} loading={loading} label="" />
        </div>
      </div>
      
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:p-6">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500"><div className="h-8 w-8 rounded-full border-2 border-dashed border-zinc-400 animate-spin mb-3" /><p className="text-sm font-medium">Loading floor data...</p></div>
        ) : error ? (
            <div className="py-10 text-center text-red-500 font-medium">{error}</div>
        ) : tables.length === 0 ? (
            <div className="py-14 text-center text-zinc-500">No tables configured yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {tables.map((table) => {
              const styles = getStatusStyles(table);
              return (
              <div key={table._id} className={`relative group rounded-xl border p-4 text-center transition-all hover:shadow-lg hover:-translate-y-1 ${styles.bg} ${styles.border}`}>
                <div className={`absolute top-2 right-2 h-2.5 w-2.5 rounded-full ${styles.dot} ${table.status === 'occupied' && 'animate-pulse'}`} />
                <div className={`text-lg font-extrabold ${styles.text}`}>{table.tableNumber}</div>
                <div className={`text-xs ${styles.text} opacity-70`}>Cap: {table.capacity}</div>
                <div className={`inline-block mt-2 px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize ${styles.bg.replace('10', '20')} ${styles.text}`}>{table.isActive ? table.status : 'Inactive'}</div>
                
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="flex gap-2 flex-wrap justify-center">
                    {table.status !== "available" && <button onClick={() => handleResetTable(table._id)} className="px-2 py-1 rounded-md bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 text-[10px] font-semibold transition"><ZapOff size={12}/> Reset</button>}
                    <button onClick={() => handleOpenQrModal(table)} className="px-2 py-1 rounded-md bg-zinc-700/80 hover:bg-zinc-700 text-zinc-200 text-[10px] font-semibold transition flex items-center gap-1"><QrCode size={12}/> QR</button>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={table.isActive} onChange={(e) => handleToggleActive(table._id, e.target.checked)} className="sr-only peer" />
                    <div className="relative w-9 h-5 bg-zinc-700 rounded-full peer peer-checked:bg-yellow-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}