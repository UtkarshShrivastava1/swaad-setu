import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Utensils,
  Receipt,
  Settings,
  LogOut,
  Bell,
  Table as TableIcon,
} from "lucide-react";

interface SidebarProps {
  userRole: "admin" | "staff";
  onLogout: () => void;
}

type LinkItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

export default function Sidebar({ userRole, onLogout }: SidebarProps) {
  const adminLinks: LinkItem[] = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      path: "/admin-dashboard",
    },
    {
      name: "Menu Management",
      icon: <Utensils size={18} />,
      path: "/admin/menu",
    },
    {
      name: "Staff Management",
      icon: <Users size={18} />,
      path: "/admin/staff",
    },
    {
      name: "Table Management",
      icon: <TableIcon size={18} />,
      path: "/admin/tables",
    },
    // keep these if you implement them; they won't break routing if route is absent
    {
      name: "Orders History",
      icon: <Receipt size={18} />,
      path: "/admin-dashboard/orders",
    },
    {
      name: "Settings",
      icon: <Settings size={18} />,
      path: "/admin-dashboard/settings",
    },
  ];

  const staffLinks: LinkItem[] = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      path: "/staff-dashboard",
    },
    // table-select is a separate route in your App; linking to the base path so user can pick a table
    { name: "Tables", icon: <TableIcon size={18} />, path: "/table-select" },
    {
      name: "Orders",
      icon: <Receipt size={18} />,
      path: "/staff-dashboard/orders",
    },
    {
      name: "Notifications",
      icon: <Bell size={18} />,
      path: "/staff-dashboard/notifications",
    },
  ];

  const links = userRole === "admin" ? adminLinks : staffLinks;

  const linkClass = (isActive: boolean) =>
    `flex items-center px-4 py-3 rounded-lg transition-colors ${
      isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
    }`;

  return (
    <aside className="h-screen bg-gray-900 text-white w-64 flex flex-col">
      <div className="p-5">
        <h1 className="text-2xl font-bold">Swad Setu</h1>
        <p className="text-gray-400 text-sm mt-1">
          {userRole === "admin" ? "Admin Panel" : "Staff Panel"}
        </p>
      </div>

      <nav className="flex-1 px-3 py-4" aria-label={`${userRole} navigation`}>
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                className={({ isActive }) => linkClass(isActive)}
                aria-current={({ isActive }) => (isActive ? "page" : undefined)}
              >
                <span className="mr-3">{link.icon}</span>
                <span>{link.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={onLogout}
          className="flex items-center w-full px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut size={18} className="mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
