import { useState } from "react";
import { addWaiter } from "../../../../api/admin/waiter.api";
import ModalWrapper from "./ModalWrapper";

export default function AddWaiterModal({
  isOpen,
  onClose,
  onSuccess,
  rid,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rid: string;
}) {
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addWaiter({ name }, rid);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to add waiter", error);
    }
  }

  return (
    <ModalWrapper title="Add New Waiter" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div>
          <label className="text-sm font-medium">Waiter Name</label>
          <input
            type="text"
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter waiter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            Add Waiter
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}