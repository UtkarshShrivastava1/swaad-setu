import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../../../context/SocketContext";
import type { ApiTable } from "../../../api/staff/staff.operations.api";

import {
  assignSessionToTable,
  getTableByNumber,
  getTables,
} from "../../../api/staff/staff.operations.api";

/**
 * Multi-Tenant Safe useTables
 * ---------------------------
 * EXACT same behavior as single-tenant version,
 * but all API calls are tenant-aware.
 */
export function useTables(rid: string) {
  const [tables, setTables] = useState<ApiTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleTableUpdate = (updatedTable: ApiTable) => {
      console.log("Received table_update event:", updatedTable);
      setTables(prevTables => {
        const tableExists = prevTables.some(t => t._id === updatedTable._id);
        if (tableExists) {
          return prevTables.map(t => t._id === updatedTable._id ? updatedTable : t);
        } else {
          return [...prevTables, updatedTable];
        }
      });
    };

    socket.on("table_update", handleTableUpdate);

    return () => {
      socket.off("table_update", handleTableUpdate);
    };
  }, [socket]);

  /**
   * Fetch all tables (full shape, no transformation)
   */
  const fetchTables = useCallback(async (): Promise<ApiTable[]> => {
    console.log(
      `%c[useTables] → Fetching tables for tenant: ${rid}`,
      "color:#3fa9f5"
    );

    if (!rid) {
      console.warn("[useTables] ❌ No rid provided");
      return [];
    }

    setIsLoading(true);
    setTableError(null);

    try {
      const res = await getTables(rid);

      let data: ApiTable[] = [];
      if (Array.isArray(res)) data = res;
      else if (Array.isArray(res?.data)) data = res.data;
      else if (Array.isArray(res?.tables)) data = res.tables;
      else if (Array.isArray(res?.result)) data = res.result;
      else if (res && res._id) data = [res];
      else data = [];

      setTables(data);

      console.log(
        `%c[useTables] ✅ Tables fetched: ${data.length}`,
        "color:#4CAF50"
      );

      return data;
    } catch (err: any) {
      const message = err?.message || String(err);
      console.error("[useTables] ❌ Failed to fetch tables:", message);
      setTableError(message);
      setTables([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [rid]);

  /**
   * Fetch a table by number (tenant-aware)
   */
  const fetchTableByNumber = useCallback(
    async (tableNumber: string) => {
      if (!rid) return null;
      if (!tableNumber) return null;

      console.log(
        `%c[useTables] → Fetching table #${tableNumber} for rid=${rid}`,
        "color:#ffb300"
      );

      try {
        const res = await getTableByNumber(rid, tableNumber);
        return res;
      } catch (err: any) {
        console.error(
          `[useTables] ❌ Failed to load table #${tableNumber}:`,
          err.message
        );
        return null;
      }
    },
    [rid]
  );

  /**
   * Assign session → backend emits table_update
   */
  const assignSession = useCallback(
    async (tableId: string, sessionId: string, staffAlias: string) => {
      if (!rid) {
        console.warn("[useTables] ⚠️ No rid during assignSession");
        return { success: false };
      }

      if (!tableId || !sessionId) {
        console.warn("[useTables] ⚠️ Missing tableId/sessionId");
        return { success: false };
      }

      try {
        const res = await assignSessionToTable(
          rid,
          tableId,
          sessionId,
          staffAlias
        );
        // No longer need to fetchTables() here, backend will emit 'table_update'
        return res;
      } catch (err) {
        console.error("[useTables] ❌ Session assign failed:", err);
        return { success: false };
      }
    },
    [rid]
  );

  /**
   * Initial load when rid changes
   */
  useEffect(() => {
    if (!rid) {
      console.warn("[useTables] ⚠️ No rid → skipping initial fetch");
      return;
    }
    fetchTables();
  }, [rid, fetchTables]);

  return {
    // data
    tables,
    setTables,

    // actions
    fetchTables,
    fetchTableByNumber,
    assignSession,

    // state
    isLoading,
    tableError,
  };
}
