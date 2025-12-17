// src/components/staff/EditBillModal.tsx
import {
  CheckCircle,
  Minus,
  Plus,
  Save,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { SingleValue } from "react-select";
import Select from "react-select";

import type { ApiBill, BillExtra, BillItem } from "../../../api/staff/bill.api";
import {
  fetchFullMenu,
  finalizeBill,
  updateBillDraft,
} from "../../../api/staff/bill.api";
import { useTenant } from "../../../context/TenantContext";

/* ---------------------------------------------
   Types for react-select options + menu shape
--------------------------------------------- */
type MenuItem = {
  _id?: string;
  itemId?: string; // some menus return itemId, some _id
  name: string;
  price?: number;
};

type MenuResponse =
  | { menu?: MenuItem[] } // preferred shape
  | MenuItem[]; // fallback: API might return array directly

type MenuOption = { value: string; label: string; price: number };

// Local state type for editable extras/discounts where amount is a string
type EditableExtra = { label: string; amount: string };

interface EditBillModalProps {
  bill: ApiBill;
  onClose: () => void;
  onBillUpdated?: (bill: ApiBill) => void;
  formatINR: (n?: number | null) => string;
}

export default function EditBillModal({
  bill,
  onClose,
  onBillUpdated,
  formatINR,
}: EditBillModalProps) {
  // 🔹 Multi-tenant aware rid
  const { rid: ridFromUrl } = useParams();
  const { rid: ridFromContext } = useTenant();
  const rid = ridFromUrl || ridFromContext || "";

  /* ---------------------------------------------
     ⚙️ Local State
  --------------------------------------------- */
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);

  const [items, setItems] = useState<BillItem[]>(
    Array.isArray(bill.items) ? bill.items : []
  );
  const [selectedOption, setSelectedOption] = useState<MenuOption | null>(null);

  const [extras, setExtras] = useState<EditableExtra[]>(
    Array.isArray(bill.extras)
      ? bill.extras
          .filter((e) => (e.amount ?? 0) >= 0) // Separate extras from discounts
          .map((e: any) => ({
            label: e.label ?? e.name ?? "",
            amount: String(Number(e.amount ?? 0)),
          }))
      : []
  );

  const [moreDiscounts, setMoreDiscounts] = useState<EditableExtra[]>(
    (
      Array.isArray(bill.extras)
        ? bill.extras
            .filter((e) => (e.amount ?? 0) < 0)
            .map((d: any) => ({
              label: d.label ?? d.name ?? "More Discount",
              amount: String(Math.abs(Number(d.amount ?? 0))),
            }))
        : []
    ).concat(
      Array.isArray((bill as any).additionalDiscounts)
        ? (bill as any).additionalDiscounts.map((d: any) => ({
            label: d.label ?? d.name ?? "More Discount",
            amount: String(Math.abs(Number(d.amount ?? 0))),
          }))
        : []
    )
  );

  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  /* ---------------------------------------------
     🧾 Derived totals (client-side preview)
  --------------------------------------------- */
  const subtotal = useMemo(
    () =>
      items.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.qty || 0), 0),
    [items]
  );

  // Discount derived from the canonical bill only (no local editing)
  const appliedDiscountPercent = bill.appliedDiscountPercent || 0;

  const computedDiscountAmount = useMemo(
    () => (subtotal * appliedDiscountPercent) / 100,
    [subtotal, appliedDiscountPercent]
  );

  // Service Charge (restaurant fee) — compute on post-discount base (matches backend)
  const appliedServiceChargePercent = useMemo(
    () => bill.appliedServiceChargePercent || 0,
    [bill.appliedServiceChargePercent]
  );

  // base after discount (used for service charge & taxes)
  const baseAfterDiscount = useMemo(
    () => Math.max(0, subtotal - computedDiscountAmount),
    [subtotal, computedDiscountAmount]
  );

  const computedServiceChargeAmount = useMemo(
    () => (baseAfterDiscount * appliedServiceChargePercent) / 100,
    [baseAfterDiscount, appliedServiceChargePercent]
  );

  // Use server tax values directly - no recalculation
  // 🔄 Dynamic GST recalculation for live preview (client-side only)
  const gstRate = (() => {
    const gstTax = Array.isArray(bill.taxes)
      ? bill.taxes.find((t) => String(t.name).toLowerCase().includes("gst"))
      : null;
    return Number(gstTax?.rate ?? 18); // fallback to 18% if config missing
  })();

  const totalTaxAmount = useMemo(() => {
    // GST should apply to (after discount + service charge)
    const gstBase =
      subtotal - computedDiscountAmount + computedServiceChargeAmount;
    const computedGST = (gstBase * gstRate) / 100;
    return computedGST;
  }, [subtotal, computedDiscountAmount, computedServiceChargeAmount, gstRate]);

  const extrasTotal = useMemo(
    () => extras.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [extras]
  );

  const moreDiscountsTotal = useMemo(
    () => moreDiscounts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
    [moreDiscounts]
  );

  // Show a realistic preview; server will re-compute canonical numbers
  const previewTotal = useMemo(
    () =>
      subtotal -
      computedDiscountAmount +
      computedServiceChargeAmount +
      totalTaxAmount +
      extrasTotal,
    [
      subtotal,
      computedDiscountAmount,
      computedServiceChargeAmount,
      totalTaxAmount,
      extrasTotal,
    ]
  );

  // adjust preview to subtract "more discounts" (fixed amounts)
  const previewTotalWithMoreDiscounts = useMemo(
    () => previewTotal - moreDiscountsTotal,
    [previewTotal, moreDiscountsTotal]
  );

  /* ---------------------------------------------
     🍽️ Load Menu (with robust logs)
  --------------------------------------------- */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setMenuLoading(true);
        setMenuError(null);
        console.log("[EditBillModal] ▶ fetching menu via fetchFullMenu()");
        const res: MenuResponse = await fetchFullMenu(rid);

        const rawList = Array.isArray(res) ? res : res?.menu ?? [];
        const cleaned = rawList
          .filter((m) => m && m.name)
          .map((m) => ({
            _id: m._id,
            itemId: m.itemId,
            name: m.name,
            price: Number(m.price ?? 0),
          }));

        if (!active) return;
        setMenu(cleaned);
        console.log("[EditBillModal] ✅ menu fetched", {
          count: cleaned.length,
          sample: cleaned.slice(0, 5),
        });
      } catch (err: any) {
        console.error("[EditBillModal] ❌ menu fetch failed:", err);
        if (active) setMenuError(err?.message || "Failed to load menu");
      } finally {
        if (active) setMenuLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [rid]);

  /* ---------------------------------------------
     🔍 Build react-select options
  --------------------------------------------- */
  const menuOptions: MenuOption[] = useMemo(
    () =>
      menu.map((m) => ({
        value: String(m._id || m.itemId || m.name),
        label: `${m.name} — ₹${Number(m.price ?? 0)}`,
        price: Number(m.price ?? 0),
      })),
    [menu]
  );

  /* ---------------------------------------------
     🧩 Item Operations
  --------------------------------------------- */
  const handleIncrement = (index: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], qty: (updated[index].qty || 0) + 1 };
    setItems(updated);
  };

  const handleDecrement = (index: number) => {
    const updated = [...items];
    const nextQty = Math.max(1, (updated[index].qty || 1) - 1);
    updated[index] = { ...updated[index], qty: nextQty };
    setItems(updated);
  };

  const handleRemove = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const handleAddFromMenu = () => {
    if (!selectedOption) return;
    const { value, label, price } = selectedOption;

    // Parse label back to name (before " — ₹")
    const name = label.split(" — ₹")[0] ?? label;

    const newItem: BillItem = {
      // @ts-expect-error The API BillItem type in your codebase may not include these extra fields;
      // we include them for completeness — server will accept canonical subset.
      itemId: value,
      name,
      qty: 1,
      price: price,
      // @ts-expect-error ditto
      priceAtOrder: price,
      // @ts-expect-error ditto
      modifiers: [],
      notes: "",
    };

    const next = [...items, newItem];
    setItems(next);

    console.log("[EditBillModal] ➕ addFromMenu", {
      selectedOption,
      appendedItem: newItem,
      nextItemsCount: next.length,
    });

    setSelectedOption(null);
  };

  /* ---------------------------------------------
     ➕ Extras Management
  --------------------------------------------- */
  const handleAddExtra = () => {
    setExtras((prev) => [...prev, { label: "Extra", amount: "" }]);
  };

  const handleRemoveExtra = (index: number) => {
    setExtras((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExtraChange = (
    index: number,
    field: keyof EditableExtra,
    value: string
  ) => {
    if (field === "amount" && value !== "" && !/^\d*\.?\d*$/.test(value)) {
      return; // prevent non-numeric, non-decimal input
    }
    setExtras((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  /* ---------------------------------------------
     ➖ More Discounts Management (fixed-amount deductions)
  --------------------------------------------- */
  const handleAddMoreDiscount = () => {
    setMoreDiscounts((prev) => [
      ...prev,
      { label: "More Discount", amount: "" },
    ]);
  };

  const handleRemoveMoreDiscount = (index: number) => {
    setMoreDiscounts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoreDiscountChange = (
    index: number,
    field: keyof EditableExtra,
    value: string
  ) => {
    if (field === "amount" && value !== "" && !/^\d*\.?\d*$/.test(value)) {
      return; // prevent non-numeric, non-decimal input
    }
    setMoreDiscounts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  /* ---------------------------------------------
     💾 Save Draft (patch backend) with debug logs
  --------------------------------------------- */
  const handleSave = async () => {
    try {
      setSaving(true);

      // Combine extras (positive) and discounts (negative) into single array
      const extrasPayload = [
        ...extras.map((e) => ({
          label: String(e.label || "Extra"),
          amount: Number(e.amount) || 0,
        })),
        ...moreDiscounts.map((d) => ({
          label: String(d.label || "More Discount"),
          // Store discount as negative amount so backend treats it as deduction
          amount: -Math.abs(Number(d.amount) || 0),
        })),
      ];

      // NOTE: Frontend only sends a draft/patch. The backend is authoritative for taxes/service charge/total.
      console.debug(
        "[EditBillModal] INFO: sending draft patch — server will recompute canonical totals"
      );

      // Build patch with extras only. Do NOT send items (server owns canonical items).
      const patch: any = {
        // include updated items from modal
        items: items.map((i) => {
          // Canonical itemId resolution (never empty)
          const itemId =
            [i.itemId, i.menuItemId, i._id, i.name].find(
              (x) => typeof x === "string" && x.trim().length > 0
            ) || "unknown";

          return {
            itemId: String(itemId).trim(),
            name: i.name || "Unnamed Item",
            qty: Number(i.qty ?? i.quantity ?? 1),
            price: Number(i.price ?? i.priceAtOrder ?? 0),
            priceAtOrder: Number(i.priceAtOrder ?? i.price ?? 0),
            modifiers: Array.isArray(i.modifiers) ? i.modifiers : [],
            notes: i.notes || "",
          };
        }),

        extras: extrasPayload,
      };

      // include version/session/table/staff when present (helps backend validation & recalculation)
      const maybeVersion = (bill as any).version ?? (bill as any).__v;
      if (maybeVersion !== undefined) patch.version = maybeVersion;
      if (bill.staffAlias) patch.staffAlias = bill.staffAlias;
      patch.version = bill.__v;

      console.log("[EditBillModal] 💾 saving draft", {
        billId: bill._id,
        patch,
      });

      // updateBillDraft now returns canonical bill (server-calculated) when possible
      const canonical = await updateBillDraft(rid, bill._id, patch);
      console.log("[EditBillModal] ✅ draft saved (canonical)", canonical);

      // Notify parent with canonical server bill
      onBillUpdated?.(canonical);
      onClose();
    } catch (err: any) {
      console.error("[EditBillModal] ❌ save draft failed:", err);
      alert("Failed to save bill draft");
    } finally {
      setSaving(false);
    }
  };
  /* ---------------------------------------------
     ✅ Finalize Bill (server computes final totals)
  --------------------------------------------- */
  const handleFinalize = async () => {
    try {
      setFinalizing(true);

      // 🧠 Get staff alias
      let alias =
        bill.staffAlias ||
        localStorage.getItem("staffAlias") ||
        window.prompt("Enter your staff alias to finalize:") ||
        "staff";

      localStorage.setItem("staffAlias", alias);

      console.log("[EditBillModal] 🚀 Finalizing bill", {
        billId: bill._id,
        staffAlias: alias,
      });

      // 🧾 Finalize bill on backend
      const updated = await finalizeBill(rid, bill._id, { staffAlias: alias });
      console.log("[EditBillModal] ✅ Bill finalized", updated);

      // ✅ Force-safe bill state to prevent premature order completion
      const safeBill = {
        ...updated,
        paymentStatus: updated.paymentStatus || "unpaid", // keep unpaid
        status: "finalized", // ensure not "done" yet
      };

      // Notify parent (BillingView) to refresh its bill view
      onBillUpdated?.(safeBill);

      // Close modal after short delay for smoother UX
      setTimeout(onClose, 300);
    } catch (err: any) {
      console.error("[EditBillModal] ❌ Finalize failed:", err);
      alert(err?.message || "Failed to finalize bill");
    } finally {
      setFinalizing(false);
    }
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "transparent",
      borderColor: state.isFocused ? "#f59e0b" : "#4b5563",
      color: "white",
      "&:hover": {
        borderColor: "#f59e0b",
      },
      boxShadow: "none",
    }),
    singleValue: (base) => ({
      ...base,
      color: "white",
    }),
    input: (base) => ({
      ...base,
      color: "white",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#1f2937",
      border: "1px solid #4b5563",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#374151" : "transparent",
      color: "white",
      "&:hover": {
        backgroundColor: "#4b5563",
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: "#9ca3af",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "#9ca3af",
      "&:hover": {
        color: "white",
      },
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: "#9ca3af",
    }),
    loadingMessage: (base) => ({
      ...base,
      color: "#9ca3af",
    }),
  };

  /* ---------------------------------------------
     🧾 Render
  --------------------------------------------- */
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-gray-900 border border-gray-700 text-white rounded-2xl shadow-xl w-full max-w-lg p-5 sm:p-6 relative animate-fadeIn overflow-y-auto max-h-[90vh] transition-all">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <ShoppingCart className="text-amber-400 w-6 h-6" />
          <h2 className="text-xl font-semibold text-white">
            Edit Bill — {bill._id}
          </h2>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-5">
          {items.map((item, i) => (
            <div
              key={`${item.name}-${i}`}
              className="flex items-center justify-between border border-gray-700 rounded-lg px-3 py-2 bg-gray-800 hover:bg-gray-700 transition"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-white">
                  {item.name}
                </div>
                <div className="text-xs text-gray-400">
                  ₹{item.price} × {item.qty}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDecrement(i)}
                  className="p-1 rounded bg-gray-600 hover:bg-gray-500 text-white"
                  aria-label="Decrement"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-white">{item.qty}</span>
                <button
                  onClick={() => handleIncrement(i)}
                  className="p-1 rounded bg-gray-600 hover:bg-gray-500 text-white"
                  aria-label="Increment"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemove(i)}
                  className="ml-2 text-red-500 hover:text-red-400 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-sm text-gray-400 border border-gray-700 rounded-lg p-3">
              No items yet. Use the menu below to add.
            </div>
          )}
        </div>

        {/* Add from Menu (React Select) */}
        <div className="mb-5">
          <div className="text-sm font-medium mb-2 text-gray-300">
            Add item from menu
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1">
              <Select<MenuOption, false>
                styles={selectStyles}
                options={menuOptions}
                isLoading={menuLoading}
                value={selectedOption}
                onChange={(opt: SingleValue<MenuOption>) => {
                  console.log("[EditBillModal] 🔎 select change", opt);
                  setSelectedOption(opt ?? null);
                }}
                placeholder={
                  menuError ? `Failed to load: ${menuError}` : "Search menu…"
                }
                noOptionsMessage={() =>
                  menuLoading ? "Loading..." : "No matches"
                }
                classNamePrefix="rs"
              />
            </div>
            <button
              onClick={handleAddFromMenu}
              disabled={!selectedOption}
              className="px-4 py-2 bg-amber-400 text-black rounded-lg text-sm font-medium disabled:opacity-60 hover:bg-amber-500 transition"
            >
              Add
            </button>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Tip: type to search “Butter Chicken”, “Naan”, etc.
          </div>
        </div>

        {/* Extras */}
        <div className="border-t border-gray-700 pt-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-300">Extras</h3>
            <button
              onClick={handleAddExtra}
              className="px-2 py-1 bg-gray-700 text-sm rounded hover:bg-gray-600 text-white"
            >
              + Add
            </button>
          </div>

          {extras.length > 0 ? (
            extras.map((extra, i) => (
              <div
                key={`extra-${i}`}
                className="flex items-center justify-between mb-2 text-sm"
              >
                <input
                  type="text"
                  value={extra.label ?? ""}
                  placeholder="Label (e.g., Service)"
                  onChange={(e) =>
                    handleExtraChange(i, "label", e.target.value)
                  }
                  className="border border-gray-600 bg-gray-800 rounded p-1 flex-1 mr-2 text-white placeholder-gray-500"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={extra.amount}
                  placeholder="0"
                  onChange={(e) => handleExtraChange(i, "amount", e.target.value)}
                  className="w-24 border border-gray-600 bg-gray-800 rounded p-1 text-right mr-2 text-white"
                />
                <button
                  onClick={() => handleRemoveExtra(i)}
                  className="text-red-500 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-400">No extras</div>
          )}
        </div>

        {/* More Discounts (fixed-amount deductions) */}
        <div className="border-t border-gray-700 pt-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-300">More Discounts</h3>
            <button
              onClick={handleAddMoreDiscount}
              className="px-2 py-1 bg-gray-700 text-sm rounded hover:bg-gray-600 text-white"
            >
              + Add
            </button>
          </div>

          {moreDiscounts.length > 0 ? (
            moreDiscounts.map((d, i) => (
              <div
                key={`md-${i}`}
                className="flex items-center justify-between mb-2 text-sm"
              >
                <input
                  type="text"
                  value={d.label ?? ""}
                  placeholder="Label (e.g., Promo)"
                  onChange={(e) =>
                    handleMoreDiscountChange(i, "label", e.target.value)
                  }
                  className="border border-gray-600 bg-gray-800 rounded p-1 flex-1 mr-2 text-white placeholder-gray-500"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={d.amount}
                  placeholder="0"
                  onChange={(e) =>
                    handleMoreDiscountChange(i, "amount", e.target.value)
                  }
                  className="w-24 border border-gray-600 bg-gray-800 rounded p-1 text-right mr-2 text-white"
                />
                <button
                  onClick={() => handleRemoveMoreDiscount(i)}
                  className="text-red-500 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-400">
              No additional discounts
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-700 pt-3 text-sm space-y-1 text-gray-300">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-white">{formatINR(subtotal)}</span>
          </div>

          {appliedDiscountPercent > 0 && (
            <div className="flex justify-between text-green-500">
              <span>Discount ({appliedDiscountPercent}%)</span>
              <span>-{formatINR(computedDiscountAmount)}</span>
            </div>
          )}

          {appliedServiceChargePercent > 0 && (
            <div className="flex justify-between">
              <span>Service Charge ({appliedServiceChargePercent}%)</span>
              <span className="text-white">
                {formatINR(computedServiceChargeAmount)}
              </span>
            </div>
          )}

          {/* Display taxes using exact server values */}
          {Array.isArray(bill.taxes) &&
            bill.taxes.length > 0 && (
              <>
                {bill.taxes.map((tax, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {tax.name} ({tax.rate}%)
                    </span>
                    <span className="text-white">{formatINR(tax.amount)}</span>
                  </div>
                ))}
              </>
            )}

          {extrasTotal > 0 && (
            <div className="flex justify-between">
              <span className="font-semibold text-gray-300">Extras</span>
              <span className="text-white">{formatINR(extrasTotal)}</span>
            </div>
          )}

          {/* More Discounts shown as negative amounts */}
          {moreDiscounts.length > 0 &&
            moreDiscounts.map((d, i) => (
              <div key={`md-total-${i}`} className="flex justify-between">
                <span className="text-green-500">
                  {d.label ?? "More Discount"}
                </span>
                <span className="text-green-500">
                  -{formatINR(Number(d.amount) || 0)}
                </span>
              </div>
            ))}

          <div className="flex justify-between font-semibold text-white text-base border-t border-gray-700 pt-2">
            <span>Grand Total</span>
            <span className="text-amber-400">
              {formatINR(previewTotalWithMoreDiscounts)}
            </span>
          </div>

          {bill.staffAlias && (
            <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <User className="w-3 h-3" /> Staff:{" "}
              <span className="font-medium">{bill.staffAlias}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg py-2 hover:bg-indigo-700 text-sm font-medium transition disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            onClick={handleFinalize}
            disabled={finalizing}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-lg py-2 hover:bg-emerald-700 text-sm font-medium transition disabled:opacity-60"
          >
            <CheckCircle className="w-4 h-4" />{" "}
            {finalizing ? "Finalizing…" : "Finalize"}
          </button>
        </div>
      </div>
    </div>
  );
}
