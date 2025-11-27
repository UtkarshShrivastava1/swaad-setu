
import { useState, useEffect } from "react";
import { updateWaiter } from "../../../../api/admin/waiter.api";

export default function EditWaiterModal({ isOpen, onClose, onSuccess, waiterName, rid }) {
  // Local form state
  const [name, setName] = useState(waiterName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(waiterName);
    }
  }, [isOpen, waiterName]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name) {
      // You might want to show an inline error message here instead of an alert
      console.error("Please fill in waiter name");
      return;
    }
    if (!rid) {
      console.error("Restaurant ID missing");
      return;
    }

    setLoading(true);
    try {
      await updateWaiter(rid, { oldName: waiterName, newName: name });
      setName("");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Update waiter error caught:", error);
      // Optionally, you can have an onError prop to show an error message in the UI
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-50">
      <div className="bg-white text-black rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Edit Waiter</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input input-primary bg-white w-full rounded border-gray-300 p-2"
              placeholder="Waiter full name"
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="btn btn-outline px-4 py-2 rounded"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50`}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Waiter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
