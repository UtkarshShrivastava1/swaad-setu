// SuccessModal.tsx
import React, { useEffect } from "react";

type SuccessModalProps = {
  isOpen: boolean;
  message?: string;
  onClose: () => void;
  title?: string;
  autoCloseDurationMs?: number; // Duration before auto-close in ms
};

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  message = "Action completed successfully!",
  onClose,
  title = "Success",
  autoCloseDurationMs = 3000,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDurationMs);

    return () => clearTimeout(timer);
  }, [isOpen, autoCloseDurationMs, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg text-center">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <p className="mb-6 text-gray-700">{message}</p>
        <button
          onClick={onClose}
          className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md font-semibold transition"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
