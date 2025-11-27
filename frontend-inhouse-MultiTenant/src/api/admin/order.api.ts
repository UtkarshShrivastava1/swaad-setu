import client from "./client";

export type OrderItem = {
  menuItemId: { $oid: string };
  name: string;
  quantity: number;
  price: number;
  priceAtOrder: number;
  notes: string;
  status: "placed" | "preparing" | "ready" | "served" | "cancelled";
  _id: { $oid: string };
  createdAt: { $date: string };
  updatedAt: { $date: string };
};

export type Order = {
  _id: { $oid: string };
  restaurantId: string;
  tableId: string;
  sessionId: string;
  items: OrderItem[];
  totalAmount: number;
  status: "placed" | "preparing" | "ready" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "partial";
  isCustomerOrder: boolean;
  customerName: string;
  customerEmail: string;
  staffAlias: string | null;
  overrideToken: string | null;
  version: number;
  createdAt: { $date: string };
  updatedAt: { $date: string };
  __v: number;
  discountAmount?: number;
  serviceChargeAmount?: number;
  appliedTaxes?: {
    _id: string;
    name: string;
    percent: number;
    amount: number;
  }[];
};

export async function createOrder(rid: string, payload: object) {
  return client.post(`/api/${rid}/orders`, payload);
}

export async function getOrder(rid: string): Promise<Order[]> {
  return client.get(`/api/${rid}/orders/active`);
}

export async function getOrderById(
  rid: string,
  sessionId: string,
  _id: string
): Promise<Order> {
  return client.get(`/api/${rid}/orders/${_id}/order?sessionId=${sessionId}`);
}
