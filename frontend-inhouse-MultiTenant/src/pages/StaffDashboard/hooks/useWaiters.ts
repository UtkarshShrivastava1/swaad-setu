// src/hooks/staff/useWaiters.ts
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getWaiterNames } from "../../../api/staff/staff.operations.api";
import { useTenant } from "../../../context/TenantContext";

/**
 * Multi-tenant safe waiter loader.
 * - Detects rid from URL → context → prop
 * - Never calls /api/undefined/orders/waiters
 * - Safe fallbacks
 */
export function useWaiters(optionalRid?: string) {
  const { rid: ridFromUrl } = useParams();
  const { rid: ridFromContext } = useTenant();

  const rid = optionalRid || ridFromUrl || ridFromContext || ""; // <— ALWAYS resolved

  const [waiterNames, setWaiterNames] = useState<string[]>([]);
  const [waitersLoading, setWaitersLoading] = useState(false);
  const [waitersError, setWaitersError] = useState<string | null>(null);

  const fetchWaiters = useCallback(async () => {
    setWaitersLoading(true);
    setWaitersError(null);

    try {
      let resp;

      try {
        // Primary → tenant specific
        resp = await getWaiterNames(rid);
      } catch (err1) {
        console.error(`[useWaiters] Failed to fetch waiters for rid=${rid}`, err1);
        // Re-throw the error for the given rid. Do not try with empty rid as fallback.
        throw err1;
      }

      const names =
        (Array.isArray(resp) && resp) ||
        (Array.isArray(resp?.waiterNames) && resp.waiterNames) ||
        (Array.isArray(resp?.data?.waiterNames) && resp.data.waiterNames) ||
        [];

      setWaiterNames(names);
    } catch (err: any) {
      console.error("[useWaiters] fetch failed:", err);
      const msg =
        err?.response?.status === 403
          ? "Forbidden: cross-tenant access blocked"
          : err?.response?.status === 401
          ? "Unauthorized: Please log in"
          : err?.message || "Failed to load waiters";

      setWaitersError(msg);
      setWaiterNames([]);
    } finally {
      setWaitersLoading(false);
    }
  }, [rid]);

  // Auto-fetch on mount + rid change
  useEffect(() => {
    if (rid) { // Only fetch if rid is available and not empty
      fetchWaiters();
    }
  }, [fetchWaiters, rid]);

  return {
    waiterNames,
    waitersLoading,
    waitersError,
    fetchWaiters,
  };
}
