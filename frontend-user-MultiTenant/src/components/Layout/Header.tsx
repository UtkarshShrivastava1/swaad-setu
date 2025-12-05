import {
  AlertCircle,
  ArrowLeft,
  BellRing,
  CheckCircle2,
  Clock,
  LogOut,
  MapPin,
} from "lucide-react";
import { useState, useEffect } from "react";
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
  const { rid } = useTenant();
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

  /* ================= YELLOW MENU VARIANT ================= */
  if (variant === "menu") {
    return (
      <header className="sticky top-0 z-50 bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg border-b border-black/10">
        <Toast />

        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <h1 className="text-black font-black tracking-wide text-lg">Menu</h1>

          <div className="flex items-center flex-wrap gap-4">
            <span className="flex items-center gap-1 text-sm text-black">
              <MapPin size={14} />
              Table {tableNumber}
            </span>

            <span className="flex items-center gap-1 text-sm text-black">
              <Clock size={14} />
              {waitTime}
            </span>

            <button
              onClick={handleCallWaiterClick}
              className={`${
                callActive
                  ? "ring-2 ring-green-600 animate-pulse text-green-500"
                  : "text-yellow-400"
              } flex items-center gap-1 bg-black px-3 py-1.5 rounded-full font-semibold hover:bg-black/80 transition`}
            >
              <BellRing size={14} /> Call Waiter
            </button>

            <button
              onClick={handleLogout}
              title="Logout"
              className="bg-black/90 hover:bg-black text-yellow-400 px-3 py-1.5 rounded-full flex items-center gap-1 text-xs font-semibold transition"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {searchBar && (
          <div className="max-w-5xl mx-auto px-4 pb-2">{searchBar}</div>
        )}

        {categoryTabs && (
          <div className="max-w-7xl mx-auto px-4 pb-3">{categoryTabs}</div>
        )}
      </header>
    );
  }

  /* ================= YELLOW OTHER VARIANT ================= */
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg border-b border-black/10">
      <Toast />

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-black/10 transition"
            >
              <ArrowLeft size={20} className="text-black" />
            </button>
          )}
          <span className="text-black font-bold text-base sm:text-lg">
            {pageTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 text-sm text-black">
            <MapPin size={14} />
            Table {tableNumber}
          </span>

          <button
            onClick={handleCallWaiterClick}
            className={`${
              callActive
                ? "ring-2 ring-green-600 animate-pulse text-green-500"
                : "text-yellow-400"
            } bg-black hover:bg-black/80 px-3 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1`}
          >
            <BellRing size={14} /> Call Waiter
          </button>

          <button
            onClick={handleLogout}
            title="Logout"
            className="bg-black/90 hover:bg-black text-yellow-400 px-3 py-1.5 rounded-full flex items-center gap-1 text-xs font-semibold transition"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
