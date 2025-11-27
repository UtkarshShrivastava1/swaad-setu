import { useCallback, useEffect, useState } from "react";
import {
  getActiveOrders,
  getOrderHistory,
} from "../../../api/staff/staff.operations.api";
import type { ApiOrder, Order, Table } from "../types";
import { extractTableId } from "../utils/extractors";
import { mergeOrdersIntoTables } from "../utils/mergeHelpers";
import { normalizeOrder } from "../utils/normalize";

/**
 * Hook: useOrders
 * -------------------------
 * Centralizes all order-related logic:
 * - Fetch active orders
 * - Merge orders into tables (occupancy)
 * - Fetch order history
 * - Normalize API data shapes
 * - Includes detailed debug logs for live monitoring
 */
export function useOrders(
  rid: string,
  fetchTables: () => Promise<Table[]>,
  setTables: (t: Table[]) => void
) {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  console.log("[useOrders] Hook initialized for restaurant:", rid);

  /**
   * 🧭 Fetch all active (non-done) orders and merge into tables.
   */
  const fetchActiveOrders = useCallback(async () => {
    console.log("[useOrders] → fetchActiveOrders() triggered");

    try {
      setIsLoading(true);

      // Step 1: Fetch tables first
      const freshTables = await fetchTables();
      console.log("[useOrders] ✅ Tables fetched:", freshTables.length);

      const tableMap = new Map<string, string>(
        freshTables.map((t: any) => [
          String(t.id || t._id),
          String(t.tableNumber),
        ])
      );

      // Step 2: Fetch active orders
      let rawOrdersResponse: any;
      try {
        rawOrdersResponse = await getActiveOrders(rid);
      } catch (err1) {
        console.warn("[useOrders] ⚠️ getActiveOrders(rid) failed:", err1);
        rawOrdersResponse = await getActiveOrders();
      }

      // Step 3: Normalize response shape
      let ordersApi: ApiOrder[] = [];
      if (Array.isArray(rawOrdersResponse)) ordersApi = rawOrdersResponse;
      else if (Array.isArray(rawOrdersResponse.orders))
        ordersApi = rawOrdersResponse.orders;
      else if (Array.isArray(rawOrdersResponse.data))
        ordersApi = rawOrdersResponse.data;
      else if (Array.isArray(rawOrdersResponse.result))
        ordersApi = rawOrdersResponse.result;
      else if (rawOrdersResponse && rawOrdersResponse._id)
        ordersApi = [rawOrdersResponse];
      else ordersApi = [];

      console.log(
        `[useOrders] 🧾 Raw active orders received: ${ordersApi.length}`,
        ordersApi
      );

      // Step 4: Normalize each order
      const normalized = (ordersApi || [])
        .map((o) => {
          const extractedId = extractTableId((o as any).tableId);
          const resolvedNumber = tableMap.get(extractedId);

          // 🟢 Extract order number for the day (backend sends in PascalCase)
          const orderNum =
            (o as any).OrderNumberForDay ??
            (o as any).orderNumberForDay ??
            null;

          const normalizedOrder = normalizeOrder(o, resolvedNumber);

          // 🟢 Attach it to the normalized order
          return {
            ...normalizedOrder,
            OrderNumberForDay: orderNum,
          };
        })
        .filter((o) => String(o.status).toLowerCase() !== "done");

      console.log(
        `[useOrders] ✅ Normalized active orders: ${normalized.length}`,
        normalized
      );

      setActiveOrders(normalized);
      setTables(mergeOrdersIntoTables(freshTables, normalized));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error("[useOrders] ❌ fetchActiveOrders failed:", message);
    } finally {
      setIsLoading(false);
    }
  }, [rid, fetchTables, setTables]);

  /**
   * 📜 Fetch order history (fixed)
   * Accepts a single params object: { startDate?: string; endDate?: string; }
   */
  const fetchOrderHistory = useCallback(
    async (params?: { startDate?: string; endDate?: string }) => {
      try {
        setIsHistoryLoading(true);
        const safeParams = params || {};

        let rawResp: any = await getOrderHistory(rid, safeParams);
        let ordersApi: ApiOrder[] = [];

        if (Array.isArray(rawResp)) ordersApi = rawResp;
        else if (Array.isArray(rawResp.orders)) ordersApi = rawResp.orders;
        else if (Array.isArray(rawResp.data)) ordersApi = rawResp.data;
        else if (Array.isArray(rawResp.result)) ordersApi = rawResp.result;
        else if (rawResp && rawResp._id) ordersApi = [rawResp];

        const freshTables = await fetchTables();
        const tableMap = new Map<string, string>(
          freshTables.map((t: any) => [
            String(t.id || t._id),
            String(t.tableNumber),
          ])
        );

        const normalized = (ordersApi || []).map((o) => {
          const extractedId = extractTableId((o as any).tableId);
          const resolvedNumber = tableMap.get(extractedId);

          // 🟢 Preserve order number for history
          const orderNum =
            (o as any).OrderNumberForDay ??
            (o as any).orderNumberForDay ??
            null;

          const normalizedOrder = normalizeOrder(o, resolvedNumber);
          return {
            ...normalizedOrder,
            OrderNumberForDay: orderNum,
          };
        });

        setOrderHistory(normalized);
        setHistoryError(null);
        console.log(
          `[useOrders] ✅ Normalized order history: ${normalized.length}`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setHistoryError(message);
        console.error("[useOrders] ❌ fetchOrderHistory failed:", message);
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [rid, fetchTables]
  );

  // 🔁 Keep tables up-to-date dynamically
  useEffect(() => {
    if (!setTables) return;
    setTables((prevTables) => mergeOrdersIntoTables(prevTables, activeOrders));
  }, [activeOrders, setTables]);

  return {
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
