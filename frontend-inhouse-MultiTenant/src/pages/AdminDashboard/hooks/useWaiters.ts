import { useCallback, useState } from "react";
import { getWaiterNames } from "../../../api/staff/staff.operations.api";

/**
 * Hook: useWaiters
 * -------------------------
 * Fetches and manages waiter names for staff dashboard.
 * Handles:
 * - loading and error states
 * - environment-aware fallback (with or without rid)
 */
export function useWaiters(rid: string) {
  const [waiterNames, setWaiterNames] = useState<string[]>([]);
  const [waitersLoading, setWaitersLoading] = useState(false);
  const [waitersError, setWaitersError] = useState<string | null>(null);

  const fetchWaiters = useCallback(async () => {
    try {
      setWaitersLoading(true);
      setWaitersError(null);

      let resp: any;
      try {
        // Try fetching with restaurant ID
        resp = await getWaiterNames(rid);
      } catch (e) {
        // Fallback to no-arg call (for compatibility)
        resp = await getWaiterNames();
      }

      const names =
        resp && Array.isArray(resp.waiterNames) ? resp.waiterNames : [];
      setWaiterNames(names);
    } catch (err: any) {
      console.warn("useWaiters: fetchWaiters failed", err);
      setWaitersError(err?.message ?? "Failed to load waiters");
      setWaiterNames([]);
    } finally {
      setWaitersLoading(false);
    }
  }, [rid]);

  return { waiterNames, waitersLoading, waitersError, fetchWaiters };
}
