// Layout.tsx or App.tsx
import { Bell } from "lucide-react";
import { useState } from "react";

export default function CallWaiter() {
  const [isCalling, setIsCalling] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleCallWaiter = async () => {
    setIsCalling(true);
    // simulate waiter call API
    await new Promise((r) => setTimeout(r, 1500));
    setIsCalling(false);
    setShowToast(true);

    // Hide toast after 3 seconds
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Your main content */}
      <div className="pb-20">
        {/* <Outlet /> or your page content */}
      </div>

      {/* 🛎 Floating "Call Waiter" Button */}
      <button
        onClick={handleCallWaiter}
        disabled={isCalling}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-400/40 rounded-full px-5 py-3 transition-all active:scale-95 hover:bg-emerald-500 ${
          isCalling ? "opacity-70 cursor-wait" : ""
        }`}
      >
        <Bell size={22} className={isCalling ? "animate-bounce" : ""} />
        <span className="hidden sm:inline">{isCalling ? "Calling..." : "Call Waiter"}</span>
      </button>

      {/* ✅ Confirmation Toast */}
      {showToast && (
        <div className="fixed bottom-24 right-6 bg-white border border-emerald-200 shadow-md rounded-xl px-4 py-2 text-sm text-emerald-700 font-medium animate-fade-in">
          Waiter has been notified ✅
        </div>
      )}
    </div>
  );
}
