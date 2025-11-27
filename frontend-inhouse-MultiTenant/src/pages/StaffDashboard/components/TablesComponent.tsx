// src/components/staff/TablesComponent.tsx
import { ChevronRight, Users } from "lucide-react";

/**
 * The exact flexible types your single-tenant version used.
 * These remain intentionally loose to support all tenants.
 */
export interface BillItem {
  name: string;
  qty: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  serverId?: string;
  tableId?: any;
  table?: any;
  sessionId?: string;
  items: BillItem[];
  tableNumber?: string;
  subtotal: number;
  totalAmount: number;
  amount: number;
  status: string;
  paymentStatus: string;
  customerName?: string;
  staffAlias?: string;
  version: number;
  createdAt: string;
}

export interface Table {
  id: string;
  _id?: string;
  tableNumber: string | number;
  status: "available" | "occupied" | string;
  capacity: number;
  waiterAssigned?: string;
  waiterCalled: boolean;
  isActive: boolean;
  currentSessionId?: string;
}

type Props = {
  tables: Table[];
  activeOrders: Order[];
  isLoading: boolean;
  onTableSelect: (table: Table, order?: Order) => void;
};

/**
 * Normalize any possible id/tableNumber to a string.
 */
function toIdString(x: any): string {
  if (x == null) return "";
  if (typeof x === "string" || typeof x === "number") return String(x);

  if (typeof x === "object") {
    if (x._id) return String(x._id);
    if (x.id) return String(x.id);
    if (x.tableNumber) return String(x.tableNumber);
  }

  return "";
}

/**
 * Single-tenant accurate matching logic.
 * Matches table → order using many real-world schema variations.
 */
function matchesOrderToTable(order: Order, table: Table) {
  try {
    const tableId = toIdString(table._id || table.id);
    const tableNum = toIdString(table.tableNumber);

    // all possible candidates an order may contain
    const candidates = new Set<string>();

    // tableId possibilities
    if (order.tableId) {
      candidates.add(toIdString(order.tableId));

      if (typeof order.tableId === "object") {
        if (order.tableId._id) candidates.add(String(order.tableId._id));
        if (order.tableId.id) candidates.add(String(order.tableId.id));
        if (order.tableId.tableNumber)
          candidates.add(String(order.tableId.tableNumber));
      }
    }

    // nested table object
    if (order.table) {
      candidates.add(toIdString(order.table));

      if (order.table._id) candidates.add(String(order.table._id));
      if (order.table.id) candidates.add(String(order.table.id));
      if (order.table.tableNumber)
        candidates.add(String(order.table.tableNumber));
    }

    // plain tableNumber
    if (order.tableNumber) candidates.add(toIdString(order.tableNumber));

    // fallback: numeric ID encoded as tableNumber
    if (order.tableId && /^\d+$/.test(String(order.tableId)))
      candidates.add(String(order.tableId));

    for (const c of candidates) {
      if (!c) continue;

      if (c === tableId) return true;
      if (c === tableNum) return true;

      // loose matching (“1” === 1)
      if (String(c) === String(tableId)) return true;
      if (String(c) === String(tableNum)) return true;
    }
  } catch {}

  return false;
}

export default function TablesComponent({
  tables,
  activeOrders,
  isLoading,
  onTableSelect,
}: Props) {
  // debug inspection
  try {
    console.debug("[TablesComponent] tables:", tables?.length);
    console.debug("[TablesComponent] activeOrders:", activeOrders?.length);
  } catch {}

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {tables
        .filter((t) => t.isActive)
        .map((table) => {
          const key = String(table._id || table.id || table.tableNumber);

          const matchingOrders = activeOrders.filter((o) =>
            matchesOrderToTable(o, table)
          );

          const occupied =
            Boolean(table.currentSessionId) ||
            matchingOrders.length > 0 ||
            String(table.status).toLowerCase() === "occupied";

          const waiterCalled = table.waiterCalled;

          return (
            <article
              key={key}
              onClick={() => {
                const tableWithId = {
                  ...table,
                  id: String(table._id || table.id || table.tableNumber),
                };
                if (matchingOrders.length > 0) {
                  onTableSelect(tableWithId, matchingOrders[0]);
                } else {
                  onTableSelect(tableWithId);
                }
              }}
              className={`group cursor-pointer relative rounded-xl p-5 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 ${
                waiterCalled
                  ? "bg-rose-100 border-rose-300 animate-pulse-waiter"
                  : occupied
                  ? "bg-gradient-to-br from-white to-indigo-50/50 border-indigo-100"
                  : "bg-gradient-to-br from-white to-emerald-50/50 border-emerald-100"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">
                    Table {table.tableNumber}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Users className="h-4 w-4" />
                    <span>Capacity: {table.capacity}</span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                    occupied
                      ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {occupied
                    ? "Occupied"
                    : String(table.status).charAt(0).toUpperCase() +
                      String(table.status).slice(1)}
                </span>
              </div>

              {table.waiterAssigned && table.waiterAssigned !== "-" && (
                <div className="mb-3 pb-3 border-b border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">Assigned to</div>
                  <div className="text-sm font-medium text-slate-700">
                    {table.waiterAssigned}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-slate-500">Active Orders:</span>
                  <span className="ml-2 font-semibold text-slate-800">
                    {matchingOrders.length}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            </article>
          );
        })}
    </div>
  );
}
