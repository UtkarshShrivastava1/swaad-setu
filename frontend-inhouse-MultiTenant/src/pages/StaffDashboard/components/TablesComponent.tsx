// src/components/staff/TablesComponent.tsx
import { ChevronRight, Users, RotateCcw } from "lucide-react";
import React, { useState } from "react";
import { resetTable } from "../../../api/staff/staff.operations.api"; // Import resetTable
import { useTenant } from "../../../context/TenantContext";

// Simple ConfirmModal Component (Re-using from OrdersComponent for consistency)
interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">
          Confirm Action
        </h3>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "done"
  | "closed";

export type PaymentStatus = "unpaid" | "paid";

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
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  OrderNumberForDay?: number;
  customerName?: string;
  staffAlias?: string;
  version: number;
  createdAt: string | { $date: string };
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
  const { rid } = useTenant();
  const [resettingTableId, setResettingTableId] = useState<string | null>(null);
  const [confirmResetModalOpen, setConfirmResetModalOpen] = useState(false);
  const [pendingResetTableId, setPendingResetTableId] = useState<string | null>(null);

  const handleResetTable = (tableId: string) => {
    setPendingResetTableId(tableId);
    setConfirmResetModalOpen(true);
  };

  const confirmResetAction = async () => {
    if (!pendingResetTableId || !rid) return;

    setResettingTableId(pendingResetTableId);
    setConfirmResetModalOpen(false);

    try {
      await resetTable(rid, pendingResetTableId);
      // Optimistic UI update or trigger a re-fetch
      window.dispatchEvent(new CustomEvent("staff:refreshTables"));
      console.log(`Table ${pendingResetTableId} reset successfully.`);
    } catch (error) {
      console.error("Failed to reset table:", error);
      // Display an error message to the user
      alert("Failed to reset table. Please try again.");
    } finally {
      setResettingTableId(null);
      setPendingResetTableId(null);
    }
  };

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
    <>
      <ConfirmModal
        isOpen={confirmResetModalOpen}
        onConfirm={confirmResetAction}
        onCancel={() => setConfirmResetModalOpen(false)}
        message={`Are you sure you want to reset Table ${
          tables.find((t) => (t._id || t.id) === pendingResetTableId)
            ?.tableNumber || ""
        }? This will clear its status and session.`}
        confirmLabel="Reset Table"
        cancelLabel="Cancel"
      />
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
                className={`group relative rounded-xl p-5 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 cursor-pointer ${
                  waiterCalled
                    ? "bg-red-200 border-red-400 animate-pulse-waiter"
                    : occupied
                            ? "bg-gradient-to-br from-white to-blue-100 border-blue-300"
                    : "bg-gradient-to-br from-white to-green-100 border-green-300"
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
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : "bg-green-100 text-green-800 border border-green-200"
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
                    <div className="text-xs text-slate-500 mb-1">
                      Assigned to
                    </div>
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
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        handleResetTable(String(table._id || table.id));
                      }}
                      disabled={resettingTableId === String(table._id || table.id)}
                      className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Reset Table"
                    >
                      {resettingTableId === String(table._id || table.id) ? (
                        <div className="animate-spin h-4 w-4 rounded-full border-t-2 border-b-2 border-slate-600" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </button>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </article>
            );
          })}
      </div>
    </>
  );
}
