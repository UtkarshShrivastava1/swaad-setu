// src/api/staff/order.api.ts
import { client } from "../client";

/**
 * Update an Order document when the Bill is finalized or paid.
 * The caller must pass the correct { rid } (restaurantId).
 */
export async function updateOrderFromBill(
  rid: string,
  orderId: string,
  bill: any,
  type: "finalize" | "payment" = "finalize"
) {
  if (!rid) throw new Error("rid is required");
  if (!orderId) throw new Error("orderId is required");
  if (!bill) throw new Error("bill data is required");

  // Prepare payload aligned with Order schema
  const payload: Record<string, any> = {
    subtotal: bill.subtotal,
    discountAmount: bill.discountAmount,
    serviceChargeAmount: bill.serviceChargeAmount,
    taxAmount: bill.taxAmount,
    totalAmount: bill.total,
    appliedDiscountPercent: bill.discountPercent,
    appliedTaxes: (bill.taxes || []).map((t: any) => ({
      name: t.name,
      percent: t.rate,
      amount: t.amount,
      code: t.name?.toUpperCase().replace(/\s+/g, "_") || "TAX",
    })),
    updatedAt: new Date().toISOString(),
  };

  // On payment → close order
  if (type === "payment") {
    payload.paymentStatus = "paid";
    payload.isOrderComplete = true;
    payload.status = "billed";
  }

  // Perform multi-tenant PATCH update
  return client.patch(`/api/${rid}/orders/${orderId}`, payload, {
    headers: { "Content-Type": "application/json" },
  });
}