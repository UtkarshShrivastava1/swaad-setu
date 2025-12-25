import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../../../context/SocketContext";
import { getActiveCalls, resolveCall } from "../../../api/staff/call.api";
import type { ICall } from "../../../api/staff/call.api";

export const useCalls = (currentRid: string | null) => {
  const [calls, setCalls] = useState<ICall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewCall = (newCall: ICall) => {
      console.log("Received new_call event:", newCall);
      setCalls(prevCalls => [...prevCalls, newCall]);
    };

    const handleCallResolved = (data: { callId: string }) => {
      console.log("Received call_resolved event:", data);
      setCalls(prevCalls => prevCalls.filter(c => c._id !== data.callId));
    };

    socket.on("new_call", handleNewCall);
    socket.on("call_resolved", handleCallResolved);

    return () => {
      socket.off("new_call", handleNewCall);
      socket.off("call_resolved", handleCallResolved);
    };
  }, [socket]);

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

    // Optimistically update the UI by removing the acknowledged call
    setCalls((prevCalls) => prevCalls.filter((call) => call._id !== callId));

    try {
      // Backend will emit 'call_resolved' on success
      await resolveCall({ rid: currentRid }, callId, staffAlias);
    } catch (err: any) {
      setError(err.message || "Failed to resolve call");
      // If the API call fails, refetch the calls to get the latest state from the server
      fetchCalls();
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
