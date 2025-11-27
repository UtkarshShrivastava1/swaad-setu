// src/pages/StaffDashboard/hooks/useBilling.ts
import { useCallback, useState } from "react";
import {
  addItemToBillForTable,
  decrementBillItem,
  fetchBillById,
  finalizeBill,
  incrementBillItem,
  markBillPaid,
  updateBillDraft,
  updateBillStatus,
} from "../../../api/staff/bill.api";

import { updateOrderStatus } from "../../../api/staff/staff.operations.api";
import { useTenant } from "../../../context/TenantContext";
import type { Order } from "../types";
import { usePendingTracker } from "./usePendingTracker";

export function useBilling(
  showBillDetail: Order | null,
  setShowBillDetail: (b: Order | null) => void,
  activeOrders: Order[],
  setActiveOrders: (o: Order[]) => void
) {
  const { rid } = useTenant(); // 🔥 multi-tenant rid injected here

  const { isPending, markPending, unmarkPending, globalError, setGlobalError } =
    usePendingTracker();

  const [error, setError] = useState<string | null>(null);

  const normalizeBillResponseToOrder = (resp: any, prev?: Order): Order => {
    if (!resp) return prev ?? ({} as Order);

    const items =
      Array.isArray(resp.items) && resp.items.length
        ? resp.items.map((it: any) => ({
            name: it.name,
            qty: it.qty ?? it.quantity ?? 1,
            price: it.price ?? it.priceAtOrder ?? 0,
            notes: it.notes,
            id: it.id ?? it.menuItemId,
          }))
        : prev?.items ?? [];

    return {
      id: String(resp.id ?? resp._id ?? prev?.id ?? ""),
      serverId: String(resp.serverId ?? resp._id ?? prev?.serverId ?? ""),
      tableId: String(resp.tableId ?? prev?.tableId ?? ""),
      sessionId: resp.sessionId ?? prev?.sessionId,
      items,
      tableNumber:
        resp.tableNumber != null ? String(resp.tableNumber) : prev?.tableNumber,
      subtotal: Number(resp.subtotal ?? prev?.subtotal ?? 0),
      totalAmount: Number(resp.totalAmount ?? prev?.totalAmount ?? 0),
      amount: Number(resp.amount ?? resp.totalAmount ?? resp.subtotal ?? 0),
      status: prev?.status ?? "placed",
      paymentStatus: (resp.paymentStatus ??
        prev?.paymentStatus ??
        "unpaid") as Order["paymentStatus"],
      customerName: resp.customerName ?? prev?.customerName,
      staffAlias: resp.staffAlias ?? prev?.staffAlias,
      version:
        typeof resp.version === "number" ? resp.version : prev?.version ?? 1,
      createdAt: resp.createdAt ?? prev?.createdAt ?? new Date().toISOString(),
    };
  };

  const updateLocalOrders = (normalized: Order) => {
    setActiveOrders((prev) => {
      const idx = prev.findIndex(
        (o) => o.serverId === normalized.serverId || o.id === normalized.id
      );
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = normalized;
        return next;
      }
      return [normalized, ...prev];
    });

    setShowBillDetail(normalized);
  };

  const getBillId = (o: Order | null) =>
    o ? String(o.serverId ?? o.id) : null;

  // ================= ACTIONS =================== //

  /** Refresh */
  const onRefresh = useCallback(async (): Promise<Order | null> => {
    const target = showBillDetail;
    if (!target || !rid) return null;

    const billId = getBillId(target)!;
    markPending(billId);

    try {
      const resp = await fetchBillById(rid, billId); // 🔥 add rid
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
  }, [showBillDetail, rid]);

  /** Finalize */
  const onFinalize = useCallback(async (): Promise<Order> => {
    const target = showBillDetail;
    if (!target || !rid) throw new Error("No bill selected");

    const billId = getBillId(target)!;
    if (isPending(billId)) throw new Error("Pending op");

    markPending(billId);
    try {
      const resp = await finalizeBill(rid, billId); // 🔥 add rid
      const normalized = normalizeBillResponseToOrder(resp, target);
      updateLocalOrders(normalized);
      return normalized;
    } catch (e) {
      setError("Failed to finalize bill");
      throw e;
    } finally {
      unmarkPending(billId);
    }
  }, [showBillDetail, rid]);

  /** Mark Paid */
  const onMarkPaid = useCallback(
    async (payment) => {
      const target = showBillDetail;
      if (!target || !rid) throw new Error("No bill selected");

      const billId = getBillId(target)!;

      markPending(billId);
      try {
        const resp = await markBillPaid(rid, billId, payment, payment.txId); // 🔥
        const normalized = normalizeBillResponseToOrder(resp, target);
        updateLocalOrders(normalized);
        return normalized;
      } catch (e) {
        setError("Failed to mark bill paid");
        throw e;
      } finally {
        unmarkPending(billId);
      }
    },
    [showBillDetail, rid]
  );

  /** Add Item */
  const onAddItem = useCallback(
    async (item) => {
      const target = showBillDetail;
      if (!target || !rid) throw new Error("No bill selected");

      const billId = getBillId(target)!;

      markPending(billId);
      try {
        const resp = await addItemToBillForTable(
          rid, // 🔥
          target.tableId ?? "",
          billId,
          item
        );
        const normalized = normalizeBillResponseToOrder(resp, target);
        updateLocalOrders(normalized);
        return normalized;
      } finally {
        unmarkPending(billId);
      }
    },
    [showBillDetail, rid]
  );

  /** Increment */
  const onIncrementItem = useCallback(
    async (itemId) => {
      const target = showBillDetail;
      if (!target || !rid) throw new Error("No bill selected");

      const billId = getBillId(target)!;

      markPending(billId);
      try {
        const resp = await incrementBillItem(rid, billId, itemId); // 🔥
        const normalized = normalizeBillResponseToOrder(resp, target);
        updateLocalOrders(normalized);
        return normalized;
      } finally {
        unmarkPending(billId);
      }
    },
    [showBillDetail, rid]
  );

  /** Decrement */
  const onDecrementItem = useCallback(
    async (itemId) => {
      const target = showBillDetail;
      if (!target || !rid) throw new Error("No bill selected");

      const billId = getBillId(target)!;

      markPending(billId);
      try {
        const resp = await decrementBillItem(rid, billId, itemId); // 🔥
        const normalized = normalizeBillResponseToOrder(resp, target);
        updateLocalOrders(normalized);
        return normalized;
      } finally {
        unmarkPending(billId);
      }
    },
    [showBillDetail, rid]
  );

  /** Patch Item */
  const onPatchItem = useCallback(
    async (index, patch) => {
      const target = showBillDetail;
      if (!target || !rid) throw new Error("No bill selected");

      const billId = getBillId(target)!;

      markPending(billId);
      try {
        const bill = await fetchBillById(rid, billId);
        const items = [...(bill.items || [])];

        if (index < 0 || index >= items.length)
          throw new Error("Invalid item index");

        items[index] = { ...items[index], ...patch };

        const resp = await updateBillDraft(rid, billId, {
          items,
          version: bill.version ?? null,
        });

        const normalized = normalizeBillResponseToOrder(resp, target);
        updateLocalOrders(normalized);
        return normalized;
      } finally {
        unmarkPending(billId);
      }
    },
    [showBillDetail, rid]
  );

  /** Remove Item */
  const onRemoveItem = useCallback(
    async ({ id, index }) => {
      const target = showBillDetail;
      if (!target || !rid) throw new Error("No bill selected");

      const billId = getBillId(target)!();

      markPending(billId);
      try {
        const bill = await fetchBillById(rid, billId);
        const items = [...(bill.items || [])];

        let nextItems = items;

        if (typeof index === "number") {
          nextItems = items.filter((_, i) => i !== index);
        } else if (id) {
          nextItems = items.filter((it: any) => String(it.id) !== String(id));
        }

        const resp = await updateBillDraft(rid, billId, {
          items: nextItems,
          version: bill.version ?? null,
        });

        const normalized = normalizeBillResponseToOrder(resp, target);
        updateLocalOrders(normalized);
        return normalized;
      } finally {
        unmarkPending(billId);
      }
    },
    [showBillDetail, rid]
  );

  /** Update Bill Status */
  const onUpdateStatus = useCallback(
    async (newStatus) => {
      const target = showBillDetail;
      if (!target || !rid) throw new Error("No bill selected");

      const billId = getBillId(target)!;

      markPending(billId);
      try {
        const resp = await updateBillStatus(rid, billId, newStatus); // 🔥
        const normalized = normalizeBillResponseToOrder(resp, target);
        updateLocalOrders(normalized);
        return normalized;
      } finally {
        unmarkPending(billId);
      }
    },
    [showBillDetail, rid]
  );

  /** Update ORDER status */
  const onUpdateOrderStatus = useCallback(
    async (orderId, newStatus) => {
      const order = activeOrders.find(
        (o) => o.id === orderId || o.serverId === orderId
      );
      if (!order || !rid) throw new Error("Order not found");

      markPending(orderId);
      try {
        const res = await updateOrderStatus(
          rid,
          orderId,
          newStatus,
          order.version ?? 1
        );

        setActiveOrders((prev) =>
          prev.map((o) =>
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
      } finally {
        unmarkPending(orderId);
      }
    },
    [activeOrders, showBillDetail, rid]
  );

  return {
    onRefresh,
    onFinalize,
    onMarkPaid,
    onUpdateStatus,

    onAddItem,
    onPatchItem,
    onRemoveItem,
    onIncrementItem,
    onDecrementItem,

    onUpdateOrderStatus,

    isPending,
    markPending,
    unmarkPending,
    error,
    setError,
    globalError,
    setGlobalError,
  };
}
