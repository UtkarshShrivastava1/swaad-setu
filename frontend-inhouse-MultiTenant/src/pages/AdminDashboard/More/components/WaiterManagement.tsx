import { Edit2, Trash2, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { deleteWaiter, getWaiters } from "../../../../api/admin/waiter.api";
import { useTenant } from "../../../../context/TenantContext";
import AddWaiterModal from "../../components/modals/AddWaiterModal";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import EditWaiterModal from "../../components/modals/EditWaiterModal";
import SuccessModal from "../../components/modals/SuccessModal";

export default function WaiterManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState<string | null>(null);
  const [waiterList, setWaiterList] = useState<string[]>([]);
  const { rid } = useTenant();

  const [waiterToDelete, setWaiterToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (!rid) return <div>Restaurant ID not found!</div>;

  const fetchWaiterList = async () => {
    try {
      const data = (await getWaiters(rid)) as any;
      setWaiterList(data.waiterNames || []);
    } catch (error) {
      console.error("Error fetching waiter list:", error);
    }
  };

  useEffect(() => {
    fetchWaiterList();
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
    if (waiterToDelete) {
      await deleteWaiter(waiterToDelete, rid);
      fetchWaiterList();
      setIsDeleteModalOpen(false);
      setWaiterToDelete(null);
      setSuccessMessage("Waiter deleted successfully!");
      setIsSuccessModalOpen(true);
    }
  };

  const handleAddSuccess = () => {
    fetchWaiterList();
    setSuccessMessage("Waiter added successfully!");
    setIsSuccessModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchWaiterList();
    setSuccessMessage("Waiter updated successfully!");
    setIsSuccessModalOpen(true);
  };

  return (
    <section className="relative rounded-3xl border border-yellow-400/30 bg-gradient-to-br from-black via-zinc-900 to-black backdrop-blur-xl shadow-[0_0_50px_rgba(250,204,21,0.25)] overflow-hidden">
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

      <SuccessModal
        isOpen={isSuccessModalOpen}
        message={successMessage}
        onClose={() => setIsSuccessModalOpen(false)}
      />

      {/* ================= HEADER ================= */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-black p-3 rounded-2xl shadow-inner">
              <Users size={26} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-black">
                Waiter Management
              </h2>
              <p className="text-sm text-black/70">
                Manage your restaurant service staff
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="
              flex items-center gap-2
              rounded-xl bg-black text-yellow-400
              px-6 py-3 font-bold
              shadow-[0_0_18px_rgba(250,204,21,0.45)]
              hover:bg-zinc-900 active:scale-[0.97]
              transition-all
            "
          >
            <UserPlus size={18} />
            Add Waiter
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="overflow-x-auto bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-black">
              <th className="px-8 py-4 text-left font-bold text-yellow-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-8 py-4 text-left font-bold text-yellow-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-8 py-4 text-center font-bold text-yellow-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-yellow-200">
            {waiterList.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Users size={52} className="text-gray-300" />
                    <p className="text-gray-500 text-lg font-medium">
                      No waiters found
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              waiterList.map((name, index) => (
                <tr
                  key={index}
                  className="hover:bg-yellow-50 transition-colors"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-400 text-black font-bold shadow">
                      {index + 1}
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <div className="text-base font-semibold text-black">
                      {name}
                    </div>
                  </td>

                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleEdit(name)}
                        className="
                          flex items-center gap-2
                          rounded-lg bg-yellow-400 text-black
                          px-4 py-2 font-bold
                          hover:bg-yellow-500
                          shadow-md active:scale-[0.96]
                        "
                      >
                        <Edit2 size={15} />
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(name)}
                        className="
                          flex items-center gap-2
                          rounded-lg bg-black text-yellow-400
                          px-4 py-2 font-bold
                          hover:bg-zinc-900
                          shadow-md active:scale-[0.96]
                        "
                      >
                        <Trash2 size={15} />
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

      {/* ================= FOOTER ================= */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-4">
        <div className="flex items-center justify-between text-black font-semibold">
          <span>
            Total Waiters:{" "}
            <span className="font-extrabold text-xl">{waiterList.length}</span>
          </span>
          <span className="text-sm text-black/70">Fast staff operations</span>
        </div>
      </div>
    </section>
  );
}
