import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ClipboardList,
  RefreshCw,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getOrder, type Order } from "../../../../api/admin/order.api";
import { getTables, type ApiTable } from "../../../../api/admin/table.api";
import RecentActivity from "./RecentActivity";

import { useTenant } from "../../../../context/TenantContext";

function Dashboard() {
  const { rid } = useTenant();

  // ====== Dashboard States ======
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [tablesOccupied, setTablesOccupied] = useState(0);
  const [totalTables, setTotalTables] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dummy line chart data for StatCards
  const revenueData = [
    { name: "Mon", value: 400 },
    { name: "Tue", value: 520 },
    { name: "Wed", value: 470 },
    { name: "Thu", value: 610 },
    { name: "Fri", value: 580 },
    { name: "Sat", value: 720 },
    { name: "Sun", value: 680 },
  ];

  // ====== Data Fetchers ======
  async function fetchTodayOrders() {
    if (!rid) return;
    try {
      const orders = (await getOrder(rid)) as Order[];
      console.log("Fetched orders:", orders); // Added log for the orders array
      const now = new Date();
      console.log("Current date for comparison:", now.toDateString());

      let revenue = 0;
      let count = 0;

      orders?.forEach((order) => {
        if (!order.createdAt || !order.createdAt.$date) {
          console.error("❌ Order missing createdAt.$date:", order);
          return;
        }

        console.log("Order createdAt.$date:", order.createdAt.$date);
        const created = new Date(order.createdAt.$date);

        if (isNaN(created.getTime())) {
            console.error("Invalid Date created from:", order.createdAt.$date);
            return;
        }
        console.log("Created Date object:", created.toDateString());

        if (
          created.getDate() === now.getDate() &&
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        ) {
          revenue += order.totalAmount ?? 0;
          count += 1;
        }
      });

      setTodayRevenue(revenue);
      setTodayOrders(count);
      console.log("Calculated Today's Revenue:", revenue); // Added log
      console.log("Calculated Today's Orders:", count); // Added log
    } catch (err) {
      console.error("❌ Failed to fetch today’s orders:", err);
    }
  }
  async function fetchTableStats() {
    if (!rid) return;
    try {
      const data = (await getTables(rid)) as ApiTable[];
      const total = data?.length || 0;
      const occupied = data?.filter((t) => t.status === "occupied").length || 0;

      setTablesOccupied(occupied);
      setTotalTables(total);
    } catch (err) {
      console.error("❌ Failed to fetch table stats:", err);
    }
  }

  // ====== Unified Auto Refresh ======
  useEffect(() => {
    if (!rid) return;
    async function refreshDashboard() {
      setIsRefreshing(true);
      await Promise.all([fetchTodayOrders(), fetchTableStats()]);
      setLastRefreshed(new Date().toLocaleTimeString());
      setIsRefreshing(false);
    }

    refreshDashboard();
    const interval = setInterval(refreshDashboard, 60000);
    return () => clearInterval(interval);
  }, [rid]);

  // ====== Reusable StatCard ======
  const StatCard = ({
    icon: Icon,
    label,
    value,
    subtitle,
    children,
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subtitle?: string;
    children: React.ReactNode;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative p-5 bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <h2 className="text-2xl font-bold text-gray-800 mt-1">{value}</h2>
          {subtitle && (
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-orange-50 text-orange-500">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {children}
    </motion.div>
  );

  // ====== Revenue Card ======
  const RevenueCard = () => (
    <StatCard
      icon={TrendingUp}
      label="Today's Revenue"
      value={`₹ ${todayRevenue.toLocaleString("en-IN")}`}
      subtitle="Compared to yesterday"
    >
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={revenueData}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="#16a34a"
            fill="url(#revenueGradient)"
            strokeWidth={2.5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255,255,255,0.8)",
              borderRadius: "10px",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </StatCard>
  );

  // ====== Orders Card (Animated Counter) ======
  const OrdersCard = () => {
    const count = useMotionValue(0);
    const spring = useSpring(count, { stiffness: 80, damping: 20 });
    const display = useTransform(spring, (val) => Math.floor(val));

    useEffect(() => {
      count.set(todayOrders);
    }, [todayOrders]);

    return (
      <StatCard icon={ClipboardList} label="Total Orders" value={todayOrders}>
        <div className="flex flex-col items-center justify-center h-24 relative">
          <p className="text-xs text-gray-400 mt-1 font-medium">
            {todayOrders === 0 ? "No orders yet" : "Orders today"}
          </p>
          <motion.div
            key={todayOrders}
            initial={{ opacity: 0.2, scale: 1 }}
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.08, 1] }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 rounded-2xl bg-blue-100/20 pointer-events-none"
          />
        </div>
      </StatCard>
    );
  };

  // ====== Tables Card (Donut Chart) ======
  const TablesCard = () => {
    const occupancy =
      totalTables > 0 ? Math.round((tablesOccupied / totalTables) * 100) : 0;

    const pieData = [
      { name: "Occupied", value: tablesOccupied },
      { name: "Available", value: totalTables - tablesOccupied },
    ];
    const COLORS = ["#f59e0b", "#e5e7eb"];

    return (
      <StatCard
        icon={UtensilsCrossed}
        label="Tables Occupied"
        value={`${tablesOccupied}/${totalTables}`}
        subtitle={`${occupancy}% occupancy`}
      >
        <ResponsiveContainer width="100%" height={90}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={40}
              paddingAngle={3}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val, name) => [`${val}`, name]}
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.8)",
                borderRadius: "10px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </StatCard>
    );
  };

  // ====== UI ======
  return (
    <div className="relative overflow-hidden min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full flex flex-col items-center py-10 relative z-10"
      >
        <div className="w-full max-w-6xl px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-800">
                <span className="animate-bounce">👋</span> Welcome back, Admin!
              </h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                Here’s today’s performance summary.
              </p>
              {lastRefreshed && (
                <p className="text-xs text-gray-400 mt-1">
                  ⏱ Last updated at {lastRefreshed}
                </p>
              )}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg shadow transition"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {/* ====== Stats Row ====== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <RevenueCard />
            <OrdersCard />
            <TablesCard />
          </div>

          {/* ====== Recent Activity ====== */}
          <div className="mt-10 mb-20 bg-white/70 backdrop-blur-md border border-gray-200 rounded-xl shadow-sm p-5">
            <RecentActivity />
          </div>

          <div className="pb-28"></div>
        </div>
      </motion.div>
    </div>
  );
}

export default Dashboard;