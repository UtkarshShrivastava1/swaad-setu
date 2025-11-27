import { extractTableId } from "./extractors";

export interface ApiOrderItem {
  menuItemId?: string;
  name: string;
  quantity: number;
  priceAtOrder: number;
  notes?: string;
  status?: string;
}

export interface ApiOrder {
  _id: string;
  tableId: string | { _id?: string; tableNumber?: number | string } | null;
  tableNumber?: number | string | null;
  items: ApiOrderItem[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  customerName?: string;
  staffAlias?: string;
  version: number;
  createdAt: string;
}

export interface BillItem {
  name: string;
  qty: number;
  price: number;
  notes?: string;
  id?: string;
}

export interface Order {
  id: string;
  serverId?: string;
  tableId: string;
  tableNumber?: string | null;
  sessionId?: string;
  items: BillItem[];
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

/** 🔧 Normalize order items */
export const normalizeBillItems = (items: ApiOrderItem[] = []): BillItem[] =>
  (items || []).map((item) => ({
    name: item.name,
    qty: item.quantity,
    price: item.priceAtOrder,
    notes: item.notes,
    id: item.menuItemId ?? undefined,
  }));

/** 🔧 Normalize order object */
export const normalizeOrder = (
  apiOrder: ApiOrder,
  tableNumberFromMap?: string
): Order => {
  console.groupCollapsed(
    "%c[normalizeOrder] 🧩 Normalizing order",
    "color:#2196F3;font-weight:bold;"
  );
  console.log("Raw API order:", apiOrder);
  console.log("Table number from map:", tableNumberFromMap);

  let resolvedTableNumber: string | null = null;

  // Direct value from API
  if (apiOrder.tableNumber != null) {
    resolvedTableNumber = String(apiOrder.tableNumber);
  }
  // Table object case
  else if (
    typeof apiOrder.tableId === "object" &&
    apiOrder.tableId !== null &&
    (apiOrder.tableId as any).tableNumber
  ) {
    resolvedTableNumber = String((apiOrder.tableId as any).tableNumber);
  }
  // Map fallback
  else if (tableNumberFromMap) {
    resolvedTableNumber = String(tableNumberFromMap);
  }

  const tableId = extractTableId(apiOrder.tableId);

  const normalized: Order = {
    id: String(apiOrder._id),
    serverId: String(apiOrder._id),
    tableId,
    tableNumber: resolvedTableNumber,
    items: normalizeBillItems(apiOrder.items || []),
    subtotal: apiOrder.totalAmount,
    totalAmount: apiOrder.totalAmount,
    amount: apiOrder.totalAmount,
    status: apiOrder.status,
    paymentStatus: apiOrder.paymentStatus,
    customerName: apiOrder.customerName,
    staffAlias: apiOrder.staffAlias,
    version: apiOrder.version,
    createdAt: apiOrder.createdAt,
  };

  console.log("✅ Normalized order:", normalized);
  console.groupEnd();
  return normalized;
};
