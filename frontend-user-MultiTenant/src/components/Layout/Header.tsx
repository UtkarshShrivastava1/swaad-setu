import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCall, getCall } from "../../api/call.api";
import { useTenant } from "../../context/TenantContext";

export default function Header({
  variant = "menu",
  onBack,
  waitTime = "30–40 mins",
  pageTitle = "Page",
  onCallWaiter,
  searchBar,
  categoryTabs,
  table,
}) {
  const navigate = useNavigate();
  const { rid, tenant } = useTenant();
  const [isCalling, setIsCalling] = useState(false);
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
    if (isCalling || callActive) return; // Prevent action if already processing or active

    setIsCalling(true);
    try {
      // Handle passed-in function if it exists
      if (typeof onCallWaiter === "function") {
        await onCallWaiter();
        // The parent component is responsible for feedback, but we can assume success
        // and let the finally block handle the loading state.
        return;
      }

      if (!tableId) {
        showToast("error", "Table not selected");
        return; // This will go to finally
      }

      const res = await createCall(rid, {
        tableId,
        type: "bill",
        notes: "Requesting the bill please",
      });

      if (res?.status === "active") {
        try {
          sessionStorage.setItem("active_call", JSON.stringify(res));
        } catch (error) {
          console.error("Failed to set active_call in sessionStorage:", error);
        }
        setCallActive(true);
        showToast("success", "Waiter has been called!");
      } else {
        // If the call wasn't created as active, show an error.
        showToast("error", "Could not place call. Please try again.");
      }
    } catch (err) {
      console.error("Call waiter error:", err);
      showToast("error", "Failed to call waiter");
    } finally {
      setIsCalling(false);
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

            {/* ================= RIGHT: ACTIONS ================= */}
            <div className="flex justify-end items-center flex-1">
              <div className="flex items-center gap-2 sm:gap-3">
                {variant === "menu" && (
                  <span className="flex items-center gap-1 text-sm text-white">
                    <Clock size={14} />
                    {waitTime}
                  </span>
                )}

                <button
                  onClick={handleCallWaiterClick}
                  disabled={isCalling || callActive}
                  className={`relative flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 font-medium shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-black ${
                    isCalling
                      ? "cursor-wait bg-amber-500 border-amber-600 text-black"
                      : callActive
                        ? "cursor-default bg-emerald-600 border-emerald-700 text-white"
                        : "cursor-pointer bg-amber-400 border-amber-600 text-black hover:bg-amber-500 hover:shadow-lg"
                  }`}
                >
                  {isCalling ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Calling...</span>
                    </>
                  ) : callActive ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Waiter Called</span>
                    </>
                  ) : (
                    <>
                      <BellRing className="h-5 w-5" />
                      <span>Call Waiter</span>
                    </>
                  )}
                </button>

                {/* <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 border border-amber-600 shadow-md hover:shadow-lg transition focus:ring-2 focus:ring-black/40"
                >
                  <LogOut className="h-5 w-5 text-black" />
                </button> */}
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
