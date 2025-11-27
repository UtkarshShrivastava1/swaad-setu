import { useCallback, useEffect, useState } from "react";
import type { ApiBill } from "../../../api/staff/bill.api";
import { getBillsHistory } from "../../../api/staff/bill.api";

/**
 * 🧾 useHistory — Hook for Bill History
 * -------------------------------------
 * Handles fetching, filtering, and state management for bill history
 * Used inside StaffDashboard (History tab)
 */

export function useHistory(rid: string) {
  const [billHistory, setBillHistory] = useState<ApiBill[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  /**
   * Fetch bill history from backend
   */
  const fetchBillHistory = useCallback(
    async (params?: {
      from?: string;
      to?: string;
      limit?: number;
      page?: number;
    }) => {
      setIsHistoryLoading(true);
      setHistoryError(null);
      try {
        console.log(
          "📦 [useHistory] Fetching bill history with params:",
          params
        );

        const res = await getBillsHistory(params || {});
        const data = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.bills)
          ? res.bills
          : [];

        // ✅ Filter: Only include finalized, completed, or paid bills
        const filtered = data.filter(
          (b: ApiBill) =>
            ["finalized", "completed", "paid"].includes(
              (b.status || "").toLowerCase()
            ) || (b.paymentStatus || "").toLowerCase() === "paid"
        );

        console.log(`✅ [useHistory] Got ${filtered.length} bills`);
        setBillHistory(filtered);
      } catch (err: any) {
        console.error("💥 [useHistory] Failed to fetch bill history:", err);
        setHistoryError(err?.message || "Failed to load bill history");
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [rid]
  );

  /**
   * Initial auto-fetch
   */
  useEffect(() => {
    console.log("🟢 [useHistory] Initial auto-fetch for rid:", rid);
    fetchBillHistory({ limit: 50 }).catch((err) =>
      console.error("❌ [useHistory] Auto-fetch failed:", err)
    );
  }, [rid, fetchBillHistory]);

  return {
    billHistory,
    setBillHistory,
    fetchBillHistory,
    isHistoryLoading,
    historyError,
  };
}
