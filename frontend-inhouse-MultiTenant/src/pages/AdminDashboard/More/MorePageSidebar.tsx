import { Users, BarChart, Settings, Clock } from "lucide-react";
import React from "react";

type MoreTab = "staff" | "bills" | "settings" | "recent_bills";

export default function MorePageSidebar({
  activeTab,
  setActiveTab,
}: {
  activeTab: MoreTab;
  setActiveTab: React.Dispatch<React.SetStateAction<MoreTab>>;
}) {
  const menuItems: { id: MoreTab; label: string; icon: React.ElementType }[] = [
    { id: "staff", label: "Waiter Management", icon: Users },
    { id: "bills", label: "Bills Overview", icon: BarChart },
    { id: "settings", label: "System Settings", icon: Settings },
    { id: "recent_bills", label: "Recent Bills", icon: Clock },
  ];

  return (
    <div className="w-64 bg-white shadow-md">
      <div className="p-5">
        <h2 className="text-2xl font-bold">More</h2>
      </div>
      <nav className="mt-5">
        {menuItems.map((item) => (
          <a
            key={item.id}
            href="#"
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-200 ${
              activeTab === item.id ? "bg-gray-200" : ""
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
