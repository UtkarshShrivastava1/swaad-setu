import { useState } from "react";
import { createTable } from "../../../../api/admin/table.api"; // Ensure this exists
import ModalWrapper from "./ModalWrapper"; // Adjust path as needed

export default function AddTableModal({
  isOpen,
  onClose,
  rid,
  onTableCreated,
}) {
  const [table, setTable] = useState({
    tableNumber: "",
    capacity: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        tableNumber: Number(table.tableNumber),
        capacity: Number(table.capacity),
        isActive: table.isActive,
      };

      const created = await createTable(rid, payload);
      if (typeof onTableCreated === "function") onTableCreated(created);

      // Reset form
      setTable({ tableNumber: "", capacity: "", isActive: true });
      onClose();
    } catch (err) {
      console.error("Error creating table:", err);
      setError(err.message || "Failed to add table.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalWrapper title="Add New Table" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5 text-black">
        {/* Table Number & Capacity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Table Number</label>
            <input
              type="number"
              min="1"
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Enter table number"
              value={table.tableNumber}
              onChange={(e) =>
                setTable({ ...table, tableNumber: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Capacity</label>
            <input
              type="number"
              min="1"
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="No. of seats"
              value={table.capacity}
              onChange={(e) => setTable({ ...table, capacity: e.target.value })}
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="isActive"
            checked={table.isActive}
            onChange={(e) => setTable({ ...table, isActive: e.target.checked })}
            className="w-4 h-4 accent-yellow-500 cursor-pointer"
            disabled={loading}
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Table is Active
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-md font-semibold text-black transition 
              ${
                loading
                  ? "bg-yellow-300 cursor-not-allowed"
                  : "bg-yellow-400 hover:bg-yellow-500"
              }`}
          >
            {loading ? "Adding..." : "Add Table"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
