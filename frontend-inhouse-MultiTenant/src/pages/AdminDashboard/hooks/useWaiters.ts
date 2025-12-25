import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../../../context/SocketContext";
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
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleWaitersUpdate = (data: { waiters: string[] }) => {
      console.log("Received waiters_update event:", data);
      setWaiterNames(data.waiters || []);
    };

    socket.on("waiters_update", handleWaitersUpdate);

    return () => {
      socket.off("waiters_update", handleWaitersUpdate);
    };
  }, [socket]);

  return { waiterNames, waitersLoading, waitersError };
}
