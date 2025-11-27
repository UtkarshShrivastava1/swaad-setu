import type { Order } from "./normalize";

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
 * 🧩 mergeOrdersIntoTables (Debug Enhanced)
 * Logs every step of the merge so we can identify why orders aren’t linking.
 */
export const mergeOrdersIntoTables = (
  tablesInput: Table[] = [],
  ordersInput: Order[] = []
): Table[] => {
  console.groupCollapsed(
    "%c[mergeOrdersIntoTables] 🔍 Debug Merge Start",
    "color:#9C27B0;font-weight:bold;"
  );
  console.log("Tables input:", tablesInput);
  console.log("Orders input:", ordersInput);

  const merged = (tablesInput || []).map((t) => {
    const idKey = String(t.id || (t as any)._id || "").trim();
    const tableNumberKey = String(t.tableNumber || "").trim();

    // Find related orders
    const relatedOrders = (ordersInput || []).filter((o) => {
      const oTableId = String(o.tableId || "").trim();
      const oTableNumber = String(o.tableNumber || "").trim();

      const match =
        oTableId === idKey ||
        oTableNumber === tableNumberKey ||
        oTableNumber === idKey ||
        oTableId === tableNumberKey;

      if (match) {
        console.log(
          `%c✅ Matched order ${o.id} with table ${tableNumberKey} (id=${idKey})`,
          "color:green;"
        );
      } else {
        console.log(
          `%c❌ No match: order ${o.id} -> order.tableId=${oTableId} | order.tableNumber=${oTableNumber} vs table.id=${idKey} | table.tableNumber=${tableNumberKey}`,
          "color:crimson;"
        );
      }

      return match;
    });

    const currentlyOccupied =
      Boolean(t.currentSessionId) ||
      relatedOrders.length > 0 ||
      String(t.status).toLowerCase() === "occupied";

    console.log(
      `[mergeOrdersIntoTables] Table ${tableNumberKey || idKey} → ${
        currentlyOccupied ? "OCCUPIED" : "AVAILABLE"
      } | Orders linked: ${relatedOrders.length}`
    );

    return {
      ...t,
      status: currentlyOccupied ? "occupied" : "available",
      bills: relatedOrders,
    };
  });

  console.groupEnd();
  return merged;
};
