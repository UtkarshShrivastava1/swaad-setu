import { useState } from "react";
import ModalWrapper from "./ModalWrapper";

export default function AddOrderModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    customer: "",
    type: "",
    table: "",
  });

  function handleSubmit(e) {
    e.preventDefault();
    console.log("New Order Created:", formData);
    onClose();
  }

  return (
    <ModalWrapper title="Add New Order" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div>
          <label className="text-sm font-medium">Customer Name</label>
          <input
            type="text"
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-yellow-300"
            placeholder="Enter customer name"
            value={formData.customer}
            onChange={(e) =>
              setFormData({ ...formData, customer: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Order Type</label>
          <select
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          >
            <option value="">Select type...</option>
            <option value="dine-in">Dine-in</option>
            <option value="takeaway">Takeaway</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>

        {formData.type === "dine-in" && (
          <div>
            <label className="text-sm font-medium">Table</label>
            <input
              type="text"
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., Table 5"
              value={formData.table}
              onChange={(e) =>
                setFormData({ ...formData, table: e.target.value })
              }
            />
          </div>
        )}

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
            Add Order
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
