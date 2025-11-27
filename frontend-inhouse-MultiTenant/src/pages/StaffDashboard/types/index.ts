// src/pages/StaffDashboard/types/index.ts

export type PaymentStatus = "paid" | "cancelled" | "unpaid" | "partial";

export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "done";

export interface BillItem {
  name: string;
  qty: number;
  price: number;
  notes?: string;
  id: string;
}

export interface ApiTable {
  _id?: string;
  id?: string;
  restaurantId?: string;
  tableNumber: number;
  capacity?: number;
  status?: string;
  isActive?: boolean;
  currentSessionId?: string;
  sessionExpiresAt?: string;
  staffAlias?: string;
  lastUsed?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  waiterCalled?: boolean;
  bills?: Bill[];
}

export interface Table {
  _id?: string;
  id: string;
  tableNumber: number;
  waiterCalled: boolean;
  bills: Bill[];
  capacity?: number;
  status?: string;
  isActive?: boolean;
  currentSessionId?: string;
  sessionExpiresAt?: string;
  staffAlias?: string;
  lastUsed?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Bill {
  id: string;
  serverId: string;
  tableId: string;
  sessionId?: string;
  items: BillItem[];
  tableNumber: string;
  subtotal: number;
  totalAmount: number;
  amount: number;
  status: "draft" | "finalized" | "paid" | "cancelled";
  paymentStatus: PaymentStatus;
  customerName?: string;
  staffAlias?: string;
  version?: number;
  createdAt: string;
}

export interface Order {
  _id?: string;
  id: string;
  serverId: string;
  tableId: string;
  sessionId?: string;
  items: BillItem[];
  tableNumber: string;
  subtotal: number;
  totalAmount: number;
  amount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerName?: string;
  staffAlias?: string;
  version: number;
  createdAt: string;
  preBill?: {
    subtotal: number;
    taxes: number;
    discount: number;
    serviceCharge: number;
    total: number;
  };
}
