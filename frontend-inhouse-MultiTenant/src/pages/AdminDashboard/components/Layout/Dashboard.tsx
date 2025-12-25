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
import { getTables, type ApiTable } from "../../../../api/admin/table.api";
import { generateDailyBriefing } from "../../../../api/gemini.api";
import { useTenant } from "../../../../context/TenantContext";
import RecentActivity from "./RecentActivity";
import { getBillHistory, type Bill } from "../../../../api/admin/bill.api";

function Dashboard() {
  const { rid } = useTenant();

  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [monthlyOrders, setMonthlyOrders] = useState(0);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<{ name: string; value: number }[]>([]);
  const [tablesOccupied, setTablesOccupied] = useState(0);
  const [totalTables, setTotalTables] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dailyBriefing, setDailyBriefing] = useState<string | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [peakHoursData, setPeakHoursData] = useState<{ hour: string; orders: number }[]>([]);
  const [topItemsData, setTopItemsData] = useState<{ name: string; count: number }[]>([]);
  const [revenueChange, setRevenueChange] = useState<number | null>(null);
  const [ordersChange, setOrdersChange] = useState<number | null>(null);

  const fetchAnalyticsData = useCallback(async (): Promise<any> => {
    if (!rid) return { todayRevenue: 0, todayCount: 0, yesterdayRevenue: 0, yesterdayCount: 0, monthlyRevenue: 0, monthlyCount: 0, monthlyChartData: [], peakHoursData: [], topItemsData: [] };
    try {
      const bills = (await getBillHistory(rid)) as Bill[];
      console.log("Fetched bills:", bills);
      const now = new Date();
      const todayDate = now.getDate();
      const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      let todayRevenue = 0, todayCount = 0, yesterdayRevenue = 0, yesterdayCount = 0, monthlyRevenue = 0, monthlyCount = 0;
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const monthlyChartData = Array.from({ length: daysInMonth }, (_, i) => ({ name: `${i + 1}`, value: 0 }));
      const peakHoursData = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}`, orders: 0 }));
      const topItemsMap = new Map<string, number>();
      bills.forEach((bill) => {
        if (bill.status !== "paid") return;
        const rawDate = bill.paidAt?.$date || bill.paidAt || undefined;
        if (!rawDate) return;
        const created = new Date(typeof rawDate === "string" ? rawDate : rawDate.$date);
        if (isNaN(created.getTime())) return;
        const billDay = created.getDate();
        const billMonth = created.getMonth();
        const billYear = created.getFullYear();
        if (billYear === currentYear && billMonth === currentMonth) {
          monthlyRevenue += bill.totalAmount ?? 0;
          monthlyCount += 1;
          monthlyChartData[billDay - 1].value += bill.totalAmount ?? 0;
          if (billDay === todayDate) {
            todayRevenue += bill.totalAmount ?? 0;
            todayCount += 1;
            const billHour = created.getHours();
            peakHoursData[billHour].orders += 1;
            bill.items.forEach((item) => {
              const count = topItemsMap.get(item.name) || 0;
              topItemsMap.set(item.name, count + item.qty);
            });
          } else if (billDay === yesterdayDate) {
            yesterdayRevenue += bill.totalAmount ?? 0;
            yesterdayCount += 1;
          }
        }
      });
      const topItemsData = Array.from(topItemsMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
      return { todayRevenue, todayCount, yesterdayRevenue, yesterdayCount, monthlyRevenue, monthlyCount, monthlyChartData, peakHoursData, topItemsData };
    } catch (err) {
      console.error("❌ Failed to fetch analytics data:", err);
      return { todayRevenue: 0, todayCount: 0, yesterdayRevenue: 0, yesterdayCount: 0, monthlyRevenue: 0, monthlyCount: 0, monthlyChartData: [], peakHoursData: [], topItemsData: [] };
    }
  }, [rid]);

  const fetchTableStats = useCallback(async (): Promise<any> => {
    if (!rid) return { occupied: 0, total: 0 };
    try {
      const data: ApiTable[] = await getTables(rid);
      const total = data?.length || 0;
      const occupied = data?.filter((t) => t.status === "occupied").length || 0;
      return { occupied, total };
    } catch (err) {
      console.error("❌ Failed to fetch table stats:", err);
      return { occupied: 0, total: 0 };
    }
  }, [rid]);

  const [lastBriefingGenerationAttempt, setLastBriefingGenerationAttempt] = useState<number>(0);
  const [lastDashboardRefreshAttempt, setLastDashboardRefreshAttempt] = useState<number>(0);

  const calculatePercentageChange = useCallback((current: number, previous: number): number | null => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    }, []);

  const refreshDashboard = useCallback(async () => {
    if (!rid) return;
    if (Date.now() - lastDashboardRefreshAttempt < 15000 && lastDashboardRefreshAttempt !== 0) return;
    setIsRefreshing(true);
    setLastDashboardRefreshAttempt(Date.now());
    const [analyticsData, tablesData] = await Promise.all([ fetchAnalyticsData(), fetchTableStats() ]);
    setTodayRevenue(analyticsData.todayRevenue);
    setTodayOrders(analyticsData.todayCount);
    setMonthlyRevenue(analyticsData.monthlyRevenue);
    setMonthlyOrders(analyticsData.monthlyCount);
    setMonthlyRevenueData(analyticsData.monthlyChartData);
    setPeakHoursData(analyticsData.peakHoursData);
    setTopItemsData(analyticsData.topItemsData);
    setTablesOccupied(tablesData.occupied);
    setTotalTables(tablesData.total);
    setRevenueChange(calculatePercentageChange(analyticsData.todayRevenue, analyticsData.yesterdayRevenue));
    setOrdersChange(calculatePercentageChange(analyticsData.todayCount, analyticsData.yesterdayCount));
    setLastRefreshed(new Date().toLocaleTimeString());
    setIsRefreshing(false);
    if (Date.now() - lastBriefingGenerationAttempt < 30000 && lastBriefingGenerationAttempt !== 0) return;
    setLoadingBriefing(true);
    setLastBriefingGenerationAttempt(Date.now());
    try {
      const briefing = await generateDailyBriefing(rid, analyticsData.todayRevenue, analyticsData.todayCount, analyticsData.monthlyRevenue, tablesData.occupied, tablesData.total, analyticsData.topItemsData, analyticsData.peakHoursData);
      setDailyBriefing(briefing);
    } catch (error) {
      console.error("Error generating daily briefing:", error);
      setDailyBriefing("Failed to generate daily insights.");
    } finally {
      setLoadingBriefing(false);
    }
  }, [ rid, lastBriefingGenerationAttempt, lastDashboardRefreshAttempt, fetchAnalyticsData, fetchTableStats, calculatePercentageChange ]);

  useEffect(() => {
    refreshDashboard();
    const interval = setInterval(refreshDashboard, 60000);
    return () => clearInterval(interval);
  }, [rid, refreshDashboard]);

  const ChangePill = ({ value }: { value: number | null }) => {
    if (value === null) return null;
    const isPositive = value >= 0;
    const color = isPositive ? "text-emerald-400" : "text-red-400";
    const bgColor = isPositive ? "bg-emerald-500/10" : "bg-red-500/10";
    const Icon = isPositive ? ArrowUp : ArrowDown;
    return (
      <div className={`flex items-center gap-1 text-xs font-semibold ${bgColor} ${color} px-2 py-1 rounded-full`}>
        <Icon className="w-3 h-3" />
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  const StatCard = ({ icon: Icon, label, value, subtitle, change, children, color = "yellow" }: { icon: React.ElementType; label: string; value: string | number; subtitle?: string; change?: number | null; children?: React.ReactNode; color?: "yellow" | "purple" }) => {
    const colorClasses = {
      yellow: { bg: "bg-yellow-500/15", text: "text-yellow-400" },
      purple: { bg: "bg-purple-500/15", text: "text-purple-400" },
    };
    const selectedColor = colorClasses[color];

    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} whileHover={{ y: -4, borderColor: "#a1a1aa" }} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400 font-semibold">{label}</p>
            <div className="flex items-end gap-3 mt-1">
              <h2 className="text-3xl font-extrabold text-white leading-none">{value}</h2>
              {change !== undefined && <ChangePill value={change} />}
            </div>
            {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${selectedColor.bg} ${selectedColor.text}`}><Icon className="w-6 h-6" /></div>
        </div>
        {children}
      </motion.div>
    );
  };

  const ChartCard = ({title, subtitle, icon: Icon, color="purple", children} : any) => (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 col-span-1 lg:col-span-2 h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-400 font-semibold">{subtitle}</p>
          <h2 className="text-xl font-extrabold text-white mt-1">{title}</h2>
        </div>
        <div className={`p-3 rounded-xl ${color === 'purple' ? 'bg-purple-500/15 text-purple-400' : 'bg-yellow-500/15 text-yellow-400'}`}><Icon className="w-6 h-6" /></div>
      </div>
      {children}
    </div>
  );

  const RevenueCard = () => ( <StatCard icon={TrendingUp} label="Today's Revenue" value={`₹ ${todayRevenue.toLocaleString("en-IN")}`} subtitle="vs. yesterday" change={revenueChange} color="yellow" /> );
  const MonthlyRevenueCard = () => ( <StatCard icon={CalendarRange} label="This Month's Revenue" value={`₹ ${monthlyRevenue.toLocaleString("en-IN")}`} subtitle={`From ${monthlyOrders} orders this month`} color="purple"> <ResponsiveContainer width="100%" height={90}> <AreaChart data={monthlyRevenueData}> <defs> <linearGradient id="monthlyRevGradDark" x1="0" y1="0" x2="0" y2="1"> <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} /> <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.05} /> </linearGradient> </defs> <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#monthlyRevGradDark)" strokeWidth={3} /> <Tooltip contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46' }} formatter={(value: number) => [`₹ ${value.toLocaleString("en-IN")}`, "Revenue"]} labelFormatter={(label) => `Day ${label}`} /> </AreaChart> </ResponsiveContainer> </StatCard> );
  const OrdersCard = () => ( <StatCard icon={ClipboardList} label="Orders Today" value={todayOrders} subtitle="vs. yesterday" change={ordersChange} color="yellow" /> );
  const TablesCard = () => { const occupancy = totalTables > 0 ? Math.round((tablesOccupied / totalTables) * 100) : 0; const pieData = [{ name: "Occupied", value: tablesOccupied }, { name: "Available", value: totalTables - tablesOccupied }]; const COLORS = ["#facc15", "#52525b"]; return ( <StatCard icon={UtensilsCrossed} label="Table Occupancy" value={`${tablesOccupied}/${totalTables}`} subtitle={`${occupancy}% in use`} color="yellow"> <ResponsiveContainer width="100%" height={90}> <PieChart> <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={32} outerRadius={42} paddingAngle={3}> {pieData.map((_, i) => ( <Cell key={i} fill={COLORS[i % COLORS.length]} /> ))} </Pie> <Tooltip contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46' }} /> </PieChart> </ResponsiveContainer> </StatCard> ); };
  const PeakHoursChart = () => { const formatHour = (hour: string) => { const h = parseInt(hour, 10); if (h === 0) return "12 AM"; if (h === 12) return "12 PM"; if (h < 12) return `${h} AM`; return `${h - 12} PM`; }; return ( <ChartCard title="Today's Order Volume" subtitle="Peak Hours Analysis" icon={BarChart} color="purple"> <ResponsiveContainer width="100%" height={260}> <RechartsBarChart data={peakHoursData}> <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" /> <XAxis dataKey="hour" tickFormatter={formatHour} tick={{ fontSize: 12, fill: "#a1a1aa" }} axisLine={false} tickLine={false} /> <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#a1a1aa" }} axisLine={false} tickLine={false} /> <Tooltip contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46' }} formatter={(value: number, _name, props) => [value, `Orders at ${formatHour(props.payload.hour)}`]} labelFormatter={() => ""} cursor={{ fill: "rgba(167, 139, 250, 0.1)" }} /> <Bar dataKey="orders" fill="#a78bfa" radius={[4, 4, 0, 0]} /> </RechartsBarChart> </ResponsiveContainer> </ChartCard> ); };
  const TopSellingItems = () => { return ( <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 h-full"> <div className="flex items-start justify-between mb-4"> <div> <p className="text-xs uppercase tracking-wide text-zinc-400 font-semibold">Top Selling Items</p> <h2 className="text-xl font-extrabold text-white mt-1">Today's Hot Sellers</h2> </div> <div className="p-3 rounded-xl bg-yellow-500/15 text-yellow-400"> <Flame className="w-6 h-6" /> </div> </div> <div className="space-y-3"> {topItemsData.length > 0 ? ( topItemsData.map((item, index) => ( <div key={index} className="flex items-center justify-between"> <p className="font-medium text-zinc-300 capitalize">{item.name}</p> <p className="font-bold text-yellow-400 bg-zinc-800 text-sm px-2 py-0.5 rounded">{item.count} sold</p> </div> )) ) : ( <p className="text-sm text-zinc-500 text-center py-8">No sales data for today yet.</p> )} </div> </div> ); };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-300">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full flex justify-center py-8">
        <div className="w-full max-w-7xl px-4">
          <div className="relative mb-10 rounded-2xl border border-yellow-500/30 bg-zinc-950 p-6 shadow-lg shadow-yellow-500/5 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-extrabold text-yellow-400">👋 Welcome back, Admin</h1>
                <p className="text-sm text-zinc-400 mt-1">Here’s a live snapshot of today’s performance.</p>
                {lastRefreshed && <p className="text-xs text-zinc-500 mt-1">Last updated at {lastRefreshed}</p>}
                <div className="mt-4 flex items-start gap-3 max-w-xl p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/20 text-yellow-300">
                  <Lightbulb className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="text-sm italic">
                    {loadingBriefing ? (
                      <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span>Generating Actionable Insight…</span></div>
                    ) : dailyBriefing ? (
                      <p>{dailyBriefing}</p>
                    ) : (
                      <p>AI-powered insights for today's performance will appear here.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Live Sync
                </div>
                 <button onClick={refreshDashboard} disabled={isRefreshing} title="Refresh Dashboard" className="group relative flex items-center justify-center h-10 w-10 rounded-full border border-zinc-700 bg-zinc-800 shadow-sm hover:shadow-md hover:border-yellow-400 transition active:scale-95 disabled:opacity-60">
                  <RefreshCw className={`h-4 w-4 text-zinc-400 group-hover:text-yellow-400 ${isRefreshing ? "animate-spin text-yellow-400" : ""}`} />
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <RevenueCard />
            <MonthlyRevenueCard />
            <OrdersCard />
            <TablesCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <PeakHoursChart />
            <TopSellingItems />
          </div>
          <div className="mb-12"><RecentActivity /></div>
          <div className="pb-28" />
        </div>
      </motion.div>
    </div>
  );
}

export default Dashboard;