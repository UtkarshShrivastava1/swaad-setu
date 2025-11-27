import { useState } from "react";
import { useNavigate } from "react-router-dom";

import FooterNav from "../components/Layout/Footer";
import Header from "../components/Layout/Header";
import MenuPage from "../pages/MenuPage";

import { createCall } from "../api/call.api";

import { useTenant } from "../context/TenantContext";

export default function UserDashboard() {
  const navigate = useNavigate();
  const { rid } = useTenant();

  const tableNumber = sessionStorage.getItem("resto_table_number") || "";
  const tableId = sessionStorage.getItem("resto_table_id") || "";

  const [activeTab, setActiveTab] = useState<"menu" | "orders" | "cart">(
    "menu"
  );
  const [view, setView] = useState<"list" | "edit" | "create">("list");

  const [isCalling, setIsCalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ---------------------------------------------------------
  //   CALL WAITER HANDLER
  // ---------------------------------------------------------
  const handleCallWaiter = async () => {
    if (!tableNumber && !tableId) {
      alert("Table not identified. Please scan QR again.");
      return;
    }

    try {
      setIsCalling(true);

      const payload = {
        tableNumber, // backend resolves to tableId
        type: "waiter",
        notes: "Customer requested assistance",
      };

      await createCall(rid, payload);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (err: any) {
      console.error("Call waiter error:", err);
      alert(err?.response?.data?.error || "Failed to call waiter");
    } finally {
      setIsCalling(false);
    }
  };

  // ---------------------------------------------------------
  //   RENDER
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header
        variant="menu"
        pageTitle="Menu"
        tableNumber={tableNumber}
        waitTime="30-40 mins"
        onCallWaiter={handleCallWaiter}
        onBack={() => navigate(-1)}
      />

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-slide-in">
          Waiter has been notified!
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {activeTab === "menu" && view === "list" && (
          <MenuPage setActiveTab={setActiveTab} />
        )}

        {/* Additional nested view logic kept same */}
      </main>

      {/* Footer */}
      <FooterNav
        activeTab={activeTab}
        onTabChange={(newTab) => {
          setActiveTab(newTab);
          setView("list");
        }}
        hasOrders={true}
      />

      {/* Loading Overlay */}
      {isCalling && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg px-6 py-4 text-center shadow-lg">
            <div className="text-lg font-semibold">Calling waiter…</div>
            <div className="text-sm text-gray-600">Please wait…</div>
          </div>
        </div>
      )}
    </div>
  );
}
