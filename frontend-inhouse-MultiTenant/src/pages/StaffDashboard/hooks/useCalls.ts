import { useCallback, useEffect, useState } from "react";
import { getActiveCalls, resolveCall } from "../../../api/staff/call.api";
import type { ICall } from "../../../api/staff/call.api";

export const useCalls = (tenant: { rid: string | null } | null) => {
  const [calls, setCalls] = useState<ICall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    if (!tenant?.rid) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getActiveCalls(tenant);
      console.log("[useCalls] getActiveCalls response:", response); // Added for debugging
      setCalls(response);
    } catch (err: any) {
      setError(err.message || "Failed to fetch calls");
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.rid]);

  const handleUpdateCallStatus = async (callId: string, staffAlias: string) => {
    if (!tenant?.rid) return;

    try {
      await resolveCall(tenant, callId, staffAlias);
      await fetchCalls(); // refresh list
    } catch (err: any) {
      setError(err.message || "Failed to resolve call");
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  return {
    calls,
    isLoading,
    error,
    fetchCalls,
    handleUpdateCallStatus,
  };
};
