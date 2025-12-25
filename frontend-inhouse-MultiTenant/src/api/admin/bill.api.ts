import client from "./client";

export type BillItem = {
  itemId: string;
  name: string;
  qty: number;
  price: number;
  priceAtOrder: number;
  modifiers: any[]; // Assuming modifiers can be various types
  notes: string;
  OrderNumberForDay?: number;
  _id?: { $oid: string };
};

export type BillTax = {
  name: string;
  rate: number;
  amount: number;
  _id: { $oid: string };
};

export type BillAudit = {
  by: string;
  action: string;
  at: { $date: string };
  _id: { $oid: string };
};

export type Bill = {
  _id: { $oid: string };
  restaurantId: string;
  tableId: string;
  tableNumber: number;
  sessionId: string;
  orderId: { $oid: string };
  orderNumberForDay: number;
  customerName: string;
  customerContact: string;
  customerEmail: string;
  isCustomerOrder: boolean;
  appliedDiscountPercent: number;
  discountPercent: number;
  appliedServiceChargePercent: number;
  serviceChargePercent: number;
  customerNotes: string | null;
  items: BillItem[];
  extras: any[]; // Assuming extras can be various types
  subtotal: number;
  taxes: BillTax[];
  taxAmount: number;
  discountAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  status: string; // e.g., "finalized"
  audit: BillAudit[];
  paymentStatus: string; // e.g., "unpaid"
  staffAlias: string;
  finalizedByAlias: string;
  finalizedAt: { $date: string };
  paymentMarkedBy: string;
  paidAt: { $date: string } | null;
  overrideToken: string | null;
  createdAt: { $date: string };
  updatedAt: { $date: string };
  __v: number;
};

export async function fetchBill(rid: string) {
  const res = await client.get(`/api/${rid}/bills/active`);
  console.log('response from fetchBill API:', res);
  return res;
}

export async function getBillHistory(rid: string): Promise<Bill[]> {
  try {
    const res = await client.get(`/api/${rid}/bills/history`);
    return res.bills || [];
  } catch (error) {
    console.error("Error fetching bill history:", error);
    return []; // Return empty array on error
  }
}
