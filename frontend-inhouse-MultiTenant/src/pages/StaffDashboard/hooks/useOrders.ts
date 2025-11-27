import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTenant } from "../../../context/TenantContext";

import {
  getActiveOrders,
  getOrderHistory,
} from "../../../api/staff/staff.operations.api";

import type { ApiOrder, Order, Table } from "../types";
import { extractTableId } from "../utils/extractors";
import { mergeOrdersIntoTables } from "../utils/mergeHelpers";
import { normalizeOrder } from "../utils/normalize";

/**
 * useOrders (Fully Fixed Multi-Tenant Version)
 * Ensures:
 * - Always normalized tableId (string)
 * - Always normalized tableNumber (string)
 * - Matches single-tenant behavior 100%
 */
export function useOrders(
  fetchTables: () => Promise<Table[]>,
  setTables: (t: Table[]) => void
) {
  const { rid: ridFromUrl } = useParams();
  const { rid: ridFromContext, setRid } = useTenant();
  const rid = ridFromUrl || ridFromContext;

  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Sync context
  useEffect(() => {
    if (ridFromUrl && ridFromUrl !== ridFromContext) {
      setRid(ridFromUrl);
    }
  }, [ridFromUrl, ridFromContext, setRid]);

  /**
   * Fully normalize one API order into the Order type
   * Ensures tableId + tableNumber are ALWAYS present
   */
  const normalizeWithTable = useCallback(
    (o: ApiOrder, tableMap: Map<string, string>): Order => {
      const extractedTableId = extractTableId((o as any).tableId);
      const finalTableId = String(extractedTableId || o.tableId || "");

      // Resolve final tableNumber
      let resolvedNumber =
        tableMap.get(finalTableId) ||
        o.tableNumber ||
        (o.table as any)?.tableNumber ||
        "";

      if (typeof resolvedNumber === "number")
        resolvedNumber = String(resolvedNumber);

      const base = normalizeOrder(o, resolvedNumber);

      return {
        ...base,
        tableId: finalTableId,
        tableNumber: String(resolvedNumber || ""),
        OrderNumberForDay:
          (o as any).OrderNumberForDay || (o as any).orderNumberForDay || null,
      };
    },
    []
  );

  /**
   * Fetch Active Orders
   */
  const fetchActiveOrders = useCallback(async () => {
    if (!rid) return;

    try {
      setIsLoading(true);

      // 1) Load tables
      const freshTables = await fetchTables();

      // Map tableId → tableNumber
      const tableMap = new Map<string, string>(
        freshTables.map((t: any) => [
          String(t.id || t._id),
          String(t.tableNumber),
        ])
      );

      // 2) Fetch raw orders
      const raw = await getActiveOrders(rid);
      let ordersApi: ApiOrder[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.orders)
        ? raw.orders
        : [];

      // 3) Normalize
      const normalized = ordersApi
        .map((o) => normalizeWithTable(o, tableMap))
        .filter((o) => o.status.toLowerCase() !== "done");

      // 4) Save
      setActiveOrders(normalized);

      // 5) Merge orders into tables so UI shows occupied state
      setTables(mergeOrdersIntoTables(freshTables, normalized));

      setError(null);
    } catch (err: any) {
      console.error("[useOrders] Active fetch failed:", err);
      setError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }, [rid, fetchTables, setTables, normalizeWithTable]);

  /**
   * Fetch Order History
   */
  const fetchOrderHistory = useCallback(
    async (params?: { startDate?: string; endDate?: string }) => {
      if (!rid) return;

      try {
        setIsHistoryLoading(true);

        const rawResp = await getOrderHistory(rid, params || {});
        let ordersApi: ApiOrder[] = Array.isArray(rawResp)
          ? rawResp
          : Array.isArray(rawResp?.orders)
          ? rawResp.orders
          : Array.isArray(rawResp?.data)
          ? rawResp.data
          : [];

        // Need table map again
        const freshTables = await fetchTables();
        const tableMap = new Map<string, string>(
          freshTables.map((t: any) => [
            String(t.id || t._id),
            String(t.tableNumber),
          ])
        );

        const normalized = ordersApi.map((o) =>
          normalizeWithTable(o, tableMap)
        );

        setOrderHistory(normalized);
        setHistoryError(null);
      } catch (err: any) {
        console.error("[useOrders] History fetch failed:", err);
        setHistoryError(err.message || String(err));
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [rid, fetchTables, normalizeWithTable]
  );

  // Sync tables whenever active orders change
  useEffect(() => {
    if (!rid) return;
    setTables((prev) => mergeOrdersIntoTables(prev, activeOrders));
  }, [activeOrders, rid, setTables]);

  return {
    rid,
    activeOrders,
    orderHistory,
    fetchActiveOrders,
    fetchOrderHistory,
    isLoading,
    isHistoryLoading,
    error,
    historyError,
    setActiveOrders,
    setOrderHistory,
  };
}
