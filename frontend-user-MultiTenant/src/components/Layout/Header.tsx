import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Clock,
  LogOut,
  MapPin,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCall, getCall } from "../../api/call.api";
import { useTenant } from "../../context/TenantContext";

export default function Header({
  variant = "menu",
  onBack,
  tableNumber = "Table 3",
  waitTime = "30–40 mins",
  pageTitle = "Page",
  onCallWaiter,
  searchBar,
  categoryTabs,
  table,
}) {
  const navigate = useNavigate();
  const { rid, tenant } = useTenant();
  const [callActive, setCallActive] = useState(() => {
    try {
      const activeCall = sessionStorage.getItem("active_call");
      if (activeCall) {
        const call = JSON.parse(activeCall);
        return call.status === "active";
      }
    } catch (error) {
      console.error("Failed to parse active_call from sessionStorage:", error);
    }
    return false;
  });
  const [toast, setToast] = useState<null | {
    type: "success" | "error";
    message: string;
  }>(null);

  const restaurantName = tenant?.restaurantName || "Restaurant Name";
  const dashboardTitle = variant === "menu" ? "Menu" : pageTitle;

  const tableId = table?._id;

  useEffect(() => {
    let intervalId: number | undefined;

    if (callActive) {
      const activeCallData = sessionStorage.getItem("active_call");
      if (activeCallData) {
        const call = JSON.parse(activeCallData);
        intervalId = setInterval(async () => {
          try {
            const updatedCall = await getCall(rid, call._id);
            if (updatedCall.status !== "active") {
              setCallActive(false);
              sessionStorage.removeItem("active_call");
              clearInterval(intervalId);
            }
          } catch (error) {
            console.error("Failed to get call status:", error);
            // Optional: handle error, maybe stop polling
          }
        }, 5000); // Poll every 5 seconds
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [callActive, rid]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const handleCallWaiterClick = async () => {
    if (typeof onCallWaiter === "function") {
      try {
        await onCallWaiter();
      } catch (error) {
        console.error("onCallWaiter function failed:", error);
      }
      return;
    }
    try {
      if (!tableId) {
        showToast("error", "Table not selected");
        return;
      }
      const res = await createCall(rid, {
        tableId,
        type: "bill",
        notes: "Requesting the bill please",
      });

      try {
        sessionStorage.setItem("active_call", JSON.stringify(res));
      } catch (error) {
        console.error("Failed to set active_call in sessionStorage:", error);
      }

      if (res?.status === "active") setCallActive(true);
      showToast("success", "Waiter called");
    } catch (err) {
      console.error("Call waiter error:", err);
      showToast("error", "Failed to call waiter");
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      sessionStorage.clear();
      localStorage.clear();
      navigate(`/t/${rid}`);
    }
  };

  const Toast = () =>
    toast && (
      <div className="fixed top-4 right-4 z-[9999]">
        <div
          className={`${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          } text-white rounded-xl shadow-2xl px-4 py-2 flex items-center gap-2 animate-in zoom-in`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      </div>
    );

  return (
    <header className="sticky top-0 z-50 w-full max-w-full overflow-x-hidden">
      <Toast />
      {/* 🌌 GLASS NAVBAR */}
      <div className="relative w-full bg-black backdrop-blur-xl border-b border-neutral-800 shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* subtle glass highlight */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* ================= LEFT ================= */}
            {/* ================= LEFT: LOGO ================= */}
            <div className="flex justify-start items-center flex-1">
              <img
                src="/logo.png"
                alt="SwaadSetu"
                className="h-8 sm:h-10 drop-shadow-[0_0_12px_rgba(245,158,11,0.15)]"
              />
            </div>

            {/* ================= CENTER: BRAND / TITLE ================= */}
            <div className="flex justify-center min-w-0">
              <div className="text-center min-w-0">
                <div className="text-base sm:text-lg font-semibold text-amber-400 truncate">
                  {restaurantName}
                </div>
                <div className="text-xs text-amber-500 tracking-wide">
                  {dashboardTitle}
                </div>
              </div>
            </div>

            {/* ================= RIGHT: ACTIONS ================= */}
            <div className="flex justify-end items-center flex-1">
              <div className="flex items-center gap-2 sm:gap-3">
                {variant === "menu" && (
                  <span className="flex items-center gap-1 text-sm text-white">
                    <Clock size={14} />
                    {waitTime}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-white">
                  <MapPin size={14} />
                  Table {tableNumber}
                </span>

                <button
                  onClick={handleCallWaiterClick}
                  className={`relative p-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 border border-amber-600 shadow-md hover:shadow-lg transition focus:ring-2 focus:ring-black/40 ${
                    callActive ? "ring-2 ring-green-600 animate-pulse" : ""
                  }`}
                >
                  <BellRing className="h-5 w-5 text-black" />
                  {callActive && (
                    <>
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 animate-ping opacity-60" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow">
                        !
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 border border-amber-600 shadow-md hover:shadow-lg transition focus:ring-2 focus:ring-black/40"
                >
                  <LogOut className="h-5 w-5 text-black" />
                </button>
              </div>
            </div>
          </div>

          {(searchBar || categoryTabs) && (
            <div className="md:hidden pb-3">
              {searchBar && (
                <div className="flex items-center bg-amber-400 rounded-xl px-3 py-2 gap-2 border border-amber-600 shadow-inner mb-2">
                  <Search className="h-4 w-4 text-black" />
                  {/* Assuming searchBar is an input or similar component that you want to style */}
                  {/* For now, just rendering it as is, or you might need to extract its input for styling */}
                  {searchBar}
                </div>
              )}
              {categoryTabs && (
                <div className="max-w-7xl mx-auto px-4 pb-3">
                  {categoryTabs}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
