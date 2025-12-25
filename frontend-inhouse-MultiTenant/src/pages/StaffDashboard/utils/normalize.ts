import { extractTableId } from "./extractors";
import type { ApiBill } from "../../../api/staff/bill.api";

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
  isCustomerOrder?: boolean;
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
  isCustomerOrder?: boolean;
}

/** 🔧 Normalize a single raw bill from the API */
export const normalizeBill = (rawBill: any): ApiBill => {
  const nBill = { ...rawBill };

  // Handle _id
  if (nBill._id && nBill._id.$oid) {
    nBill._id = nBill._id.$oid;
  }

  // Handle orderId
  if (nBill.orderId && nBill.orderId.$oid) {
    nBill.orderId = nBill.orderId.$oid;
  }
  
  // Handle dates
  if (nBill.createdAt && nBill.createdAt.$date) {
    nBill.createdAt = new Date(nBill.createdAt.$date).toISOString();
  }
  if (nBill.updatedAt && nBill.updatedAt.$date) {
    nBill.updatedAt = new Date(nBill.updatedAt.$date).toISOString();
  }
  if (nBill.finalizedAt && nBill.finalizedAt.$date) {
    nBill.finalizedAt = new Date(nBill.finalizedAt.$date).toISOString();
  }

  // Handle total vs totalAmount
  if (nBill.totalAmount != null && nBill.total == null) {
    nBill.total = nBill.totalAmount;
  }

  return nBill as ApiBill;
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

  // Add warning for missing tableNumber
  if (!resolvedTableNumber || resolvedTableNumber.trim() === "") {
    console.warn(`[normalizeOrder] Missing or empty tableNumber for order ID: ${apiOrder._id}`, apiOrder);
  }

  const normalizedItems = normalizeBillItems(apiOrder.items || []);

  // Add warning for items with missing or zero price
  normalizedItems.forEach((item, index) => {
    if (item.price == null || item.price === 0) {
      console.warn(
        `[normalizeOrder] Item '${item.name}' (index ${index}) in order ID: ${apiOrder._id} has missing or zero priceAtOrder. Raw item:`,
        apiOrder.items?.[index]
      );
    }
  });

  const normalized: Order = {
    id: String(apiOrder._id),
    serverId: String(apiOrder._id),
    tableId,
    tableNumber: resolvedTableNumber,
    items: normalizedItems,
    subtotal: apiOrder.totalAmount,
    totalAmount: apiOrder.totalAmount,
    amount: apiOrder.totalAmount,
    status: apiOrder.status,
    paymentStatus: apiOrder.paymentStatus,
    customerName: apiOrder.customerName,
    staffAlias: apiOrder.staffAlias,
    version: apiOrder.version,
    createdAt: apiOrder.createdAt,
    isCustomerOrder: apiOrder.isCustomerOrder,
  };

  console.log("✅ Normalized order:", normalized);
  console.groupEnd();
  return normalized;
};
