// lightweight table/session helper
import { useMemo } from "react";

const SESSION_KEY = "resto_session_id";
const TABLE_KEY = "resto_table_id";

export function useTableFromUrl() {
  // Check if running in client environment
  const isClient = typeof window !== "undefined";
  const search = isClient ? window.location.search : "";
  const params = new URLSearchParams(search);
  const tableFromQuery = params.get("table");

  const tableId =
    tableFromQuery ||
    (isClient ? sessionStorage.getItem(TABLE_KEY) : null) ||
    null;
  const sessionId =
    (isClient ? sessionStorage.getItem(SESSION_KEY) : null) ||
    (isClient && typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : null) ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // persist once
  if (isClient && tableId) sessionStorage.setItem(TABLE_KEY, tableId);
  if (isClient && !sessionStorage.getItem(SESSION_KEY))
    sessionStorage.setItem(SESSION_KEY, sessionId);

  return useMemo(() => ({ tableId, sessionId }), [tableId, sessionId]);
}
