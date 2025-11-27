import { useCallback, useEffect, useState } from "react";
import type { ApiTable } from "../../../api/admin/table.api";
import { getTables } from "../../../api/admin/table.api";

/**
 * Hook: useTables
 * -------------------------
 * Manages all table-related operations for Admin Dashboard:
 * - Fetch all tables
 * - Handles errors + logs for debugging
 */
export function useTables(rid: string) {
  const [tables, setTables] = useState<ApiTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  /**
   * 📦 Fetch all tables for restaurant
   * Always returns a valid array (never undefined)
   */
  const fetchTables = useCallback(async (): Promise<ApiTable[]> => {
    if (!rid) {
      console.warn("[useTables] Missing rid, skipping fetch");
      return [];
    }
    console.log(
      `%c[useTables] → Fetching tables for restaurant: ${rid}`,
      "color:#3fa9f5"
    );

    setIsLoading(true);
    setTableError(null);

    try {
      const data = await getTables(rid);
      setTables(data);
      console.log(
        `%c[useTables] ✅ Tables fetched successfully (${data.length} tables)`,
        "color:#4CAF50"
      );

      return data;
    } catch (err: any) {
      const message = err?.message || String(err);
      console.error(
        "%c[useTables] ❌ Failed to fetch tables:",
        "color:red",
        message
      );
      setTableError(message);
      setTables([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [rid]);

  /**
   * 🚀 Auto-fetch tables when restaurant changes or component mounts
   */
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return {
    tables,
    setTables,
    fetchTables,
    isLoading,
    tableError,
  };
}
