// src/api/bill.api.ts
import { client } from "../client";

/* ---------------------------------------------
   Types
--------------------------------------------- */
export type BillStatus =
  | "pending"
  | "preparing"
  | "served"
  | "completed"
  | "draft"
  | "finalized"
  | "paid";

export type PaymentMethod = "CASH" | "CARD" | "UPI" | "WALLET" | string;

export interface BillItem {
  name: string;
  qty: number;
  price: number;
  notes?: string;
}

export interface BillTax {
  name: string;
  rate: number;
  amount: number;
}

export interface BillExtra {
  name?: string;
  label?: string;
  amount: number;
}

export interface ApiBill {
  _id: string;
  id?: string;
  orderId: string;
  tableId?: string;
  tableNumber?: string;
  items: BillItem[];
  extras?: BillExtra[];
  taxes?: BillTax[];
  subtotal: number;
  taxAmount: number;
  discountPercent: number;
  discountAmount: number;
  serviceChargePercent: number;
  serviceChargeAmount: number;
  total: number;
  paymentStatus?: string;
  status?: BillStatus;
  staffAlias?: string;
  appliedServiceChargePercent?: number;
  appliedDiscountPercent?: number;
  createdAt?: string;
  sessionId?: string;
  customerName?: string;
  customerContact?: string;
  customerEmail?: string;
  customerNotes?: string;
  orderNumberForDay?: string;
}

/* ---------------------------------------------
   Auth headers
--------------------------------------------- */
function getAuthHeaders(idempotencyKey?: string) {
  const token = localStorage.getItem("staffToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  return headers;
}

/* ======================================================
   FETCH / READ
====================================================== */

export async function getBillByOrderId(
  rid: string,
  orderId: string
): Promise<ApiBill> {
  return client.get(`/api/${rid}/orders/bill/${encodeURIComponent(orderId)}`, {
    headers: getAuthHeaders(),
  });
}

export async function fetchBillById(rid: string, id: string) {
  if (!rid || !id) throw new Error("Missing rid or billId");

  const res = await client.get(`/api/${rid}/bills/${id}`, {
    headers: getAuthHeaders(),
  });

  return res.data;
}

export async function getActiveBills(
  rid: string,
  query?: Record<string, any>
): Promise<ApiBill[]> {
  const qs = query ? `?${new URLSearchParams(query).toString()}` : "";
  return client.get(`/api/${rid}/bills/active${qs}`, {
    headers: getAuthHeaders(),
  });
}

export async function getBillsHistory(
  rid: string,
  params?: {
    from?: string;
    to?: string;
    limit?: number;
    page?: number;
    status?: string;
  }
): Promise<{
  bills: ApiBill[];
  summary: any;
  pagination: any;
}> {
  const qs = params ? `?${new URLSearchParams(params as any).toString()}` : "";

  return client.get(`/api/${rid}/bills/history${qs}`, {
    headers: getAuthHeaders(),
  });
}

/* ======================================================
   CREATE / UPDATE
====================================================== */

export async function createBillFromOrder(
  rid: string,
  orderId: string,
  payload: any = {}
): Promise<ApiBill> {
  const url = `/api/${rid}/orders/${orderId}/bill`;

  try {
    const res = await client.post(url, payload, {
      headers: getAuthHeaders(),
    });

    return res.data.bill || res.data;
  } catch (err: any) {
    if (err?.response?.status === 409) {
      const existingBill = err?.response?.data?.bill;
      if (existingBill) return existingBill;
      throw new Error("Active bill exists");
    }

    throw new Error(
      err?.response?.data?.error || "Failed to create bill from order"
    );
  }
}

export async function updateBillDraft(
  rid: string,
  billId: string,
  patch: any
): Promise<ApiBill> {
  await client.patch(`/api/${rid}/bills/${billId}`, patch, {
    headers: getAuthHeaders(),
  });

  return fetchBillById(rid, billId);
}

/* ======================================================
   FINALIZE / PAYMENT
====================================================== */

export async function finalizeBill(
  rid: string,
  billId: string,
  payload?: any
): Promise<ApiBill> {
  return client.post(`/api/${rid}/bills/${billId}/finalize`, payload || {}, {
    headers: getAuthHeaders(),
  });
}

export async function markBillPaid(
  rid: string,
  billId: string,
  payment: {
    amount: number;
    method: PaymentMethod;
    txId?: string;
    paidBy?: string;
  },
  idempotencyKey?: string
): Promise<ApiBill> {
  return client.post(`/api/${rid}/bills/${billId}/mark-paid`, payment, {
    headers: getAuthHeaders(idempotencyKey),
  });
}

/* ======================================================
   BILL ITEM MODIFY
====================================================== */

export async function incrementBillItem(
  rid: string,
  billId: string,
  itemId: string
): Promise<ApiBill> {
  return client.post(
    `/api/${rid}/bills/${billId}/items/${itemId}/increment`,
    {},
    { headers: getAuthHeaders() }
  );
}

export async function decrementBillItem(
  rid: string,
  billId: string,
  itemId: string
): Promise<ApiBill> {
  return client.post(
    `/api/${rid}/bills/${billId}/items/${itemId}/decrement`,
    {},
    { headers: getAuthHeaders() }
  );
}

/* ======================================================
   MENU HELPERS (STAFF)
====================================================== */

export async function getMenu(rid: string) {
  return client.get(`/api/${rid}/admin/menu`, {
    headers: getAuthHeaders(),
  });
}

export async function fetchFullMenu(rid: string) {
  console.log("🟡 [fetchFullMenu] RID =", rid);

  try {
    const data = await client.get(`/api/${rid}/admin/menu`, {
      headers: getAuthHeaders(),
    });

    console.log("🟢 [fetchFullMenu] Received Data:", data);

    const items = Array.isArray(data.menu) ? data.menu : [];
    console.log("🟢 [fetchFullMenu] Extracted items:", items.length);

    return items.map((m: any) => ({
      _id: m._id,
      name: m.name,
      price: Number(m.price ?? 0),
      image: m.image,
      description: m.description,
      isActive: m.isActive,
    }));
  } catch (err) {
    console.error("💥 [fetchFullMenu] FAILURE:", err);
    throw err;
  }
}

/* ======================================================
   ADD ITEM CLIENT-SIDE
====================================================== */

export async function addItemToBillForTable(
  rid: string,
  billId: string,
  item: {
    name: string;
    qty: number;
    price: number;
    notes?: string;
    id?: string;
  }
) {
  const bill = await fetchBillById(rid, billId);

  const items = [...(bill.items || [])];
  const newItem = {
    ...item,
    id: item.id || `ui_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
  };

  items.push(newItem);

  return updateBillDraft(rid, billId, {
    items,
    version: (bill as any).version ?? null,
  });
}

/* ======================================================
   STATUS UPDATE
====================================================== */

export async function updateBillStatus(
  rid: string,
  billId: string,
  status: BillStatus
): Promise<ApiBill> {
  return client.patch(
    `/api/${rid}/bills/${billId}/status`,
    { status },
    { headers: getAuthHeaders() }
  );
}
