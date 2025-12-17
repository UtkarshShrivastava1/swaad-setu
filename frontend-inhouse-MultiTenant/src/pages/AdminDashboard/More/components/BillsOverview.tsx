import { BarChart, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { type ApiBill, getBillsHistory } from "../../../../api/staff/bill.api";
import { generateBillBriefing } from "../../../../api/gemini.api";
import { useTenant } from "../../../../context/TenantContext";

type BillData = ApiBill;

export default function BillsOverview() {
  const { rid } = useTenant();

  const [bills, setBills] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(true);

  const [billBriefing, setBillBriefing] = useState<string | null>(null);
  const [loadingBillBriefing, setLoadingBillBriefing] = useState(false);
  const [
    lastBillBriefingGenerationAttempt,
    setLastBillBriefingGenerationAttempt,
  ] = useState(0);

  useEffect(() => {
    const getBills = async () => {
      if (!rid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await getBillsHistory(rid, {}); // Fetch all for overview
        setBills(response.bills || []);
      } catch (error) {
        console.error("Failed to fetch bills:", error);
        setBills([]);
      } finally {
        setLoading(false);
      }
    };
    getBills();
  }, [rid]);

  const today = new Date();
  const paidTodayBills = bills.filter((bill) => {
    const billUpdatedAt = new Date(bill.updatedAt || bill.createdAt || "");
    return (
      !isNaN(billUpdatedAt.getTime()) &&
      bill.paymentStatus === "paid" &&
      billUpdatedAt.getDate() === today.getDate() &&
      billUpdatedAt.getMonth() === today.getMonth() &&
      billUpdatedAt.getFullYear() === today.getFullYear()
    );
  });

  const billsSummary = {
    activeBills: bills.filter((bill) => bill.status !== "completed").length,
    paidToday: paidTodayBills.length,
    revenueToday: paidTodayBills.reduce((sum, bill) => sum + (bill.total || 0), 0),
    avgBillValue:
      bills.length > 0
        ? bills.reduce((sum, bill) => sum + (bill.total || 0), 0) / bills.length
        : 0,
  };

  useEffect(() => {
    if (!rid || loading || bills.length === 0) {
      setBillBriefing(null);
      return;
    }

    if (Date.now() - lastBillBriefingGenerationAttempt < 30000) {
      return;
    }

    const generateBriefing = async () => {
      setLoadingBillBriefing(true);
      setLastBillBriefingGenerationAttempt(Date.now());
      try {
        const briefing = await generateBillBriefing(
          rid,
          billsSummary.activeBills,
          billsSummary.paidToday,
          billsSummary.revenueToday,
          billsSummary.avgBillValue
        );
        setBillBriefing(briefing);
      } catch (error) {
        console.error("Error generating bill briefing:", error);
        setBillBriefing("Failed to generate bill insights.");
      } finally {
        setLoadingBillBriefing(false);
      }
    };
    generateBriefing();
  }, [rid, loading, bills.length, lastBillBriefingGenerationAttempt]); // Simplified dependencies

  const kpiData = [
    { title: "Active Bills", value: billsSummary.activeBills, note: "Open & in-progress bills" },
    { title: "Paid Today", value: billsSummary.paidToday, note: "Settled transactions today", color: "text-emerald-400" },
    { title: "Revenue Today", value: `₹ ${billsSummary.revenueToday.toLocaleString()}`, note: "Cashflow generated today", color: "text-orange-400" },
    { title: "Avg Bill Value", value: `₹ ${Math.round(billsSummary.avgBillValue).toLocaleString()}`, note: "Average customer spend", color: "text-indigo-400" },
  ];

  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-full max-w-4xl bg-zinc-950 border border-yellow-500/30 rounded-2xl shadow-[0_0_35px_rgba(250,204,21,0.15)] p-6">
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-500/15 text-yellow-400">
              <BarChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-yellow-400">Bills Overview</h2>
              <p className="text-sm text-zinc-400">A summary of billing activity</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-xl border border-blue-500/30 bg-blue-900/20 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                <div className="flex-1 text-blue-300 text-sm italic">
                  {loadingBillBriefing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                      <span>Generating smart billing insights…</span>
                    </div>
                  ) : billBriefing ? (
                    <p>{billBriefing}</p>
                  ) : (
                    <p>AI-powered bill insights will appear here.</p>
                  )}
                </div>
              </div>
            </div>

            {bills.length === 0 ? (
              <div className="text-center text-zinc-500 py-16 rounded-lg bg-zinc-900 border border-dashed border-zinc-700">
                No bills data available to generate an overview.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiData.map(kpi => (
                  <div key={kpi.title} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:bg-zinc-800/50">
                    <div className="text-sm text-zinc-400 font-medium mb-2">{kpi.title}</div>
                    <div className={`text-4xl font-extrabold ${kpi.color || 'text-yellow-400'} mb-1`}>
                      {kpi.value}
                    </div>
                    <div className="text-xs text-zinc-500">{kpi.note}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}