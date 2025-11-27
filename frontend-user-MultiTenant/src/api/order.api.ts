import { api } from "./client";

// ====== TYPES ======
export type OrderItem = {
  menuItemId: string;
  name: string;
  quantity: number;
  price?: number;
  priceAtOrder?: number;
  notes?: string;
  status?: "placed" | "preparing" | "ready" | "served" | "cancelled";
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Order = {
  _id: string;
  restaurantId: string;
  tableId: string;
  sessionId: string;
  items: OrderItem[];
  totalAmount?: number;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  serviceChargeAmount?: number;
  status: "placed" | "preparing" | "ready" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "partial";
  isCustomerOrder: boolean;
  customerName: string;
  customerEmail: string;
  customerContact?: string | null;
  staffAlias?: string | null;
  overrideToken?: string | null;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

// ====== NORMALIZER ======
function normalizeOrderPayload(rid: string, tableId: string, payload: any) {
  // Create/reuse a customer session ID
  const sessionId =
    payload.sessionId ||
    sessionStorage.getItem("resto_session_id") ||
    `sess_${Math.random().toString(36).substring(2, 12)}`;

  // Save it if new
  sessionStorage.setItem("resto_session_id", sessionId);

  const normalized = {
    restaurantId: rid,
    tableId: tableId || payload.tableId,
    sessionId,
    customerName: payload.customerName || "Guest User",
    customerContact: payload.customerContact || null,
    customerEmail: payload.customerEmail || null,
    isCustomerOrder: true,
    staffAlias: "(Waiter)",
    notes: payload.notes || "",
    extras: payload.extras || [{ name: "Corkage", amount: 0 }],
    combos: payload.combos || [],
    items: payload.items || [],
  };

  console.log("📦 Normalized Order Payload:", normalized);
  return normalized;
}

// ====== CREATE ORDER ======
export async function createOrder(rid: string, tableId: string, payload: object) {
  const normalized = normalizeOrderPayload(rid, tableId, payload);

  return api(`/api/${rid}/orders`, {
    method: "POST",
    body: JSON.stringify(normalized),
    idempotency: true,
  });
}

// ====== GET ALL ORDERS FOR SESSION ======
export async function getOrder(
  rid: string,
  sessionId: string
): Promise<Order[]> {
  return api<Order[]>(`/api/${rid}/orders/history?sessionId=${sessionId}`, {
    method: "GET",
  });
}

// ====== GET SINGLE ORDER BY ID (Public) ======
export async function getOrderById(
  rid: string,
  orderId: string,
  sessionId?: string
): Promise<{ order: Order }> {
  const query = sessionId ? `?sessionId=${sessionId}` : "";
  const res =  api<{ order: Order }>(`/api/${rid}/orders/${orderId}${query}`, {
    method: "GET",
  });
  console.log(res)

  return res ; 
}

// ✅ ====== NEW: GET BILL (Public - No Auth Required) ======
export async function getPublicBill(
  rid: string,
  orderId: string,
  sessionId: string
): Promise<any> {
  if (!sessionId)
    throw new Error("sessionId is required for public bill access");

  const query = `?sessionId=${encodeURIComponent(sessionId)}`;
  return api(`/api/${rid}/orders/public/bill/${orderId}${query}`, {
    method: "GET",
  });
}
