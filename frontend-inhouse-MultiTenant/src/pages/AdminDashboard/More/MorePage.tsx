import { useState } from "react";
import MorePageSidebar from "./MorePageSidebar";
import WaiterManagement from "./components/WaiterManagement";
import BillsOverview from "./components/BillsOverview";
import PricingSettings from "./components/PricingSettings";
import RecentBills from "./components/RecentBills";
import AdminPinSettings from "./components/security/AdminPinSettings";
import StaffPinSettings from "./components/security/StaffPinSettings";
import UPISettings from "./components/UPISettings";

export default function MorePage() {
  const [activeTab, setActiveTab] = useState<
    | "staff"
    | "bills"
    | "settings"
    | "upi_settings"
    | "recent_bills"
    | "admin_pin"
    | "staff_pin"
  >("staff");
  return (
    <div className="flex h-screen bg-gray-100">
      <MorePageSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-10 overflow-auto">
        {activeTab === "staff" && <WaiterManagement />}
        {activeTab === "bills" && <BillsOverview />}
        {activeTab === "settings" && <PricingSettings />}
        {activeTab === "upi_settings" && <UPISettings />}
        {activeTab === "recent_bills" && <RecentBills />}
        {activeTab === "admin_pin" && <AdminPinSettings />}
        {activeTab === "staff_pin" && <StaffPinSettings />}
      </div>
    </div>
  );
}
