// ErrorModal.tsx
import React from "react";

type ErrorModalProps = {
  isOpen: boolean;
  message?: string;
  onClose: () => void;
  title?: string;
};

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  message = "An unexpected error occurred.",
  onClose,
  title = "Error",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg text-center">
        <h2 className="text-xl font-semibold mb-4 text-red-600">{title}</h2>
        <p className="mb-6 text-gray-700">{message}</p>
        <button
          onClick={onClose}
          className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-md font-semibold transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;
