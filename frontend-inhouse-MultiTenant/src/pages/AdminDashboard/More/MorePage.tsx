import { useState } from "react";
import { Menu, X } from "lucide-react";
import MorePageSidebar from "./MorePageSidebar";
import WaiterManagement from "./components/WaiterManagement";
import BillsOverview from "./components/BillsOverview";
import PricingSettings from "./components/PricingSettings";
import RecentBills from "./components/RecentBills";
import AdminPinSettings from "./components/security/AdminPinSettings";
import StaffPinSettings from "./components/security/StaffPinSettings";
import UPISettings from "./components/UPISettings";

export type MoreTab =
  | "staff"
  | "bills"
  | "settings"
  | "upi_settings"
  | "recent_bills"
  | "admin_pin"
  | "staff_pin";


const tabComponents: Record<MoreTab, React.ComponentType> = {
    staff: WaiterManagement,
    bills: BillsOverview,
    settings: PricingSettings,
    upi_settings: UPISettings,
    recent_bills: RecentBills,
    admin_pin: AdminPinSettings,
    staff_pin: StaffPinSettings
};

const tabTitles: Record<MoreTab, string> = {
    staff: "Waiter Management",
    bills: "Bills Overview",
    settings: "System Settings",
    upi_settings: "UPI Settings",
    recent_bills: "Recent Bills",
    admin_pin: "Admin PIN",
    staff_pin: "Staff PIN"
}


export default function MorePage() {
  const [activeTab, setActiveTab] = useState<MoreTab>("staff");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const ActiveComponent = tabComponents[activeTab];

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
      >
        <MorePageSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          closeSidebar={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with hamburger */}
        <header className="md:hidden flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800">
          <h1 className="text-lg font-bold text-yellow-400">{tabTitles[activeTab]}</h1>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-zinc-800"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 overflow-auto">
          <ActiveComponent />
        </main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}