import { useState, useCallback } from "react";

/**
 * Hook: usePendingTracker
 * -------------------------
 * Tracks pending operations (by id)
 * Handles version conflict retry patterns
 * Can be shared by billing, orders, and table actions
 */
export function usePendingTracker() {
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  /** Add an id to pending set */
  const markPending = useCallback((id: string) => {
    setPendingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  /** Remove an id from pending set */
  const unmarkPending = useCallback((id: string) => {
    setPendingIds((prev) => prev.filter((x) => x !== id));
  }, []);

  /** Check if specific id is pending */
  const isPending = useCallback(
    (id?: string) => !!id && pendingIds.includes(id),
    [pendingIds]
  );

  /** Wrapper: executes async fn with auto mark/unmark + retry */
  const runWithPending = useCallback(
    async <T>(
      id: string,
      asyncFn: () => Promise<T>,
      {
        retries = 0,
        retryDelayMs = 200,
        onRetry,
      }: {
        retries?: number;
        retryDelayMs?: number;
        onRetry?: (attempt: number, err: any) => void;
      } = {}
    ): Promise<T> => {
      markPending(id);
      try {
        let attempt = 0;
        while (true) {
          try {
            const result = await asyncFn();
            return result;
          } catch (err: any) {
            // Handle retriable version conflict or transient network errors
            const message =
              (err?.message ?? "").toLowerCase() +
              (err?.payload?.error ?? "").toLowerCase();
            const isVersionConflict =
              err?.status === 409 ||
              message.includes("version") ||
              message.includes("conflict");

            if (isVersionConflict && attempt < retries) {
              attempt++;
              onRetry?.(attempt, err);
              await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
              continue;
            }
            throw err;
          }
        }
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : String(err);
        setGlobalError(msg);
        throw err;
      } finally {
        unmarkPending(id);
      }
    },
    [markPending, unmarkPending]
  );

  return {
    pendingIds,
    isPending,
    markPending,
    unmarkPending,
    runWithPending,
    globalError,
    setGlobalError,
  };
}
