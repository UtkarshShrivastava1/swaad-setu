// src/pages/StaffDashboard/hooks/useBilling.ts
import { useCallback, useState } from "react";
import {
  addItemToBillForTable,
  decrementBillItem,
  // FETCH / READ
  fetchBillById, // wraps updateBillDraft (tableId not required)

  // STATUS / FINALIZE / PAY
  finalizeBill,
  // LINE ITEM MUTATIONS (if you have these routes)
  incrementBillItem,
  markBillPaid,
  // DRAFT / EDIT
  updateBillDraft,
  updateBillStatus,
} from "../../../api/staff/bill.api";

import { updateOrderStatus } from "../../../api/staff/staff.operations.api";
import type { Order } from "../types";
import { usePendingTracker } from "./usePendingTracker";

/**
 * Hook: useBilling (staff-only)
 * ---------------------------------
 * Central place to:
 * - Refresh current bill
 * - Edit items (add/patch/remove, inc/dec)
 * - Apply discounts / service charge
 * - Finalize and mark paid
 * - Update related Order status (Accepted/Preparing/Ready/Served)
 *
 * Notes:
 * - billId is taken as (order.serverId ?? order.id)
 * - Table variants removed; we patch via updateBillDraft()
 */
export function useBilling(
  showBillDetail: Order | null,
  setShowBillDetail: (b: Order | null) => void,
  activeOrders: Order[],
  setActiveOrders: (o: Order[]) => void
) {
  const { isPending, markPending, unmarkPending, globalError, setGlobalError } =
    usePendingTracker();

  const [error, setError] = useState<string | null>(null);

  /** 🧩 Normalize API bill (or order-shaped) into our Order type */
  const normalizeBillResponseToOrder = (
    resp: any,
    prevOrder?: Order
  ): Order => {
    if (!resp) return prevOrder ?? ({} as Order);

    const items =
      Array.isArray(resp.items) && resp.items.length
        ? resp.items.map((it: any) => ({
            name: it.name,
            qty: it.qty ?? it.quantity ?? 1,
            price: it.price ?? it.priceAtOrder ?? 0,
            notes: it.notes,
            id: it.id ?? it.menuItemId,
          }))
        : prevOrder?.items ?? [];

    return {
      id: String(resp.id ?? resp._id ?? prevOrder?.id ?? ""),
      serverId: String(resp.serverId ?? resp._id ?? prevOrder?.serverId ?? ""),
      tableId: String(resp.tableId ?? prevOrder?.tableId ?? ""),
      sessionId: resp.sessionId ?? prevOrder?.sessionId,
      items,
      tableNumber:
        resp.tableNumber != null
          ? String(resp.tableNumber)
          : prevOrder?.tableNumber,
      subtotal: Number(resp.subtotal ?? prevOrder?.subtotal ?? 0),
      totalAmount: Number(resp.totalAmount ?? prevOrder?.totalAmount ?? 0),
      amount: Number(resp.amount ?? resp.totalAmount ?? resp.subtotal ?? 0),
      status: prevOrder?.status ?? ("placed" as Order["status"]),
      paymentStatus: (resp.paymentStatus ??
        prevOrder?.paymentStatus ??
        "unpaid") as Order["paymentStatus"],
      customerName: resp.customerName ?? prevOrder?.customerName,
      staffAlias: resp.staffAlias ?? prevOrder?.staffAlias,
      version:
        typeof resp.version === "number"
          ? resp.version
          : prevOrder?.version ?? 1,
      createdAt:
        resp.createdAt ?? prevOrder?.createdAt ?? new Date().toISOString(),
    };
  };

  /** 🔄 Update activeOrders list + focused bill */
  const updateLocalOrders = (normalized: Order) => {
    setActiveOrders((prev: Order[]) => {
      const idx = prev.findIndex(
        (p: Order) =>
          p.serverId === normalized.serverId || p.id === normalized.id
      );
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = normalized;
        return copy;
      }
      return [normalized, ...prev];
    });
    setShowBillDetail(normalized);
  };

  /** 🧾 Resolve billId for current selection */
  const getBillId = (order: Order | null) =>
    order ? String(order.serverId ?? order.id) : null;

  /* ===========================
     ACTIONS
  =========================== */

  /** 🔁 Refresh current bill */
  const onRefresh = useCallback(async (): Promise<Order | null> => {
    const target = showBillDetail;
    if (!target) return null;

    const billId = getBillId(target);
    if (!billId) return null;

    markPending(billId);
    try {
      const resp = await fetchBillById(billId);
      const normalized = normalizeBillResponseToOrder(resp, target);
      updateLocalOrders(normalized);
      return normalized;
    } catch (e) {
      console.error("[useBilling] refresh failed:", e);
      setError("Failed to refresh bill");
      return null;
    } finally {
      unmarkPending(billId);
    }
  }, [showBillDetail]);

  /** ✅ Finalize bill */
  const onFinalize = useCallback(async (): Promise<Order> => {
    const target = showBillDetail;
    if (!target) throw new Error("No bill selected");

    const billId = getBillId(target)!;
    if (isPending(billId)) throw new Error("Operation pending");

    markPending(billId);
    try {
      const resp = await finalizeBill(billId);
      const normalized = normalizeBillResponseToOrder(resp, target);
      updateLocalOrders(normalized);
      return normalized;
    } catch (e) {
      console.error("[useBilling] finalize failed:", e);
      setError("Failed to finalize bill");
      throw e;
    } finally {
      unmarkPending(billId);
    }
  }, [showBillDetail]);

  /** 💸 Mark paid */
  const onMarkPaid = useCallback(
    async (payment: {
      amount: number;
      method: string;
      txId?: string;
      paidBy?: string;
    }): Promise<Order> => {
      const target = showBillDetail;
      if (!target) throw new Error("No bill selected");

      const billId = getBillId(target)!;
      if (isPending(billId)) throw new Error("Operation pending");

      markPending(billId);
      try {
        const resp = await markBillPaid(billId, payment, payment.txId);
        const normalized = normalizeBillResponseToOrder(resp, target);
        updateLocalOrders(normalized);
        return normalized;
      } catch (e) {
        console.error("[useBilling] mark-paid failed:", e);
        setError("Failed to mark bill paid");
        throw e;
      } finally {
        unmarkPending(billId);
      }
    },
    [showBillDetail]
  );

  /** ➕ Add item (from menu dropdown) */
  const onAddItem = useCallback(
    async (item: {
      name: string;
      qty: number;
      price: number;
      notes?: string;
    }) => {
      const target = showBillDetail;
      if (!target) throw new Error("No bill selected");

      const billId = getBillId(target)!;
      if (isPending(billId)) throw new Error("Operation pending");

      markPending(billId);
      try {
        // addItemToBillForTable internally uses updateBillDraft (tableId is not required)
        const resp = await addItemToBillForTable(
          target.tableId ?? "",
          billId,
          item
        );
        const normalized = normalizeBillResponseToOrder(resp, target);
        updateLocalOrders(normalized);
        return normalized;
      } catch (e) {
        console.error("[useBilling] add-item failed:", e);
        setError("Failed to add item");
        throw e;
      } finally {
        unmarkPending(billId);
      }
    },
    [showBillDetail]
  );

  /** 🔼 Increment item quantity (if backend routes exist) */
  const onIncrementItem = useCallback(
    async (itemId: string) => {
      const target = showBillDetail;
      if (!target) throw new Error("No bill selected");
      const billId = getBillId(target)!;

      if (isPending(billId)) throw new Error("Operation pending");
      markPending(billId);

      try {
        const resp = await incrementBillItem(billId, itemId);
        const normalized = normalizeBillResponseToOrder(resp, target);
        updateLocalOrders(normalized);
        return normalized;
      } catch (e) {
        console.error("[useBilling] increment item failed:", e);
        setError("Failed to increment item");
        throw e;
      } finally {
        unmarkPending(billId);
      }
    },
    [showBillDetail]
  );

  /** 🔽 Decrement item quantity (if backend routes exist) */
  const onDecrementItem = useCallback(
    async (itemId: string) => {
      const target = showBillDetail;
      if (!target) throw new Error("No bill selected");
      const billId = getBillId(target)!;

      if (isPending(billId)) throw new Error("Operation pending");
      markPending(billId);

      try {
        const resp = await decrementBillItem(billId, itemId);
        const normalized = normalizeBillResponseToOrder(resp, target);
        updateLocalOrders(normalized);
        return normalized;
      } catch (e) {
        console.error("[useBilling] decrement item failed:", e);
        setError("Failed to decrement item");
        throw e;
      } finally {
        unmarkPending(billId);
      }
    },
    [showBillDetail]
  );

  /** ✏️ Patch a specific item (qty/price/notes) */
  const onPatchItem = useCallback(
    async (
      index: number,
      patchFields: Partial<{ qty: number; price: number; notes?: string }>
    ): Promise<Order> => {
      const target = showBillDetail;
      if (!target) throw new Error("No bill selected");
      const billId = getBillId(target)!;

      if (isPending(billId)) throw new Error("Operation pending");
      markPending(billId);

      try {
        const bill = await fetchBillById(billId);
        const items = Array.isArray(bill.items) ? [...bill.items] : [];
        if (index < 0 || index >= items.length)
          throw new Error("Invalid item index");

        items[index] = { ...items[index], ...patchFields };

        const resp = await updateBillDraft(billId, {
          items,
          version: (bill as any).version ?? null,
        });

        const normalized = normalizeBillResponseToOrder(resp, target);
        updateLocalOrders(normalized);
        return normalized;
      } catch (e) {
        console.error("[useBilling] patch item failed:", e);
        setError("Failed to update item");
        throw e;
      } finally {
        unmarkPending(billId);
      }
    },
    [showBillDetail]
  );

  /** ❌ Remove item by id or index */
  const onRemoveItem = useCallback(
    async (opts: { id?: string; index?: number }): Promise<Order> => {
      const target = showBillDetail;
      if (!target) throw new Error("No bill selected");
      const billId = getBillId(target)!;

      if (isPending(billId)) throw new Error("Operation pending");
      markPending(billId);

      try {
        const bill = await fetchBillById(billId);
        const items = Array.isArray(bill.items) ? [...bill.items] : [];

        let nextItems = items;
        if (typeof opts.index === "number") {
          if (opts.index < 0 || opts.index >= items.length) {
            throw new Error("Invalid item index");
          }
          nextItems = items.filter((_, i) => i !== opts.index);
        } else if (opts.id) {
          nextItems = items.filter(
            (it: any) => String(it.id) !== String(opts.id)
          );
        } else {
          throw new Error("Provide id or index to remove item");
        }

        const resp = await updateBillDraft(billId, {
          items: nextItems,
          version: (bill as any).version ?? null,
        });

        const normalized = normalizeBillResponseToOrder(resp, target);
        updateLocalOrders(normalized);
        return normalized;
      } catch (e) {
        console.error("[useBilling] remove item failed:", e);
        setError("Failed to remove item");
        throw e;
      } finally {
        unmarkPending(billId);
      }
    },
    [showBillDetail]
  );

  /** 🧾 Update BILL status (draft/finalized/paid/cancelled) */
  const onUpdateStatus = useCallback(
    async (
      newStatus: "draft" | "finalized" | "paid" | "cancelled"
    ): Promise<Order> => {
      const target = showBillDetail;
      if (!target) throw new Error("No bill selected");
      const billId = getBillId(target)!;

      if (isPending(billId)) throw new Error("Operation pending");
      markPending(billId);

      try {
        const resp = await updateBillStatus(billId, newStatus);
        const normalized = normalizeBillResponseToOrder(resp, target);
        updateLocalOrders(normalized);
        return normalized;
      } catch (e) {
        console.error("[useBilling] bill status update failed:", e);
        setError("Failed to update bill status");
        throw e;
      } finally {
        unmarkPending(billId);
      }
    },
    [showBillDetail]
  );

  /** 🍽️ Update ORDER status (Accepted / Preparing / Ready / Served) */
  const onUpdateOrderStatus = useCallback(
    async (
      orderId: string,
      newStatus: string
    ): Promise<{ status: string; version: number }> => {
      const order = activeOrders.find(
        (o) => o.id === orderId || o.serverId === orderId
      );
      if (!order) throw new Error("Order not found");
      if (isPending(orderId)) throw new Error("Operation pending");

      markPending(orderId);
      try {
        const res = await updateOrderStatus(
          orderId,
          newStatus,
          order.version ?? 1
        );

        setActiveOrders((prev: Order[]) =>
          prev.map((o: Order) =>
            o.id === orderId || o.serverId === orderId
              ? { ...o, status: res.status, version: res.version }
              : o
          )
        );

        if (
          showBillDetail?.id === orderId ||
          showBillDetail?.serverId === orderId
        ) {
          setShowBillDetail({
            ...showBillDetail,
            status: res.status,
            version: res.version,
          });
        }
      } catch (err) {
        console.error("[useBilling] order status update failed:", err);
        setError("Failed to update order status");
        throw err;
      } finally {
        unmarkPending(orderId);
      }
    },
    [activeOrders, showBillDetail, isPending, markPending, unmarkPending]
  );

  return {
    // fetch / refresh
    onRefresh,

    // lifecycle
    onFinalize,
    onMarkPaid,
    onUpdateStatus,

    // items
    onAddItem,
    onPatchItem,
    onRemoveItem,
    onIncrementItem,
    onDecrementItem,

    // related order status
    onUpdateOrderStatus,

    // pending/error
    isPending,
    markPending,
    unmarkPending,
    error,
    setError,
    globalError,
    setGlobalError,
  };
}
