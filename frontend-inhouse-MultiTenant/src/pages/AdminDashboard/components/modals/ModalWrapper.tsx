import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

export default function ModalWrapper({
  title,
  isOpen,
  onClose,
  children,
  disablePortal = false,
  maxWidth = "max-w-lg",
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  disablePortal?: boolean;
  maxWidth?: string;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (disablePortal) return;

    if (!elRef.current) {
      elRef.current = document.createElement("div");
    }

    const modalRoot = document.getElementById("modal-root");
    if (!modalRoot || !elRef.current) {
      console.error("Modal root or element reference not found.");
      return;
    }

    modalRoot.appendChild(elRef.current);

    return () => {
      if (elRef.current) {
        modalRoot.removeChild(elRef.current);
      }
    };
  }, [disablePortal]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative z-10 bg-black w-full ${maxWidth} rounded-xl shadow-lg 
        p-0 flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 bg-black rounded-t-xl shrink-0">
          <h2 className="text-lg font-semibold text-yellow-400">{title}</h2>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 text-gray-200">{children}</div>
      </div>
    </div>
  );

  if (disablePortal) {
    return modalContent;
  } else {
    if (!elRef.current) {
      elRef.current = document.createElement("div");
    }
    return ReactDOM.createPortal(modalContent, elRef.current);
  }
}
