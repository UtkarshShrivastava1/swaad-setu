// src/pages/StaffDashboard/utils/mergeOrdersIntoTables.ts
import type { Order } from "./normalize";

/** The shape of your staff-facing table data */
export type TableStatus = "available" | "occupied";

export interface Table {
  id: string;
  tableNumber: string;
  status: TableStatus;
  capacity: number;
  waiterAssigned?: string;
  bills: Order[];
  waiterCalled: boolean;
  isActive: boolean;
  currentSessionId?: string;
}

/**
 * 🔄 mergeOrdersIntoTables
 * -------------------------
 * Merges active orders into tables, marking which tables are "occupied".
 * Handles both tableId and tableNumber matching and adds rich console logs.
 */
export const mergeOrdersIntoTables = (
  tablesInput: Table[] = [],
  ordersInput: Order[] = []
): Table[] => {
  console.groupCollapsed(
    "%c[mergeOrdersIntoTables] Linking orders ↔ tables",
    "color:#4CAF50;font-weight:bold;"
  );
  console.log("📋 Tables Input:", tablesInput);
  console.log("📦 Orders Input:", ordersInput);

  const occupiedById = new Set<string>();
  const occupiedByNumber = new Set<string>();

  // 🔹 Collect table IDs & numbers from orders
  (ordersInput || []).forEach((order) => {
    if (!order) return;

    const tid = order.tableId ? String(order.tableId).trim() : "";
    const tnum = order.tableNumber ? String(order.tableNumber).trim() : "";

    if (tid) {
      occupiedById.add(tid);
      console.log(`✅ order ${order.id} → tableId match: ${tid}`);
    }
    if (tnum) {
      occupiedByNumber.add(tnum);
      console.log(`✅ order ${order.id} → tableNumber match: ${tnum}`);
    }

    // Defensive fallback for numeric-only IDs
    if (tid && /^\d+$/.test(tid)) occupiedByNumber.add(tid);
  });

  // 🔹 Merge into table array
  const merged = (tablesInput || []).map((table) => {
    const idKey = String(table.id || table._id || "").trim(); // 👈 FIX HERE    const numKey = String(table.tableNumber || "").trim();

    const isOccupied =
      Boolean(table.currentSessionId) ||
      occupiedById.has(idKey) ||
      occupiedByNumber.has(numKey);

    const newStatus: TableStatus = isOccupied ? "occupied" : "available";

    console.log(
      `%c[mergeOrdersIntoTables] Table ${
        numKey || idKey
      } → ${newStatus.toUpperCase()}`,
      `color:${newStatus === "occupied" ? "orange" : "gray"}`
    );

    return {
      ...table,
      status: newStatus,
    };
  });

  console.groupEnd();
  return merged;
};
