import {
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Edit,
  Receipt,
  RefreshCw,
  User, // 👈 Add this
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import type { ApiBill } from "../../../api/staff/bill.api";
import { getBillByOrderId } from "../../../api/staff/staff.operations.api";
import { useTenant } from "../../../context/TenantContext";
import BillModalComponent from "./BillModalComponent";
import EditBillModal from "./EditBillModal";
import PaymentModal from "./PaymentModal";

const AUTO_REFRESH_MS = 15000; // 15s auto-refresh interval

export default function BillingView({
  showBillDetail,
  handleUpdateOrderStatus,
  goBack,
  formatINR,
  isPending,
  staffToken,
  apiBase = import.meta.env.VITE_API_BASE_URL,
}: {
  showBillDetail: any;
  handleUpdateOrderStatus: (
    orderId: string,
    newStatus: string
  ) => Promise<void>;
  goBack: () => void;
  formatINR: (n?: number | null) => string;
  isPending: (id?: string) => boolean;
  staffToken: string;
  apiBase?: string;
}) {
  if (!showBillDetail) return null;

  const { rid: ridFromUrl } = useParams();
  const { rid: ridFromContext } = useTenant();
  const rid = ridFromUrl || ridFromContext || "";

  const order = showBillDetail.order ?? showBillDetail;
  const restaurantId = order?.restaurantId || rid;
  const orderId = order?._id || order?.id || order?.serverId;

  const [bill, setBill] = useState<ApiBill | null>(
    showBillDetail?.bill || null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [waiters, setWaiters] = useState<string[]>([]);
  const [selectedWaiter, setSelectedWaiter] = useState<string>(
    order.staffAlias ?? ""
  );
  const [billModalOpen, setBillModalOpen] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [editingBill, setEditingBill] = useState<ApiBill | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  // New alias edit state
  const [aliasInput, setAliasInput] = useState<string>("");
  const [isAliasSaving, setIsAliasSaving] = useState(false);

  /* ===========================
     Bill Fetch Helpers
  ============================ */
  const calculateDiscountAmount = (
    subtotal: number,
    discountPercent: number
  ) => {
    return (subtotal * discountPercent) / 100;
  };

  const calculateServiceChargeAmount = (
    subtotal: number,
    serviceChargePercent: number
  ) => {
    return (subtotal * serviceChargePercent) / 100;
  };

  const generateBill = async () => {
    const initialSubtotal =
      order.items?.reduce(
        (sum, item) => sum + (item.price || 0) * (item.qty || 1),
        0
      ) || 0;

    const discountAmount = calculateDiscountAmount(
      initialSubtotal,
      order.appliedDiscountPercent || 0
    );

    const serviceChargeAmount = calculateServiceChargeAmount(
      initialSubtotal,
      order.appliedServiceChargePercent || 0
    );

    console.debug(
      "[BillingView] generateBill: sending create request (server computes totals)"
    );

    const res = await fetch(
      `${apiBase}/api/${restaurantId}/orders/${orderId}/bill`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          staffAlias: order.staffAlias || "Waiter",
          extras: [],
          subtotal: initialSubtotal,
          discountPercent: order.appliedDiscountPercent || 0,
          discountAmount: discountAmount,
          serviceChargePercent: order.appliedServiceChargePercent || 0,
          serviceChargeAmount: serviceChargeAmount,
        }),
      }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Bill generation failed");
    }
    return res.json();
  };

  const fetchBill = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;

    if (!orderId) {
      setError("Missing order ID");
      return;
    }

    try {
      if (!silent) setIsRefreshing(true);
      setError(null);

      console.debug(
        "[BillingView] Fetching bill from server (canonical totals expected)"
      );
      const fresh = await getBillByOrderId(orderId, restaurantId);
      console.debug("[BillingView] Server totals:", {
        subtotal: fresh.subtotal,
        taxAmount: fresh.taxAmount,
        serviceChargeAmount: fresh.serviceChargeAmount,
        totalAmount: fresh.totalAmount ?? fresh.total,
      });

      console.log("[BillingView] Fetched bill:", {
        billId: fresh._id,
        orderId: fresh.orderId,
        status: fresh.status,
      });

      if (fresh.status === "draft" && fresh._id) {
        const updates: Record<string, any> = {};
        let needsUpdate = false;

        if (!fresh.tableNumber && order?.tableNumber) {
          updates.tableNumber = String(order.tableNumber);
          needsUpdate = true;
        }

        if (!fresh.staffAlias && order?.staffAlias) {
          updates.staffAlias = order.staffAlias;
          needsUpdate = true;
        }

        if (needsUpdate && fresh._id) {
          try {
            console.log("[BillingView] Syncing bill metadata:", {
              billId: fresh._id,
              updates,
            });

            const res = await fetch(
              `${apiBase}/api/${restaurantId}/bills/${fresh._id}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${staffToken}`,
                },
                body: JSON.stringify({
                  billId: fresh._id,
                  ...updates,
                }),
              }
            );

            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              console.warn("[BillingView] Metadata sync failed:", {
                status: res.status,
                error: errData?.error || res.statusText,
              });
            } else {
              const updated = await res.json();
              console.log("[BillingView] Metadata synced ✅");
              fresh.tableNumber = updated.tableNumber;
              fresh.staffAlias = updated.staffAlias;
            }
          } catch (err) {
            console.error("[BillingView] Metadata sync error:", err);
          }
        }
      }

      setBill(fresh);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("[BillingView] Bill fetch failed:", err);
      setError(err?.message || "Failed to fetch bill details");
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  /* ===========================
     Initial Fetch
  ============================ */
  useEffect(() => {
    let active = true;
    (async () => {
      if (!orderId) return;
      setLoading(true);
      try {
        await fetchBill({ silent: true });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId, restaurantId]);

  /* ===========================
     Auto Refresh
  ============================ */
  useEffect(() => {
    if (!orderId || !restaurantId) return;
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);

    autoRefreshRef.current = setInterval(() => {
      fetchBill({ silent: true }).catch(() => {});
    }, AUTO_REFRESH_MS);

    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [orderId, restaurantId]);

  /* ===========================
     Waiter List Fetch
  ============================ */
  useEffect(() => {
    async function fetchWaiters() {
      try {
        const endpoint = `${apiBase}/api/${restaurantId}/orders/waiters`;
        const res = await fetch(endpoint, {
          method: "GET",
          headers: { Authorization: `Bearer ${staffToken}` },
        });
        if (!res.ok) throw new Error("Failed to fetch waiters");
        const data = await res.json();
        const names = Array.isArray(data?.waiterNames)
          ? data.waiterNames
          : Array.isArray(data)
          ? data
          : [];
        setWaiters(names);
        if (names.length === 1) setSelectedWaiter(names[0]);
      } catch (err: any) {
        console.error("❌ Waiter fetch error:", err);
        setError("Unable to load waiter list");
      }
    }
    if (restaurantId && staffToken) fetchWaiters();
  }, [restaurantId, staffToken, apiBase]);

  /* ===========================
     Alias Updater
  ============================ */
  async function handleAliasUpdate() {
    if (!bill?._id) return;
    const alias = aliasInput.trim() || selectedWaiter.trim();
    if (!alias) {
      setError("Please select or enter a waiter name.");
      return;
    }

    try {
      setIsAliasSaving(true);
      const payload = {
        staffAlias: alias,
        finalizedByAlias: alias,
        paymentMarkedBy: alias,
      };

      const res = await fetch(
        `${apiBase}/api/${restaurantId}/bills/${bill._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${staffToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update alias fields");
      }

      const updatedBill = await res.json();
      setBill(updatedBill);
      setSuccess("✅ Waiter name updated successfully!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error("💥 [AliasUpdate] Failed:", err);
      setError(err?.message || "Failed to update name");
    } finally {
      setIsAliasSaving(false);
    }
  }

  /* ===========================
     Handlers
  ============================ */
  async function handleStatusClick(newStatus: string) {
    try {
      setLoading(true);
      await handleUpdateOrderStatus(orderId, newStatus);
      order.status = newStatus;
      setSuccess(`Order marked as ${newStatus}`);
      setTimeout(() => setSuccess(null), 1500);
      await fetchBill({ silent: true });
    } catch (err: any) {
      setError(err?.message || "Failed to update order status");
    } finally {
      setLoading(false);
    }
  }

  async function handleCloseOrder() {
    try {
      setClosing(true);
      setError(null);
      setSuccess(null);
      if (!orderId) throw new Error("Order ID missing");

      await handleUpdateOrderStatus(orderId, "done");
      setSuccess("✅ Order closed successfully");
      setTimeout(goBack, 1200);
    } catch (err: any) {
      console.error("💥 Close order failed:", err);
      setError(err?.message || "Failed to close order");
    } finally {
      setClosing(false);
    }
  }

  /* ===========================
     Derived Info
  ============================ */
  const sessionId =
    bill?.sessionId ?? order.sessionId ?? order.order?.sessionId ?? "—";
  const tableDisplay =
    bill?.tableNumber ??
    order.tableNumber ??
    order.table?.tableNumber ??
    (order.tableId ? `#${String(order.tableId).slice(-4)}` : "-");
  const paymentStatus = bill?.paymentStatus ?? order?.paymentStatus ?? "unpaid";
  const orderNumberForDay = bill?.orderNumberForDay ?? order.orderNumberForDay;
  const customerName = bill?.customerName ?? order.customerName ?? "Guest";
  const customerContact =
    bill?.customerContact ??
    order?.customerPhone ??
    order?.customerContact ??
    order?.contactNumber ??
    bill?.customerEmail ??
    order?.customerEmail ??
    "—";
  const customerEmail = bill?.customerEmail ?? order?.customerEmail ?? null;
  const appliedDiscountPercent = bill?.appliedDiscountPercent ?? 0;
  const appliedServiceChargePercent = bill?.appliedServiceChargePercent ?? 0;
  const customerNotes = bill?.customerNotes ?? null;
  const staffAlias =
    bill?.staffAlias ?? order?.staffAlias ?? selectedWaiter ?? "—";

  // Calculate bill breakdown
  const billBreakdown = bill
    ? (() => {
        const subtotal = bill.subtotal || 0;
        const discountAmount = bill.discountAmount ?? 0;
        const serviceChargeAmount = bill.serviceChargeAmount ?? 0;

        console.log("[BillingView] Tax details from server:", {
          taxes: bill.taxes,
          taxAmount: bill.taxAmount,
          total: bill.totalAmount ?? bill.total,
        });

        const taxes = Array.isArray(bill.taxes) ? bill.taxes : [];
        const taxesTotal =
          bill.taxAmount ??
          taxes.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const extras = Array.isArray(bill.extras)
          ? bill.extras.filter((e) => (Number(e.amount) || 0) >= 0)
          : [];

        const moreDiscounts = Array.isArray(bill.extras)
          ? bill.extras.filter((e) => (Number(e.amount) || 0) < 0)
          : [];

        const extrasTotal = extras.reduce(
          (s, e) => s + (Number(e.amount) || 0),
          0
        );
        const moreDiscountsTotal = Math.abs(
          moreDiscounts.reduce((s, e) => s + (Number(e.amount) || 0), 0)
        );

        const total =
          subtotal -
          discountAmount +
          serviceChargeAmount +
          taxesTotal +
          extrasTotal -
          moreDiscountsTotal;

        return {
          subtotal,
          discountAmount,
          serviceChargeAmount,
          taxes,
          taxesTotal,
          extras,
          extrasTotal,
          moreDiscounts,
          moreDiscountsTotal,
          total,
        };
      })()
    : null;

  const statusColors = {
    accepted: "bg-blue-100 text-blue-700 border-blue-300",
    preparing: "bg-amber-100 text-amber-700 border-amber-300",
    ready: "bg-purple-100 text-purple-700 border-purple-300",
    served: "bg-emerald-100 text-emerald-700 border-emerald-300",
  };

  const statusIcons = {
    accepted: "👍",
    preparing: "🍳",
    ready: "✨",
    served: "🍽️",
  };

  /* ===========================
     Render
  ============================ */
  return (
    <section className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Back Button */}
      <button
        onClick={goBack}
        className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
      >
        <ChevronRight className="h-4 w-4 transform rotate-180" />
        Back to Orders
      </button>

      <div className="max-w-7xl mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
          {/* Header Section */}
          <div className="bg-white border-b border-slate-200 px-6 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Order Info */}
              <div className="flex-1">
                <h3 className="text-3xl font-semibold mb-4 flex items-center gap-3 text-slate-800">
                  Order & Bill Summary
                  {orderNumberForDay && (
                    <span className="text-lg font-medium bg-slate-100 px-3 py-1 rounded-full border border-slate-200 text-slate-600">
                      #{orderNumberForDay}
                    </span>
                  )}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="text-slate-500 text-xs mb-1">
                      Table Number
                    </div>
                    <div className="text-xl font-bold text-slate-800">
                      {tableDisplay}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="text-slate-500 text-xs mb-1">Customer</div>
                    <div className="text-lg font-semibold text-slate-800">
                      {customerName}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {customerContact}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="text-slate-500 text-xs mb-1">
                      Session ID
                    </div>
                    <div className="text-sm font-mono text-slate-700">
                      {sessionId}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="text-slate-500 text-xs mb-1">
                      Payment Status
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                        paymentStatus === "paid"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-rose-100 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {paymentStatus.toUpperCase()}
                    </div>
                  </div>
                </div>

                {customerNotes && (
                  <div className="mt-4 bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="text-slate-500 text-xs mb-1">
                      Special Instructions
                    </div>
                    <div className="text-sm italic text-slate-700">
                      💬 {customerNotes}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons - Desktop */}
              <div className="hidden lg:flex flex-col gap-3 min-w-[200px]">
                <button
                  onClick={() => fetchBill()}
                  disabled={isRefreshing || loading}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-slate-800 text-white hover:bg-slate-900 cursor-pointer transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  {isRefreshing ? "Refreshing..." : "Refresh Bill"}
                </button>
                <button
                  onClick={() => setBillModalOpen(true)}
                  disabled={!bill || loading}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-slate-800 text-white hover:bg-slate-900 cursor-pointer transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Receipt className="h-5 w-5" />
                  {loading ? "Loading..." : "View Bill"}
                </button>

                {bill && bill.status === "draft" && bill?._id && (
                  <>
                    <button
                      onClick={() => setEditingBill(bill)}
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-md hover:shadow-lg"
                    >
                      <Edit className="h-5 w-5" />
                      Edit Bill
                    </button>

                    <button
                      onClick={async () => {
                        const confirmFinalize = confirm(
                          "Are you sure you want to finalize this bill? Once finalized, it cannot be edited."
                        );
                        if (!confirmFinalize) return;

                        try {
                          const alias =
                            bill.staffAlias ||
                            localStorage.getItem("staffAlias") ||
                            prompt("Enter your staff alias:") ||
                            "staff";
                          localStorage.setItem("staffAlias", alias);

                          const res = await fetch(
                            `${apiBase}/api/${restaurantId}/bills/${bill._id}/finalize`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${staffToken}`,
                              },
                              body: JSON.stringify({ staffAlias: alias }),
                            }
                          );

                          if (!res.ok) {
                            const data = await res.json().catch(() => ({}));
                            throw new Error(
                              data.error || "Failed to finalize bill"
                            );
                          }

                          const updated = await res.json();
                          setBill(updated);
                          setSuccess("✅ Bill finalized successfully!");
                          setTimeout(() => setSuccess(null), 2000);
                        } catch (err: any) {
                          setError(err?.message || "Failed to finalize bill");
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-md hover:shadow-lg"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Finalize Bill
                    </button>
                  </>
                )}

                {bill?.status === "finalized" &&
                  bill.paymentStatus !== "paid" && (
                    <button
                      onClick={() => setIsPaying(true)}
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer shadow-md hover:shadow-lg"
                    >
                      <CreditCard className="h-5 w-5" />
                      Pay Bill
                    </button>
                  )}
              </div>
            </div>
          </div>

          {/* Messages */}
          {(error || success) && (
            <div className="px-6 pt-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  {success}
                </div>
              )}
            </div>
          )}

          {/* Order Status Section */}
          <div className="p-6 sm:p-8 space-y-8">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-700" />
                  Order Status
                </h4>
                <button
                  onClick={() => fetchBill()}
                  disabled={isRefreshing || loading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  {lastUpdated
                    ? lastUpdated.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Refresh"}
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {["accepted", "preparing", "ready", "served"].map((status) => {
                  const isActive = order?.status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusClick(status)}
                      disabled={isActive || isPending(orderId)}
                      className={`relative overflow-hidden px-4 py-3 rounded-xl text-sm font-semibold transition transform cursor-pointer ${
                        isActive
                          ? `${statusColors[status]} border-2 shadow-md scale-105`
                          : "bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg">{statusIcons[status]}</span>
                        <span>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Waiter Assignment */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-slate-700" />
                Waiter Assignment
              </h4>

              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedWaiter}
                  onChange={(e) => setSelectedWaiter(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                >
                  <option value="">Select Waiter</option>
                  {waiters.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Or type custom name"
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                />

                <button
                  onClick={handleAliasUpdate}
                  disabled={isAliasSaving || (!aliasInput && !selectedWaiter)}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition shadow-md hover:shadow-lg cursor-pointer ${
                    isAliasSaving || (!aliasInput && !selectedWaiter)
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-slate-700 text-white hover:bg-slate-800"
                  }`}
                >
                  {isAliasSaving ? "Saving..." : "Update"}
                </button>
              </div>

              <div className="mt-3 text-sm text-slate-600">
                Current waiter:{" "}
                <span className="font-semibold text-slate-800">
                  {staffAlias}
                </span>
              </div>
            </div>

            {/* Bill Items and Breakdown */}
            {bill && billBreakdown ? (
              <>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h4 className="text-lg font-bold text-slate-800">
                      Order Items
                    </h4>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {bill.items?.length ? (
                      bill.items.map((item: any, i: number) => {
                        const price = item.priceAtOrder ?? item.price ?? 0;
                        const qty = item.qty ?? 1;
                        return (
                          <div
                            key={`${item.itemId || i}`}
                            className="px-6 py-4 hover:bg-slate-50 transition"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="font-semibold text-slate-800 text-lg">
                                  {item.name}
                                </div>
                                <div className="text-sm text-slate-500 mt-1">
                                  {qty} × {formatINR(price)}
                                </div>
                                {item.notes && (
                                  <div className="text-xs italic text-slate-600 mt-1 flex items-center gap-1">
                                    <span>💭</span> {item.notes}
                                  </div>
                                )}
                              </div>
                              <div className="text-xl font-bold text-slate-800 whitespace-nowrap">
                                {formatINR(qty * price)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-6 py-8 text-center text-slate-500">
                        No items in bill.
                      </div>
                    )}
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h4 className="text-lg font-bold text-slate-800">
                      Bill Breakdown
                    </h4>
                  </div>

                  <div className="px-6 py-6 space-y-3">
                    <div className="flex justify-between items-center text-base">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-semibold text-slate-800">
                        {formatINR(billBreakdown.subtotal)}
                      </span>
                    </div>

                    {appliedDiscountPercent > 0 && (
                      <div className="flex justify-between text-base text-emerald-700">
                        <span>Discount ({appliedDiscountPercent}%)</span>
                        <span>-{formatINR(billBreakdown.discountAmount)}</span>
                      </div>
                    )}

                    {appliedServiceChargePercent > 0 && (
                      <div className="flex justify-between text-base text-slate-700">
                        <span>
                          Service Charge ({appliedServiceChargePercent}%)
                        </span>
                        <span>
                          {formatINR(billBreakdown.serviceChargeAmount)}
                        </span>
                      </div>
                    )}

                    {billBreakdown.taxes.map((tax: any) => (
                      <div
                        key={tax.name}
                        className="flex justify-between text-base text-slate-700"
                      >
                        <span>
                          {tax.name} ({tax.rate || 0}%)
                        </span>
                        <span>{formatINR(tax.amount || 0)}</span>
                      </div>
                    ))}

                    {billBreakdown.extras.map((extra: any, i: number) => (
                      <div
                        key={`extra-${i}`}
                        className="flex justify-between text-base text-slate-700"
                      >
                        <span>{extra.label ?? extra.name ?? "Extra"}</span>
                        <span>{formatINR(extra.amount)}</span>
                      </div>
                    ))}

                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-slate-800">
                          Grand Total
                        </span>
                        <span className="text-2xl font-bold text-emerald-700">
                          {formatINR(billBreakdown.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">
                {loading ? "Loading bill details..." : "No bill found."}
              </p>
            )}

            {/* Close Order Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={async () => {
                  const confirmClose = confirm(
                    "Are you sure you want to close this order? This action cannot be undone."
                  );
                  if (!confirmClose) return;
                  await handleCloseOrder();
                }}
                disabled={isPending(orderId) || closing}
                className={`px-8 py-3 rounded-xl text-sm font-semibold transition shadow-md hover:shadow-lg cursor-pointer ${
                  closing || isPending(orderId)
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-slate-700 text-white hover:bg-slate-800"
                }`}
              >
                {closing ? "Closing..." : "Close Order"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {billModalOpen && bill && (
        <BillModalComponent
          bill={bill}
          onClose={() => setBillModalOpen(false)}
          formatINR={formatINR}
          staffToken={staffToken}
          handleUpdateOrderStatus={handleUpdateOrderStatus}
        />
      )}
      {editingBill && (
        <EditBillModal
          bill={editingBill}
          onClose={() => setEditingBill(null)}
          formatINR={formatINR}
          onBillUpdated={(updated) => {
            setBill(updated);
            setEditingBill(null);
            fetchBill({ silent: true });
          }}
        />
      )}
      {isPaying && bill && (
        <PaymentModal
          bill={bill}
          onClose={() => setIsPaying(false)}
          formatINR={formatINR}
          staffToken={staffToken}
          onPaid={(updatedBill) => {
            setBill(updatedBill);
            setIsPaying(false);
            fetchBill({ silent: true });
          }}
          handleUpdateOrderStatus={handleUpdateOrderStatus}
        />
      )}
    </section>
  );
}
