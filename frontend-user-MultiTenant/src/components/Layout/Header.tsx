import { ArrowLeft, Clock, MapPin, BellRing, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createCall } from "../../api/call.api";
import { useTable } from "../../context/TableContext";
import { useTenant } from "../../context/TenantContext";

export default function Header({
  variant = "menu", // "menu" for Menu page, "other" for secondary pages
  onBack,
  tableNumber = "Table 3",
  waitTime = "30-40 mins",
  pageTitle = "Page",
  onCallWaiter,
  searchBar,
  filterSelect,
  categoryTabs,
  table,
}) {
  const navigate = useNavigate();
  const { rid } = useTenant(); // Access rid from useTenant
  const [callActive, setCallActive] = useState(false);
  const [toast, setToast] = useState<null | { type: "success" | "error"; message: string }>(null);

  const tableId = table?._id;

  const handleCallWaiterClick = async () => {
    if (typeof onCallWaiter === "function") {
      try {
        await onCallWaiter();
      } catch {}
      return;
    }
    try {
      if (!tableId) {
        setToast({ type: "error", message: "Table not selected" });
        setTimeout(() => setToast(null), 2500);
        return;
      }
      const res = await createCall(rid, {
        tableId: tableId, // Use the correct tableId
        type: "bill",
        notes: "Requesting the bill please",
      });
      try {
        sessionStorage.setItem("active_call", JSON.stringify(res));
      } catch {}
      if (res?.status === "active") setCallActive(true);
      setToast({ type: "success", message: "Waiter call raised" });
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error("Call waiter error:", err);
      setToast({ type: "error", message: "Failed to call waiter" });
      setTimeout(() => setToast(null), 2500);
    }
  };

  // ✅ Logout handler
  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      sessionStorage.clear();
      localStorage.clear();
      navigate("/"); // Go back to homepage
    }
  };

  if (variant === "menu") {
    return (
      <header className="bg-[#ffbe00] shadow-lg py-3">
        {toast && (
          <div className="fixed top-4 right-4 z-50">
            <div className={(toast.type === "success" ? "bg-green-600" : "bg-red-600") + " text-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 animate-bounce"}>
              {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="text-sm font-semibold">{toast.message}</span>
            </div>
          </div>
        )}
        {/* Compact, single-row layout on mobile */}
        <div className="max-w-screen-lg mx-auto flex flex-row items-center justify-between gap-2 px-2 sm:px-4">
          {/* Title */}
          <h1 className="text-black text-base font-bold tracking-tight flex-shrink-0">
            Menu
          </h1>
          {/* Info group: compact on mobile */}
          <div className="flex flex-row flex-nowrap items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1 bg-black px-2 py-1 md:px-3 rounded-full shadow">
              <MapPin size={12} className="text-[#ffbe00] md:text-[14px]" />
              <span className="font-medium text-[11px] md:text-[14px] text-[#ffbe00]">
                Table {tableNumber}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-black px-2 py-1 md:px-3 rounded-full shadow">
              <Clock size={12} className="text-[#ffbe00] md:text-[14px]" />
              <span className="font-medium text-[11px] md:text-[14px] text-[#ffbe00]">
                {waitTime}
              </span>
            </div>
            <button
              onClick={handleCallWaiterClick}
              className={(callActive ? "ring-2 ring-[#ffbe00] animate-pulse " : "") + "flex items-center gap-1 bg-black px-2 py-1 md:text-[14px] md:px-3 rounded-full text-[#ffbe00] font-medium shadow hover:bg-black/70 text-[14px]"}
            >
              <BellRing size={14} className="text-[#ffbe00]" /> Call Waiter
            </button>
            {callActive && (
              <span className="ml-1 bg-green-600 text-white rounded-full px-2 py-0.5 text-[10px]">Active</span>
            )}
          </div>
        </div>

        {/* Responsive spacing for Search and Tabs */}
        <div className="max-w-screen-md mx-auto w-full mt-2 px-2 sm:px-4">
          {searchBar}
        </div>

        <div className="max-w-screen-lg mx-auto w-full px-2 sm:px-4 mt-3">
          {categoryTabs}
        </div>
      </header>
    );
  }

  // 🔸 Other Page Variant
  return (
    <header className="inline-block bg-[#ffbe00] border-b border-[#051224]/20  shadow-lg sticky top-0 z-20">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={(toast.type === "success" ? "bg-green-600" : "bg-red-600") + " text-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 animate-bounce"}>
            {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        {/* Left Section: Back Button and Title */}
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 sm:p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
          )}
          <span className="text-white font-bold text-base sm:text-lg">
            {pageTitle}
          </span>
        </div>

        {/* Right Section: Table Info, Call Waiter, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Table Display */}
          <div className="flex items-center gap-2 bg-black px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-[12px]">
            <MapPin size={14} className="text-[#ffbe00]" />
            <span className="font-medium text-[#ffbe00] whitespace-nowrap">
              Table {tableNumber}
            </span>
          </div>

          {/* Call Waiter Button */}
          <button
            onClick={handleCallWaiterClick}
            className={(callActive ? "ring-2 ring-[#ffbe00] animate-pulse " : "") + "bg-black hover:bg-black/30 px-3 py-1.5 rounded-full text-[#ffbe00] font-medium text-xs sm:text-sm shadow flex items-center gap-1"}
          >
            <BellRing size={14} className="text-[#ffbe00]" /> Call Waiter
          </button>
          {callActive && (
            <span className="bg-green-600 text-white rounded-full px-2 py-0.5 text-[10px]">Active</span>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Logout"
            className="bg-black/80 hover:bg-black/10 text-[#ffbe00] px-3 py-1.5 rounded-md flex items-center gap-1 text-xs sm:text-sm font-medium transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
