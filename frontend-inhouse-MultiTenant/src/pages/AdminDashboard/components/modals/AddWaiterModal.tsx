
import { useState } from "react";
import { addWaiter } from "../../../../api/admin/waiter.api";

export default function AddWaiterModal({ isOpen, onClose, onSuccess, rid }) {
  // Local form state
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

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
      await addWaiter({ name }, rid);
      setName("");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Add waiter error caught:", error);
      // Optionally, you can have an onError prop to show an error message in the UI
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-50">
      <div className="bg-white text-black rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Add Waiter</h2>
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
              {loading ? "Adding..." : "Add Waiter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
