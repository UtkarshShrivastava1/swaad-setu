
import { useEffect, useState } from "react";
import { useTenant } from "../../../../context/TenantContext";
import { getWaiters, deleteWaiter } from "../../../../api/admin/waiter.api";
import AddWaiterModal from "../../components/modals/AddWaiterModal";
import EditWaiterModal from "../../components/modals/EditWaiterModal";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import SuccessModal from "../../components/modals/SuccessModal";
import { UserPlus, Edit2, Trash2, Users } from 'lucide-react';

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

  if (!rid) {
    return <div>Restaurant ID not found!</div>;
  }

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
  }

  const handleEditSuccess = () => {
    fetchWaiterList();
    setSuccessMessage("Waiter updated successfully!");
    setIsSuccessModalOpen(true);
  }

  return (
    <section className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-yellow-400">
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
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-black p-2 rounded-lg">
              <Users size={28} className="text-yellow-400" />
            </div>
            <h2 className="text-3xl font-bold text-black">Waiter Management</h2>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-black hover:bg-gray-900 text-yellow-400 font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            <UserPlus size={20} />
            Add Waiter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full ">
          <thead>
            <tr className="bg-black">
              <th className="px-8 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                S.No
              </th>
              <th className="px-8 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-8 py-4 text-center text-sm font-bold text-yellow-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-yellow-200 overflow-scroll ">
            {waiterList.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-8 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Users size={48} className="text-gray-300" />
                    <p className="text-gray-500 text-lg">No waiters found</p>
                  </div>
                </td>
              </tr>
            ) : (
              waiterList.map((name, index) => (
                <tr
                  key={index}
                  className="hover:bg-yellow-50 transition-colors duration-200"
                >
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center justify-center w-10 h-10 bg-yellow-400 text-black font-bold rounded-full">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-lg font-semibold text-black">{name}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleEdit(name)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-md"
                        aria-label={`Edit ${name}`}
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(name)}
                        className="bg-black hover:bg-gray-900 text-yellow-400 font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-md"
                        aria-label={`Delete ${name}`}
                      >
                        <Trash2 size={16} />
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

      {/* Footer with count */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-4">
        <div className="flex items-center justify-between">
          <span className="text-black font-semibold">
            Total Waiters: <span className="font-bold text-xl">{waiterList.length}</span>
          </span>
          <span className="text-black text-sm">
            Manage your team efficiently
          </span>
        </div>
      </div>
    </section>
  );
}
