import { Edit2, Loader2, Trash2, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { deleteWaiter, getWaiters } from "../../../../api/admin/waiter.api";
import { useTenant } from "../../../../context/TenantContext";
import AddWaiterModal from "../../components/modals/AddWaiterModal";
import { toast } from "react-toastify";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import EditWaiterModal from "../../components/modals/EditWaiterModal";

export default function WaiterManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState<string | null>(null);
  const [waiterList, setWaiterList] = useState<string[]>([]);
  const { rid } = useTenant();

  const [waiterToDelete, setWaiterToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!rid) return <div className="p-4 text-red-500">Restaurant ID not found!</div>;

  const fetchWaiterList = async () => {
    setLoading(true);
    try {
      const data = (await getWaiters(rid)) as any;
      setWaiterList(data.waiterNames || []);
    } catch (error) {
      console.error("Error fetching waiter list:", error);
      toast.error("Failed to fetch waiter list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rid) {
      fetchWaiterList();
    }
  }, [rid]);

  const handleEdit = (name: string) => {
    setSelectedWaiter(name);
    setIsEditModalOpen(true);
  };

  const handleDelete = (name: string) => {
    setWaiterToDelete(name);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (waiterToDelete && rid) {
      try {
        await deleteWaiter(waiterToDelete, rid);
        await fetchWaiterList();
        toast.success("Waiter deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete waiter.");
      } finally {
        setIsDeleteModalOpen(false);
        setWaiterToDelete(null);
      }
    }
  };

  const handleAddSuccess = () => {
    fetchWaiterList();
    toast.success("Waiter added successfully!");
  };

  const handleEditSuccess = () => {
    fetchWaiterList();
    toast.success("Waiter updated successfully!");
  };

  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-full max-w-4xl bg-zinc-950 border border-yellow-500/30 rounded-2xl shadow-[0_0_35px_rgba(250,204,21,0.15)] p-6">
        {/* ================= MODALS ================= */}
        <AddWaiterModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleAddSuccess}
          rid={rid}
        />

        {selectedWaiter && (
          <EditWaiterModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedWaiter(null);
            }}
            onSuccess={handleEditSuccess}
            waiterName={selectedWaiter}
            rid={rid}
          />
        )}

        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          itemName={waiterToDelete || ""}
          onConfirm={confirmDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
        
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-500/15 text-yellow-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-yellow-400">
                Waiter Management
              </h2>
              <p className="text-sm text-zinc-400">
                Manage your restaurant service staff
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-yellow-400 text-black px-4 py-2 font-bold shadow-[0_0_12px_rgba(250,204,21,0.4)] hover:bg-yellow-500 active:scale-[0.97] transition-all"
          >
            <UserPlus size={16} />
            Add Waiter
          </button>
        </div>

        {/* ================= TABLE ================= */}
        {loading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
            </div>
        ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="min-w-full text-sm">
                <thead>
                <tr className="bg-zinc-900">
                    <th className="px-6 py-3 text-left font-semibold text-yellow-400 uppercase tracking-wider">
                    #
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-yellow-400 uppercase tracking-wider">
                    Name
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-yellow-400 uppercase tracking-wider">
                    Actions
                    </th>
                </tr>
                </thead>

                <tbody className="divide-y divide-zinc-800">
                {waiterList.length === 0 ? (
                    <tr>
                    <td colSpan={3} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-zinc-500">
                        <Users size={48} />
                        <p className="text-lg font-medium">
                            No waiters found
                        </p>
                        <p className="text-sm">Click "Add Waiter" to get started.</p>
                        </div>
                    </td>
                    </tr>
                ) : (
                    waiterList.map((name, index) => (
                    <tr
                        key={name} // Use a unique key like name
                        className="hover:bg-zinc-900 transition-colors"
                    >
                        <td className="px-6 py-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-400 font-bold">
                            {index + 1}
                        </div>
                        </td>

                        <td className="px-6 py-4">
                        <div className="text-base font-medium text-zinc-200">
                            {name}
                        </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-3">
                            <button
                            onClick={() => handleEdit(name)}
                            className="flex items-center gap-2 rounded-md bg-yellow-500/10 text-yellow-400 px-3 py-1.5 font-semibold hover:bg-yellow-500/20 active:scale-[0.96] transition-all"
                            >
                            <Edit2 size={14} />
                            Edit
                            </button>

                            <button
                            onClick={() => handleDelete(name)}
                            className="flex items-center gap-2 rounded-md bg-red-500/10 text-red-400 px-3 py-1.5 font-semibold hover:bg-red-500/20 active:scale-[0.96] transition-all"
                            >
                            <Trash2 size={14} />
                            Delete
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
        )}

        {/* ================= FOOTER (Total) ================= */}
        {!loading && waiterList.length > 0 && (
            <div className="flex items-center justify-end text-sm text-zinc-400 mt-4">
                <span>
                    Total Waiters:{" "}
                    <span className="font-bold text-yellow-400 text-base">{waiterList.length}</span>
                </span>
            </div>
        )}
      </div>
    </div>
  );
}