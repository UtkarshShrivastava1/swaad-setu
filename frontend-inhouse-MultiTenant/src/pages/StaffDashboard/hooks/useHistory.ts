import { useCallback, useEffect, useState } from "react";
import type { ApiBill } from "../../../api/staff/bill.api";
import { getBillsHistory } from "../../../api/staff/bill.api";

/**
 * 🧾 useHistory — Multi-Tenant Safe Version
 * -------------------------------------
 * Fetches, filters, and manages bill history for each tenant.
 */

export function useHistory(rid: string) {
  const [billHistory, setBillHistory] = useState<ApiBill[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  /**
   * Fetch bill history from backend (tenant-aware)
   */
  const fetchBillHistory = useCallback(
    async (params?: {
      from?: string;
      to?: string;
      limit?: number;
      page?: number;
    }) => {
      if (!rid) {
        console.warn("[useHistory] ❌ Missing rid");
        return;
      }

      setIsHistoryLoading(true);
      setHistoryError(null);

      try {
        console.log(
          `📦 [useHistory] Fetching bill history for rid=${rid}`,
          params
        );

        // 🔥 FIX: rid MUST be passed to backend
        const res = await getBillsHistory(rid, params || {});

        const data = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.bills)
          ? res.bills
          : [];

        // Filter finalized/paid bills only
        const filtered = data.filter(
          (b: ApiBill) =>
            ["finalized", "completed", "paid"].includes(
              (b.status || "").toLowerCase()
            ) || (b.paymentStatus || "").toLowerCase() === "paid"
        );

        console.log(`✅ [useHistory] Loaded ${filtered.length} bills`);
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
   * Auto-fetch on rid change
   */
  useEffect(() => {
    if (!rid) return;
    console.log(`🟢 [useHistory] Auto-fetch on rid=${rid}`);
    fetchBillHistory({ limit: 50 });
  }, [rid, fetchBillHistory]);

  return {
    billHistory,
    setBillHistory,
    fetchBillHistory,
    isHistoryLoading,
    historyError,
  };
}
