import { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";

export default function AddOrderModal({
  isOpen,
  onClose,
  onSubmit, // New prop for handling form submission
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void; // Expect a submit handler
}) {
  const [formData, setFormData] = useState({
    customer: "",
    type: "takeaway", // Default to takeaway
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        customer: "",
        type: "takeaway",
      });
    }
  }, [isOpen]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(formData); // Use the passed-in submit handler
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
            <option value="takeaway">Takeaway</option>
            <option value="dine-in">Dine-in</option>
          </select>
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
            Add Order
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}