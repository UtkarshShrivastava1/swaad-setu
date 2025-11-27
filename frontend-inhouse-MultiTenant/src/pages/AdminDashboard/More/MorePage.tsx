import { useState } from "react";
import MorePageSidebar from "./MorePageSidebar";
import WaiterManagement from "./components/WaiterManagement";
import BillsOverview from "./components/BillsOverview";
import PricingSettings from "./components/PricingSettings";
import RecentBills from "./components/RecentBills";


export default function MorePage() {
    const [activeTab, setActiveTab] = useState("staff");
  return (
    <div className="flex h-screen bg-gray-100">
      <MorePageSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-10 overflow-auto">
        {activeTab === "staff" && <WaiterManagement />}
        {activeTab === "bills" && <BillsOverview />}
        {activeTab === "settings" && <PricingSettings />}
        {activeTab === "recent_bills" && <RecentBills />}
      </div>
    </div>
  );
}
