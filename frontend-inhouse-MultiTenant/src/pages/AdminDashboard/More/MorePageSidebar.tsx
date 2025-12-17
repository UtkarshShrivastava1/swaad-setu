import {
  Users,
  BarChart,
  Settings,
  Clock,
  Shield,
  CreditCard,
  X,
} from "lucide-react";
import React from "react";
import type { MoreTab } from "./MorePage";

export default function MorePageSidebar({
  activeTab,
  setActiveTab,
  closeSidebar,
}: {
  activeTab: MoreTab;
  setActiveTab: (tab: MoreTab) => void;
  closeSidebar: () => void;
}) {
  const menuItems: { id: MoreTab; label: string; icon: React.ElementType }[] = [
    { id: "staff", label: "Waiter Management", icon: Users },
    { id: "bills", label: "Bills Overview", icon: BarChart },
    { id: "settings", label: "System Settings", icon: Settings },
    { id: "upi_settings", label: "UPI Settings", icon: CreditCard },
    { id: "recent_bills", label: "Recent Bills", icon: Clock },
    { id: "admin_pin", label: "Admin PIN", icon: Shield },
    { id: "staff_pin", label: "Staff PIN", icon: Shield },
  ];

  const handleItemClick = (tabId: MoreTab) => {
    setActiveTab(tabId);
    // On mobile, the sidebar is controlled by isSidebarOpen state in the parent,
    // which closes on click via the overlay or this explicit call.
    if (window.innerWidth < 768) {
        closeSidebar();
    }
  };

  return (
    <div className="w-64 h-full bg-zinc-950 border-r border-zinc-800 shadow-lg flex flex-col">
      <div className="p-5 flex justify-between items-center border-b border-zinc-800">
        <h2 className="text-2xl font-bold text-yellow-400">More</h2>
        <button className="md:hidden p-2" onClick={closeSidebar}>
          <X size={20} />
        </button>
      </div>
      <nav className="mt-5 flex-1">
        {menuItems.map((item) => (
          <a
            key={item.id}
            href="#"
            onClick={(e) => {
                e.preventDefault();
                handleItemClick(item.id)
            }}
            className={`flex items-center px-6 py-3 text-zinc-300 hover:bg-yellow-500/10 hover:text-yellow-300 transition-colors ${
              activeTab === item.id ? "bg-yellow-500/15 text-yellow-300 border-r-4 border-yellow-400" : "border-r-4 border-transparent"
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}