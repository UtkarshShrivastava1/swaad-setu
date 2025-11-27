import { useState } from "react";
import { createTable, type ApiTable } from "../../../../api/admin/table.api";
import ModalWrapper from "./ModalWrapper";

export default function AddTableModal({
  isOpen,
  onClose,
  rid,
  onTableCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  rid: string;
  onTableCreated: (table: ApiTable) => void;
}) {
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tableNumber) return alert("Please enter table number");
    try {
      const newTable = await createTable(rid, {
        tableNumber: parseInt(tableNumber),
        capacity,
      });
      onTableCreated(newTable);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create table");
    }
  }

  return (
    <ModalWrapper title="Add New Table" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        {error && (
          <div className="text-red-600 bg-red-50 p-2 rounded">{error}</div>
        )}
        <div>
          <label className="text-sm font-medium">Table Number</label>
          <input
            type="number"
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="e.g., 5"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Capacity</label>
          <input
            type="number"
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
            value={capacity}
            onChange={(e) => setCapacity(parseInt(e.target.value))}
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
            Add Table
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}