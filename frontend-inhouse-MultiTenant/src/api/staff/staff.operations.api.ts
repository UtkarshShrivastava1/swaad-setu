// src/api/staff/staff.operations.api.ts

import { client } from "../client";

/* ---------------------------
 * Types (unchanged)
 * --------------------------- */

export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "done";

export type PaymentStatus = "unpaid" | "paid";

export interface ApiOrderItem {
  _id?: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  priceAtOrder: number;
  price?: number;
  notes?: string;
  status?: OrderStatus;
}

export interface ApiOrder {
  _id: string;
  restaurantId?: string;
  tableId: string;
  tableNumber: number;
  sessionId?: string;
  items: ApiOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  isCustomerOrder?: boolean;
  customerName?: string;
  customerContact?: string;
  customerEmail?: string;
  isOrderComplete?: boolean;
  staffAlias?: string;
  overrideToken?: string;
  version: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiTable {
  _id: string;
  id?: string;
  waiterCalled?: boolean;
  tableNumber: number;
  capacity: number;
  status: string;
  isActive: boolean;
  currentSessionId?: string;
  staffAlias?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiBillItem {
  _id?: string;
  menuItemId?: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface ApiBill {
  _id: string;
  tableId: string;
  sessionId?: string;
  staffAlias?: string;
  items: ApiBillItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  createdAt?: string;
  updatedAt?: string;
}

/* ---------------------------
 * Auth Helper
 * --------------------------- */

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("staffToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ---------------------------
 * ACTIVE ORDERS
 * --------------------------- */

export async function getActiveOrders(rid: string): Promise<ApiOrder[]> {
  return client.get(`/api/${rid}/orders/active`, {
    headers: authHeaders(),
  });
}

/* ---------------------------
 * UPDATE ORDER STATUS
 * --------------------------- */

export async function updateOrderStatus(
  rid: string,
  orderId: string,
  status: string,
  version: number
): Promise<ApiOrder> {
  return client.patch(
    `/api/${rid}/orders/${orderId}/status`,
    {
      status,
      version,
    },
    {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    }
  );
}

/* ---------------------------
 * BILLS: CREATE → EDIT → FINALIZE → MARK PAID
 * --------------------------- */

export async function createDraftBill(
  rid: string,
  billData: Omit<ApiBill, "_id">
): Promise<ApiBill> {
  return client.post(`/api/${rid}/bills`, billData, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
}

export async function editDraftBill(
  rid: string,
  billId: string,
  updates: Partial<ApiBill>
): Promise<ApiBill> {
  return client.patch(`/api/${rid}/bills/${billId}`, updates, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
}

export async function finalizeBill(
  rid: string,
  billId: string,
  staffAlias: string
): Promise<ApiBill> {
  return client.patch(
    `/api/${rid}/bills/${billId}/finalize`,
    { staffAlias },
    {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    }
  );
}

export async function markBillPaid(
  rid: string,
  billId: string,
  staffAlias: string,
  paymentNote?: string
): Promise<ApiBill> {
  return client.post(
    `/api/${rid}/bills/${billId}/mark-paid`,
    { staffAlias, paymentNote },
    {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    }
  );
}

/* ---------------------------
 * TABLES
 * --------------------------- */

export async function getTables(rid: string): Promise<ApiTable[]> {
  return client.get(`/api/${rid}/tables`, {
    headers: authHeaders(),
  });
}

export async function getTableByNumber(
  rid: string,
  tableNumber: string
): Promise<ApiTable> {
  return client.get(`/api/${rid}/tables/${tableNumber}`, {
    headers: authHeaders(),
  });
}

export async function assignSessionToTable(
  rid: string,
  tableId: string,
  sessionId: string,
  staffAlias: string
): Promise<{ success: boolean }> {
  return client.patch(
    `/api/${rid}/tables/${tableId}/session`,
    { sessionId, staffAlias },
    {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    }
  );
}

export async function resetTable(
  rid: string,
  tableId: string
): Promise<ApiTable> {
  return client.patch(`/api/${rid}/tables/${tableId}/reset`, {}, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
}

/* ---------------------------
 * ORDER HISTORY (cleaned)
 * --------------------------- */

export interface OrderHistoryParams {
  startDate?: string | Date;
  endDate?: string | Date;
  limit?: number;
  page?: number;
}

export async function getOrderHistory(
  rid: string,
  params?: OrderHistoryParams
): Promise<ApiOrder[]> {
  const qs = params
    ? "?" +
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => {
          if (v instanceof Date) v = v.toISOString().split("T")[0];
          return `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`;
        })
        .join("&")
    : "";

  return client.get(`/api/${rid}/orders/history${qs}`, {
    headers: authHeaders(),
  });
}

/* ---------------------------
 * DELETE ORDER
 * --------------------------- */

export async function deleteOrderById(
  rid: string,
  orderId: string
): Promise<any> {
  return client.delete(`/api/${rid}/orders/${orderId}`, {
    headers: authHeaders(),
  });
}

/* ---------------------------
 * GET WAITER NAMES
 * --------------------------- */

export async function getWaiterNames(rid?: string) {
  if (!rid) {
    console.warn("[getWaiterNames] No rid provided — skipping request");
    return { waiterNames: [] };
  }

  return client.get(`/api/${rid}/admin/waiters`, {
    headers: authHeaders(),
  });
}

/* ---------------------------
 * GET ORDERS FOR A TABLE
 * --------------------------- */

export async function getOrdersByTable(
  rid: string,
  tableId: string
): Promise<ApiOrder[]> {
  const response = await client.get(`/api/${rid}/orders/table/${tableId}`, {
    headers: authHeaders(),
  });

  if (Array.isArray(response)) return response;
  if (Array.isArray((response as any).data)) return (response as any).data;
  if (Array.isArray((response as any).orders)) return (response as any).orders;

  return [];
}

/* ---------------------------
 * BILL BY ORDER ID
 * --------------------------- */

export async function getBillByOrderId(
  rid: string,
  orderId: string
): Promise<ApiBill> {
  return client.get(`/api/${rid}/orders/bill/${encodeURIComponent(orderId)}`, {
    headers: authHeaders(),
  });
}
