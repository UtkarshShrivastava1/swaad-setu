import { motion } from "framer-motion";
import {
  ClipboardList,
  Loader2,
  RefreshCw,
  TrendingUp,
  UtensilsCrossed,
  CalendarRange,
  BarChart,
  Flame,
  Lightbulb,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getOrder, type Order } from "../../../../api/admin/order.api";
import { getTables, type ApiTable } from "../../../../api/admin/table.api";
import { generateDailyBriefing } from "../../../../api/gemini.api"; // Added for AI insights
import { useTenant } from "../../../../context/TenantContext";
import RecentActivity from "./RecentActivity";

function Dashboard() {
  const { rid } = useTenant();

  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [monthlyOrders, setMonthlyOrders] = useState(0);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<
    { name: string; value: number }[]
  >([]);
  const [tablesOccupied, setTablesOccupied] = useState(0);
  const [totalTables, setTotalTables] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dailyBriefing, setDailyBriefing] = useState<string | null>(null); // State for AI briefing
  const [loadingBriefing, setLoadingBriefing] = useState(false); // State for briefing loading
  const [peakHoursData, setPeakHoursData] = useState<
    { hour: string; orders: number }[]
  >([]);
  const [topItemsData, setTopItemsData] = useState<
    { name: string; count: number }[]
  >([]);
  const [revenueChange, setRevenueChange] = useState<number | null>(null);
  const [ordersChange, setOrdersChange] = useState<number | null>(null);

  const fetchAnalyticsData = useCallback(async (): Promise<{
    todayRevenue: number;
    todayCount: number;
    yesterdayRevenue: number;
    yesterdayCount: number;
    monthlyRevenue: number;
    monthlyCount: number;
    monthlyChartData: { name: string; value: number }[];
    peakHoursData: { hour: string; orders: number }[];
    topItemsData: { name: string; count: number }[];
  }> => {
    if (!rid)
      return {
        todayRevenue: 0,
        todayCount: 0,
        yesterdayRevenue: 0,
        yesterdayCount: 0,
        monthlyRevenue: 0,
        monthlyCount: 0,
        monthlyChartData: [],
        peakHoursData: [],
        topItemsData: [],
      };

    try {
      const orders = (await getOrder(rid)) as Order[];
      const now = new Date();
      const todayDate = now.getDate();
      const yesterdayDate = new Date(
        now.getTime() - 24 * 60 * 60 * 1000
      ).getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let todayRevenue = 0;
      let todayCount = 0;
      let yesterdayRevenue = 0;
      let yesterdayCount = 0;
      let monthlyRevenue = 0;
      let monthlyCount = 0;

      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const monthlyChartData = Array.from({ length: daysInMonth }, (_, i) => ({
        name: `${i + 1}`,
        value: 0,
      }));

      const peakHoursData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}`,
        orders: 0,
      }));

      const topItemsMap = new Map<string, number>();

      orders?.forEach((order) => {
        const rawDate = order.createdAt?.$date || order.createdAt || undefined;
        if (!rawDate) return;

        const created = new Date(
          typeof rawDate === "string" ? rawDate : rawDate.$date
        );
        if (isNaN(created.getTime())) return;

        const orderDay = created.getDate();
        const orderMonth = created.getMonth();
        const orderYear = created.getFullYear();

        // Check for current month
        if (orderYear === currentYear && orderMonth === currentMonth) {
          monthlyRevenue += order.totalAmount ?? 0;
          monthlyCount += 1;
          monthlyChartData[orderDay - 1].value += order.totalAmount ?? 0;

          // Check for today
          if (orderDay === todayDate) {
            todayRevenue += order.totalAmount ?? 0;
            todayCount += 1;
            const orderHour = created.getHours();
            peakHoursData[orderHour].orders += 1;

            order.items.forEach((item) => {
              const count = topItemsMap.get(item.name) || 0;
              topItemsMap.set(item.name, count + item.quantity);
            });
          }
          // Check for yesterday
          else if (orderDay === yesterdayDate) {
            yesterdayRevenue += order.totalAmount ?? 0;
            yesterdayCount += 1;
          }
        }
      });

      const topItemsData = Array.from(topItemsMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        todayRevenue,
        todayCount,
        yesterdayRevenue,
        yesterdayCount,
        monthlyRevenue,
        monthlyCount,
        monthlyChartData,
        peakHoursData,
        topItemsData,
      };
    } catch (err) {
      console.error("❌ Failed to fetch analytics data:", err);
      return {
        todayRevenue: 0,
        todayCount: 0,
        yesterdayRevenue: 0,
        yesterdayCount: 0,
        monthlyRevenue: 0,
        monthlyCount: 0,
        monthlyChartData: [],
        peakHoursData: [],
        topItemsData: [],
      };
    }
  }, [rid]);

  const fetchTableStats = useCallback(async (): Promise<{
    occupied: number;
    total: number;
  }> => {
    if (!rid) return { occupied: 0, total: 0 };
    try {
      const data: ApiTable[] = await getTables(rid);

      const total = data?.length || 0;
      const occupied =
        data?.filter((t) => t.status === "occupied").length || 0;

      return { occupied, total };
    } catch (err) {
      console.error("❌ Failed to fetch table stats:", err);
      return { occupied: 0, total: 0 };
    }
  }, [rid]);

  const [lastBriefingGenerationAttempt, setLastBriefingGenerationAttempt] =
    useState<number>(0);

  const [lastDashboardRefreshAttempt, setLastDashboardRefreshAttempt] =
    useState<number>(0);

  const calculatePercentageChange = useCallback(
    (current: number, previous: number): number | null => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return ((current - previous) / previous) * 100;
    },
    []
  );

  const refreshDashboard = useCallback(async () => {
    if (!rid) return;

    if (
      Date.now() - lastDashboardRefreshAttempt < 15000 &&
      lastDashboardRefreshAttempt !== 0
    ) {
      console.log("Skipping dashboard refresh due to backend API cooldown.");
      return;
    }

    setIsRefreshing(true);
    setLastDashboardRefreshAttempt(Date.now());

    const [analyticsData, tablesData] = await Promise.all([
      fetchAnalyticsData(),
      fetchTableStats(),
    ]);

    setTodayRevenue(analyticsData.todayRevenue);
    setTodayOrders(analyticsData.todayCount);
    setMonthlyRevenue(analyticsData.monthlyRevenue);
    setMonthlyOrders(analyticsData.monthlyCount);
    setMonthlyRevenueData(analyticsData.monthlyChartData);
    setPeakHoursData(analyticsData.peakHoursData);
    setTopItemsData(analyticsData.topItemsData);
    setTablesOccupied(tablesData.occupied);
    setTotalTables(tablesData.total);

    setRevenueChange(
      calculatePercentageChange(
        analyticsData.todayRevenue,
        analyticsData.yesterdayRevenue
      )
    );
    setOrdersChange(
      calculatePercentageChange(
        analyticsData.todayCount,
        analyticsData.yesterdayCount
      )
    );

    setLastRefreshed(new Date().toLocaleTimeString());
    setIsRefreshing(false);

    if (
      Date.now() - lastBriefingGenerationAttempt < 30000 &&
      lastBriefingGenerationAttempt !== 0
    ) {
      console.log("Skipping daily briefing generation due to cooldown.");
      setLoadingBriefing(false);
      return;
    }

    setLoadingBriefing(true);
    setLastBriefingGenerationAttempt(Date.now());
    try {
      const briefing = await generateDailyBriefing(
        rid,
        analyticsData.todayRevenue,
        analyticsData.todayCount,
        analyticsData.monthlyRevenue,
        tablesData.occupied,
        tablesData.total,
        analyticsData.topItemsData,
        analyticsData.peakHoursData
      );
      setDailyBriefing(briefing);
    } catch (error) {
      console.error("Error generating daily briefing:", error);
      setDailyBriefing("Failed to generate daily insights.");
    } finally {
      setLoadingBriefing(false);
    }
  }, [
    rid,
    lastBriefingGenerationAttempt,
    lastDashboardRefreshAttempt,
    fetchAnalyticsData,
    fetchTableStats,
    calculatePercentageChange,
  ]);

  useEffect(() => {
    refreshDashboard();
    const interval = setInterval(refreshDashboard, 60000);
    return () => clearInterval(interval);
  }, [rid, refreshDashboard]);

  const ChangePill = ({ value }: { value: number | null }) => {
    if (value === null) return null;

    const isPositive = value >= 0;
    const color = isPositive ? "text-green-600" : "text-red-600";
    const bgColor = isPositive ? "bg-green-100" : "bg-red-100";
    const Icon = isPositive ? ArrowUp : ArrowDown;

    return (
      <div
        className={`flex items-center gap-1 text-xs font-semibold ${bgColor} ${color} px-2 py-1 rounded-full`}
      >
        <Icon className="w-3 h-3" />
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  // ===== Premium Light Stat Card =====
  const StatCard = ({
    icon: Icon,
    label,
    value,
    subtitle,
    change,
    children,
    color = "orange",
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subtitle?: string;
    change?: number | null;
    children?: React.ReactNode;
    color?: "orange" | "purple";
  }) => {
    const colorClasses = {
      orange: {
        bg: "bg-orange-50",
        text: "text-orange-600",
        gradientFrom: "from-orange-300",
        gradientTo: "to-orange-300",
        gradientVia: "via-orange-400",
        hoverBorder: "hover:border-orange-400",
        ring: "ring-orange-300",
      },
      purple: {
        bg: "bg-purple-50",
        text: "text-purple-600",
        gradientFrom: "from-purple-300",
        gradientTo: "to-purple-300",
        gradientVia: "via-purple-400",
        hoverBorder: "hover:border-purple-400",
        ring: "ring-purple-300",
      },
    };
    const selectedColor = colorClasses[color];

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -4 }}
        className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg p-6 transition-all"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
              {label}
            </p>
            <div className="flex items-end gap-3 mt-1">
              <h2 className="text-3xl font-extrabold text-gray-900 leading-none">
                {value}
              </h2>
              {change !== undefined && <ChangePill value={change} />}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div
            className={`p-3 rounded-xl ${selectedColor.bg} ${selectedColor.text}`}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>
        {children}
      </motion.div>
    );
  };

  const RevenueCard = () => (
    <StatCard
      icon={TrendingUp}
      label="Today's Revenue"
      value={`₹ ${todayRevenue.toLocaleString("en-IN")}`}
      subtitle="vs. yesterday"
      change={revenueChange}
      color="orange"
    />
  );

  const MonthlyRevenueCard = () => (
    <StatCard
      icon={CalendarRange}
      label="This Month's Revenue"
      value={`₹ ${monthlyRevenue.toLocaleString("en-IN")}`}
      subtitle={`From ${monthlyOrders} orders this month`}
      color="purple"
    >
      <ResponsiveContainer width="100%" height={90}>
        <AreaChart data={monthlyRevenueData}>
          <defs>
            <linearGradient id="monthlyRevGradLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="#8b5cf6"
            fill="url(#monthlyRevGradLight)"
            strokeWidth={3}
          />
          <Tooltip
            formatter={(value: number) => [
              `₹ ${value.toLocaleString("en-IN")}`,
              "Revenue",
            ]}
            labelFormatter={(label) => `Day ${label}`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </StatCard>
  );

  const OrdersCard = () => (
    <StatCard
      icon={ClipboardList}
      label="Orders Today"
      value={todayOrders}
      subtitle="vs. yesterday"
      change={ordersChange}
    />
  );

  const TablesCard = () => {
    const occupancy =
      totalTables > 0 ? Math.round((tablesOccupied / totalTables) * 100) : 0;

    const pieData = [
      { name: "Occupied", value: tablesOccupied },
      { name: "Available", value: totalTables - tablesOccupied },
    ];
    const COLORS = ["#fb923c", "#e5e7eb"];

    return (
      <StatCard
        icon={UtensilsCrossed}
        label="Table Occupancy"
        value={`${tablesOccupied}/${totalTables}`}
        subtitle={`${occupancy}% in use`}
      >
        <ResponsiveContainer width="100%" height={90}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={42}
              paddingAngle={3}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </StatCard>
    );
  };

  const PeakHoursChart = () => {
    const formatHour = (hour: string) => {
      const h = parseInt(hour, 10);
      if (h === 0) return "12 AM";
      if (h === 12) return "12 PM";
      if (h < 12) return `${h} AM`;
      return `${h - 12} PM`;
    };

    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm col-span-1 lg:col-span-2 h-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
              Peak Hours Analysis
            </p>
            <h2 className="text-xl font-extrabold text-gray-900 mt-1">
              Today's Order Volume
            </h2>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <BarChart className="w-6 h-6" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <RechartsBarChart data={peakHoursData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="hour"
              tickFormatter={formatHour}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number, _name, props) => [
                value,
                `Orders at ${formatHour(props.payload.hour)}`,
              ]}
              labelFormatter={() => ""}
              cursor={{ fill: "rgba(167, 139, 250, 0.1)" }}
            />
            <Bar dataKey="orders" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const TopSellingItems = () => {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
              Top Selling Items
            </p>
            <h2 className="text-xl font-extrabold text-gray-900 mt-1">
              Today's Hot Sellers
            </h2>
          </div>
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
            <Flame className="w-6 h-6" />
          </div>
        </div>
        <div className="space-y-3">
          {topItemsData.length > 0 ? (
            topItemsData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <p className="font-medium text-gray-800 capitalize">
                  {item.name}
                </p>
                <p className="font-bold text-gray-900 bg-gray-100 text-sm px-2 py-0.5 rounded">
                  {item.count} sold
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No sales data for today yet.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full flex justify-center py-10"
      >
        <div className="w-full max-w-7xl px-4">
          {/* HERO */}
          <div className="relative mb-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-orange-300 via-orange-400 to-orange-300" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">
                  👋 Welcome back, Admin
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Here’s a live snapshot of today’s performance.
                </p>

                {lastRefreshed && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last updated at {lastRefreshed}
                  </p>
                )}

                <div className="mt-4 flex items-start gap-3 max-w-xl p-3 rounded-lg bg-orange-50/60 border border-orange-200 text-orange-900 shadow-inner">
                  <Lightbulb className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="text-sm italic">
                    {loadingBriefing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating Actionable Insight…</span>
                      </div>
                    ) : dailyBriefing ? (
                      <p>{dailyBriefing}</p>
                    ) : (
                      <p>
                        AI-powered insights for today's performance will appear
                        here.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Live Sync
                </div>

                <button
                  onClick={refreshDashboard}
                  disabled={isRefreshing}
                  title="Refresh Dashboard"
                  className="group relative flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 bg-white shadow-sm hover:shadow-md hover:border-orange-400 transition active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 text-gray-600 group-hover:text-orange-500 ${
                      isRefreshing ? "animate-spin text-orange-500" : ""
                    }`}
                  />

                  <span className="pointer-events-none absolute inset-0 rounded-full ring-0 ring-orange-300 group-hover:ring-2 transition-all" />
                </button>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <RevenueCard />
            <MonthlyRevenueCard />
            <OrdersCard />
            <TablesCard />
          </div>

          {/* SECONDARY ANALYTICS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <PeakHoursChart />
            <TopSellingItems />
          </div>

          {/* RECENT ACTIVITY */}
          <div className="mb-12">
            <RecentActivity />
          </div>

          <div className="pb-28" />
        </div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
