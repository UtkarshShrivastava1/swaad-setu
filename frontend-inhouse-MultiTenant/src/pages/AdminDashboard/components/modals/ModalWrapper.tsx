export default function ModalWrapper({ title, isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 text-black backdrop-blur-sm transition-all">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up border border-gray-100 ring-1 ring-gray-200">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b rounded-2xl bg-gradient-to-r from-yellow-200 via-white to-yellow-300 flex-shrink-0">
          <h3 className="text-xl font-bold tracking-tight ">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-2xl leading-none rounded-full p-1 hover:bg-gray-100 transition cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="px-6 py-5 bg-gradient-to-tr from-white via-gray-200 to-white flex-grow overflow-y-auto">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes slide-up {
          0% { transform: translateY(50px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
