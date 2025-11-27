import { useState, useEffect } from "react";
import { updateWaiter } from "../../../../api/admin/waiter.api";
import ModalWrapper from "./ModalWrapper";

export default function EditWaiterModal({
  isOpen,
  onClose,
  onSuccess,
  waiterName,
  rid,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  waiterName: string;
  rid: string;
}) {
  const [newName, setNewName] = useState(waiterName);

  useEffect(() => {
    setNewName(waiterName);
  }, [waiterName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await updateWaiter(rid, { oldName: waiterName, newName });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to update waiter", error);
    }
  }

  return (
    <ModalWrapper title="Edit Waiter" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div>
          <label className="text-sm font-medium">Waiter Name</label>
          <input
            type="text"
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-yellow-400 text-black font-semibold hover:bg-yellow-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}