import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { type ApiBill, getBillsHistory } from "../../../../api/staff/bill.api"; // Changed import
import { generateBillBriefing } from "../../../../api/gemini.api";
import { useTenant } from "../../../../context/TenantContext";

type BillData = ApiBill; // Use ApiBill directly for consistency

export default function BillsOverview() {
  const { rid } = useTenant();

  const [bills, setBills] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(false);

  const [billBriefing, setBillBriefing] = useState<string | null>(null);
  const [loadingBillBriefing, setLoadingBillBriefing] = useState(false);
  const [
    lastBillBriefingGenerationAttempt,
    setLastBillBriefingGenerationAttempt,
  ] = useState(0);

  // ✅ FETCH BILLS
  useEffect(() => {
    const getBills = async () => {
      if (!rid) return;

      setLoading(true);
      try {
        const response = await getBillsHistory(rid, { limit: 3 }); // No limit to fetch all
        setBills(response.bills || []); // Access the bills array
      } catch (error) {
        console.error("Failed to fetch bills:", error);
        setBills([]);
      } finally {
        setLoading(false);
      }
    };

    getBills();
  }, [rid]);

  // ✅ KPI CALCULATIONS
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const paidTodayBills = bills.filter((bill) => {
    const billUpdatedAt = new Date(bill.updatedAt || bill.createdAt || ""); // Use createdAt as fallback

    if (isNaN(billUpdatedAt.getTime())) {
      return false; // Invalid date
    }

    const billYear = billUpdatedAt.getFullYear();
    const billMonth = billUpdatedAt.getMonth();
    const billDate = billUpdatedAt.getDate();

    return (
      bill.paymentStatus === "paid" &&
      billYear === todayYear &&
      billMonth === todayMonth &&
      billDate === todayDate
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

  // ✅ AI BILL INSIGHTS (WITH COOLDOWN)
  useEffect(() => {
    if (!rid || loading || bills.length === 0) {
      setBillBriefing(null);
      return;
    }

    if (
      lastBillBriefingGenerationAttempt !== 0 &&
      Date.now() - lastBillBriefingGenerationAttempt < 30000
    ) {
      console.log("Skipping bill briefing generation due to cooldown.");
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
  }, [
    rid,
    loading,
    bills.length,
    billsSummary.activeBills,
    billsSummary.paidToday,
    billsSummary.revenueToday,
    billsSummary.avgBillValue,
    lastBillBriefingGenerationAttempt,
  ]);

  return (
    <section className="w-full space-y-6">
      {/* ================= AI BILL INSIGHTS ================= */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-300 via-blue-500 to-blue-300" />

        <div className="flex items-start gap-3">
          <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />

          <div className="flex-1 text-blue-900 text-sm italic">
            {loadingBillBriefing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
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

      {/* ================= KPI GRID ================= */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : bills.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-2xl border border-gray-200 shadow-sm">
          No bills data available.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Active Bills */}
          <div className="group rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-6">
            <div className="text-sm text-gray-500 font-semibold mb-2">
              Active Bills
            </div>
            <div className="text-4xl font-extrabold text-gray-900 mb-1">
              {billsSummary.activeBills}
            </div>
            <div className="text-xs text-gray-400">
              Open & in-progress bills
            </div>
          </div>

          {/* Paid Today */}
          <div className="group rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-6">
            <div className="text-sm text-gray-500 font-semibold mb-2">
              Paid Today
            </div>
            <div className="text-4xl font-extrabold text-emerald-600 mb-1">
              {billsSummary.paidToday}
            </div>
            <div className="text-xs text-gray-400">
              Settled transactions today
            </div>
          </div>

          {/* Revenue Today */}
          <div className="group rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-6">
            <div className="text-sm text-gray-500 font-semibold mb-2">
              Revenue Today
            </div>
            <div className="text-4xl font-extrabold text-orange-600 mb-1">
              ₹ {billsSummary.revenueToday.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">
              Cashflow generated today
            </div>
          </div>

          {/* Avg Bill Value */}
          <div className="group rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-6">
            <div className="text-sm text-gray-500 font-semibold mb-2">
              Avg Bill Value
            </div>
            <div className="text-4xl font-extrabold text-indigo-600 mb-1">
              ₹ {Math.round(billsSummary.avgBillValue).toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Average customer spend</div>
          </div>
        </div>
      )}
    </section>
  );
}
