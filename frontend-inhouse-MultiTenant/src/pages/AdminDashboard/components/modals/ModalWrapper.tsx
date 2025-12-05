import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

export default function ModalWrapper({
  title,
  isOpen,
  onClose,
  children,
  disablePortal = false,
  maxWidth = "max-w-lg", // New prop with default
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  disablePortal?: boolean;
  maxWidth?: string; // New prop in interface
}) {
  const elRef = useRef<HTMLDivElement | null>(null);

  // Only create and manage portal element if not disabled
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
  }, [disablePortal]); // Dependency on disablePortal

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className={`relative z-10 bg-black w-full ${maxWidth} rounded-xl shadow-lg p-4 flex flex-col max-h-[90vh]`}>
        <div className="p-4 border-b bg-black rounded-t-xl shrink-0">
          <h2 className="text-lg font-semibold text-yellow-400">{title}</h2>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white"
          >
            &times;
          </button>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );

  if (disablePortal) {
    return modalContent;
  } else {
    // Ensure elRef.current is available for portaling
    if (!elRef.current) {
        elRef.current = document.createElement("div");
    }
    return ReactDOM.createPortal(modalContent, elRef.current);
  }
}