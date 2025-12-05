// src/pages/AdminDashboard/hooks/useCalls.ts

import { useCallback, useEffect, useState } from "react";
import { getActiveCalls, resolveCall } from "../../../api/admin/call.api";
import type { ICall } from "../../../api/admin/call.api";
import { useTenant } from "../../../context/TenantContext";

export const useCalls = () => {
  const { rid } = useTenant();
  const [calls, setCalls] = useState<ICall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    if (!rid) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getActiveCalls(rid);
      setCalls(response);
    } catch (err: any) {
      setError(err.message || "Failed to fetch calls");
    } finally {
      setIsLoading(false);
    }
  }, [rid]);

  const handleResolveCall = async (callId: string) => {
    if (!rid) return;

    try {
        // Using 'Admin' as the resolver alias for now
      await resolveCall(rid, callId, "Admin");
      await fetchCalls(); // refresh list
    } catch (err: any) {
      setError(err.message || "Failed to resolve call");
      // Re-throw so the component can be aware of the error
      throw err;
    }
  };

  useEffect(() => {
    if (rid) {
        fetchCalls();
        const interval = setInterval(fetchCalls, 15000); // Refresh every 15s
        return () => clearInterval(interval);
    }
  }, [rid, fetchCalls]);

  return {
    calls,
    isLoading,
    error,
    fetchCalls,
    handleResolveCall,
  };
};
