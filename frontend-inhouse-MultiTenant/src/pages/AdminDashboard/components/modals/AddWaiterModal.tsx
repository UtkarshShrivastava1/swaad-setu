import { useState } from "react";
import { addWaiter } from "../../../../api/admin/waiter.api";

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Add New Waiter
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white -700 dark:text-gray-300">
              Waiter Name
            </label>
            <input
              type="text"
              className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 placeholder-gray-400 bg-white text-black"
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
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
      </div>
    </div>
  );
}
