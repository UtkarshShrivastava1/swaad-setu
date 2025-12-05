import { useCallback, useEffect, useState } from "react";
import { getActiveCalls, resolveCall } from "../../../api/staff/call.api";
import type { ICall } from "../../../api/staff/call.api";

export const useCalls = (currentRid: string | null) => {
  const [calls, setCalls] = useState<ICall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    if (!currentRid) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getActiveCalls({ rid: currentRid });
      const callsArray = Array.isArray(result)
        ? result
        : (result as any)?.data || [];
      setCalls(callsArray);
    } catch (err: any) {
      console.error("useCalls - Failed to fetch calls:", err);
      setError(err.message || "Failed to fetch calls");
    } finally {
      setIsLoading(false);
    }
  }, [currentRid]);

  const handleUpdateCallStatus = async (callId: string, staffAlias: string) => {
    if (!currentRid) return;

    try {
      await resolveCall({ rid: currentRid }, callId, staffAlias);
      await fetchCalls(); // refresh list
    } catch (err: any) {
      setError(err.message || "Failed to resolve call");
    }
  };

  useEffect(() => {
    if (currentRid) {
      fetchCalls();
    }
  }, [fetchCalls, currentRid]);

  return {
    calls,
    isLoading,
    error,
    fetchCalls,
    handleUpdateCallStatus,
  };
};
