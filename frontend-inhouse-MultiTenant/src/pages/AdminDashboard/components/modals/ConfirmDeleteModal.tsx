// ConfirmDeleteModal.tsx
import React from "react";

type ConfirmDeleteModalProps = {
  isOpen: boolean;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
};

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  itemName,
  onConfirm,
  onCancel,
  title = "Confirm Deletion",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-lg p-6 min-w-[320px] max-w-sm">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">{title}</h2>
        <p className="mb-5 text-gray-600">
          {description}
          {itemName && (
            <span className="block font-bold text-red-600 mt-1">
              {itemName}
            </span>
          )}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
