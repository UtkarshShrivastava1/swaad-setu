import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../../../context/SocketContext";
import type { ApiBill } from "../../../api/staff/bill.api";
import { getBillsHistory } from "../../../api/staff/bill.api";
import { normalizeBill } from "../utils/normalize";

/**
 * 🧾 useHistory — Multi-Tenant Safe Version
 * -------------------------------------
 * Fetches, filters, and manages bill history for each tenant.
 */

export function useHistory(rid: string) {
  const [billHistory, setBillHistory] = useState<ApiBill[]>([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewHistoricalBill = (newBill: ApiBill) => {
      console.log("Received new_historical_bill event:", newBill);
      const normalized = normalizeBill(newBill);
      setBillHistory(prevHistory => [normalized, ...prevHistory]);
    };

    socket.on("new_historical_bill", handleNewHistoricalBill);

    return () => {
      socket.off("new_historical_bill", handleNewHistoricalBill);
    };
  }, [socket]);

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

        const res = await getBillsHistory(rid, params || {});
        
        const bills = (res.bills || []).map(normalizeBill);
        const filtered = bills.filter(
          (b: ApiBill) =>
            b._id &&
            ((b.total || b.totalAmount || 0) > 0) &&
            (["finalized", "completed", "paid"].includes(
              (b.status || "").toLowerCase()
            ) || (b.paymentStatus || "").toLowerCase() === "paid")
        );

        console.log(`✅ [useHistory] Loaded ${filtered.length} bills`);
        setBillHistory(filtered);
        setSummary(res.summary || null);
        setPagination(res.pagination || null);

      } catch (err: any) {
        console.error("💥 [useHistory] Failed to fetch bill history:", err);
        setHistoryError(err?.message || "Failed to load bill history");
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [rid]
  );

  useEffect(() => {
    if (rid) {
      const today = new Date().toISOString().split("T")[0];
      fetchBillHistory({ from: today, to: today, limit: 100, page: 1 });
    }
  }, [rid, fetchBillHistory]);



  return {
    billHistory,
    summary,
    pagination,
    setBillHistory,
    fetchBillHistory,
    isHistoryLoading,
    historyError,
  };
}
