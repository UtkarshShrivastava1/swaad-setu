import React, { useState } from "react";

export default function FloatingActionButton() {
  const [open, setOpen] = useState(false);

  // Helper functions replace direct DOM scripting
  const handleMainFabClick = () => setOpen((v) => !v);

  return (
    <div className="fixed bottom-7 right-7 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col items-end gap-3 mb-2">
          <button
            onClick={() => { /* openModal('addOrderModal'); */ setOpen(false); }}
            className="bg-white shadow-xl w-12 h-12 rounded-full flex items-center justify-center text-lg hover:bg-gray-100 transition"
            title="New Order"
          >
            <span>📋</span>
          </button>
          <button
            onClick={() => { /* openModal('addMenuItemModal'); */ setOpen(false); }}
            className="bg-white shadow-xl w-12 h-12 rounded-full flex items-center justify-center text-lg hover:bg-gray-100 transition"
            title="Add Menu Item"
          >
            <span>🍽️</span>
          </button>
          <button
            onClick={() => { /* showPage('tables'); */ setOpen(false); }}
            className="bg-white shadow-xl w-12 h-12 rounded-full flex items-center justify-center text-lg hover:bg-gray-100 transition"
            title="Table Status"
          >
            <span>🪑</span>
          </button>
          <button
            onClick={() => { /* triggerRefresh(); */ setOpen(false); }}
            className="bg-white shadow-xl w-12 h-12 rounded-full flex items-center justify-center text-lg hover:bg-gray-100 transition"
            title="Refresh"
          >
            <span>🔄</span>
          </button>
        </div>
      )}
      <button
        className="bg-yellow-400 hover:bg-yellow-500 text-2xl shadow-2xl w-16 h-16 rounded-full flex items-center justify-center transition"
        onClick={handleMainFabClick}
        aria-label={open ? "Close" : "Open"} 
      >
        <span className={`${open ? 'rotate-130': ''}`}>➕</span>
      </button>
    </div>
  );
}
