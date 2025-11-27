// src/components/staff/BillModalComponent.tsx
import {
  Calendar,
  Phone,
  Printer,
  Receipt,
  Table,
  User,
  X,
} from "lucide-react";
import {
  filterServiceTax,
  getGSTRate,
  getTaxTotal,
} from "../../../utils/tax.utils";
import type { ApiBill } from "../../../api/staff/bill.api";

/* ===========================================
   Bill Modal Component
   Shows detailed breakdown of a finalized or
   draft bill including items, taxes, extras,
   discounts, and computed totals.
   =========================================== */
interface BillModalProps {
  bill: ApiBill | null;
  onClose: () => void;
  formatINR: (n?: number | null) => string;
  staffToken?: string;
}

export default function BillModalComponent({
  bill,
  onClose,
  formatINR,
}: BillModalProps) {
  if (!bill) return null;

  // -----------------------------
  // Destructure bill fields safely
  // -----------------------------
  const {
    _id,
    orderNumberForDay,
    tableId,
    tableNumber,
    customerName,
    customerContact,
    createdAt,
    staffAlias,
    paymentStatus = "unpaid",
    subtotal = 0,
    appliedDiscountPercent = 0,
    discountAmount = 0,
    appliedServiceChargePercent = 0,
    serviceChargeAmount = 0,
    taxes = [],
    extras = [],
    items = [],
  } = bill;

  /* ---------------------------------------------
     💰 Safe computed fallbacks for missing values
  --------------------------------------------- */

  const computedDiscountAmount =
    discountAmount && discountAmount > 0
      ? discountAmount
      : (subtotal * (appliedDiscountPercent || 0)) / 100;

  const computedServiceChargeAmount =
    serviceChargeAmount && serviceChargeAmount > 0
      ? serviceChargeAmount
      : (subtotal * (appliedServiceChargePercent || 0)) / 100;

  // Use server tax total
  const computedTaxTotal = getTaxTotal(bill);

  const computedExtrasTotal = Array.isArray(extras)
    ? extras.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    : 0;

  // ✅ Canonical grand total recomputation
  const computedTotal = Number(
    (
      subtotal -
      computedDiscountAmount +
      computedServiceChargeAmount +
      computedTaxTotal +
      computedExtrasTotal
    ).toFixed(2)
  );

  /* ---------------------------------------------
     🖨️ Print Bill (with computed totals)
  --------------------------------------------- */
  const handlePrint = () => {
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;

    const itemsRows =
      items && items.length > 0
        ? items
            .map((i) => {
              const qty = (i as any).qty ?? 1;
              const price = (i as any).price ?? 0;
              const line = qty * price;
              return `
          <tr>
            <td>${i.name}</td>
            <td class="right">${qty}</td>
            <td class="right">${formatINR(price)}</td>
            <td class="right">${formatINR(line)}</td>
          </tr>`;
            })
            .join("")
        : `<tr><td colspan="4" style="text-align:center;">No items</td></tr>`;

    const extrasRows =
      extras && extras.length > 0
        ? extras
            .map(
              (e: any) =>
                `<tr><td>${
                  e.label || e.name || "Extra"
                }</td><td class="right">${formatINR(e.amount ?? 0)}</td></tr>`
            )
            .join("")
        : `<tr><td colspan="2">No extras</td></tr>`;

    const taxesRows =
      taxes && taxes.length > 0
        ? taxes
            .map(
              (t: any) =>
                `<tr><td>${t.name} (${
                  t.rate ?? 0
                }%)</td><td class="right">${formatINR(t.amount ?? 0)}</td></tr>`
            )
            .join("")
        : `<tr><td colspan="2">No taxes</td></tr>`;

    win.document.write(`
      <html>
        <head>
          <title>Bill #${_id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color:#111; line-height:1.5; }
            h1, h2 { text-align: center; margin: 0 0 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 13px; }
            th { background: #f7f7f7; }
            .right { text-align: right; }
            .bold { font-weight: 600; }
            .sep { border-top: 1px solid #ccc; margin-top: 12px; padding-top: 8px; }
            .footer { text-align:center; font-size:12px; color:#555; margin-top:20px; }
          </style>
        </head>
        <body>
          <h1>Restaurant Bill</h1>
          <h2>Order #${orderNumberForDay || "-"} | Table ${
      tableNumber || tableId || "-"
    }</h2>

          <p><strong>Customer:</strong> ${customerName || "Guest"} (${
      customerContact || "-"
    })</p>
          <p><strong>Waiter:</strong> ${staffAlias || "—"}</p>

          <h3>Items</h3>
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
            <tbody>${itemsRows}</tbody>
          </table>

          <h3>Extras</h3>
          <table><thead><tr><th>Label</th><th>Amount</th></tr></thead><tbody>${extrasRows}</tbody></table>

          <h3>Taxes</h3>
          <table><thead><tr><th>Tax</th><th>Amount</th></tr></thead><tbody>${taxesRows}</tbody></table>

          <div class="sep">
            <table>
              <tr><td>Subtotal</td><td class="right">${formatINR(
                subtotal
              )}</td></tr>
              ${
                appliedDiscountPercent > 0
                  ? `<tr><td>Discount (${appliedDiscountPercent}%)</td><td class="right">-${formatINR(
                      computedDiscountAmount
                    )}</td></tr>`
                  : ""
              }
              ${
                appliedServiceChargePercent > 0
                  ? `<tr><td>Service Charge (${appliedServiceChargePercent}%)</td><td class="right">${formatINR(
                      computedServiceChargeAmount
                    )}</td></tr>`
                  : ""
              }
              ${
                computedTaxTotal > 0
                  ? `<tr><td>Tax Total</td><td class="right">${formatINR(
                      computedTaxTotal
                    )}</td></tr>`
                  : ""
              }
              ${
                computedExtrasTotal !== 0
                  ? `<tr><td>Extras</td><td class="right">${formatINR(
                      computedExtrasTotal
                    )}</td></tr>`
                  : ""
              }
              <tr class="bold"><td>Grand Total</td><td class="right">${formatINR(
                computedTotal
              )}</td></tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for dining with us!</p>
            <p>${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);

    win.document.close();
    win.print();
  };

  /* ---------------------------------------------
     🧾 Main UI Rendering
  --------------------------------------------- */
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        // Close if clicked on backdrop only
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-5 relative overflow-y-auto max-h-[90vh] border border-slate-200 animate-fadeIn">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-indigo-600" /> Bill Summary
        </h2>

        {/* Bill Info Section */}
        <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm text-slate-700 border border-slate-200 space-y-1">
          <div className="flex justify-between">
            <span>
              <Table className="inline-block w-4 h-4 mr-1" /> Table:
            </span>
            <span>{tableNumber || tableId || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Order No:</span>
            <span>{orderNumberForDay ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span>
              <User className="inline-block w-4 h-4 mr-1" /> Customer:
            </span>
            <span>{customerName || "Guest"}</span>
          </div>
          {customerContact && (
            <div className="flex justify-between">
              <span>
                <Phone className="inline-block w-4 h-4 mr-1" /> Contact:
              </span>
              <span>{customerContact}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>
              <Calendar className="inline-block w-4 h-4 mr-1" /> Date:
            </span>
            <span>
              {createdAt ? new Date(createdAt).toLocaleString() : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Waiter:</span>
            <span>{staffAlias || "—"}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Payment:</span>
            <span
              className={`font-medium capitalize ${
                paymentStatus === "paid" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {paymentStatus}
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="border-t pt-3 space-y-2">
          <h3 className="font-semibold text-slate-700 mb-1">Items</h3>
          {items.length > 0 ? (
            items.map((item, i) => {
              const qty = (item as any).qty ?? 1;
              const price = (item as any).price ?? 0;
              const line = qty * price;
              return (
                <div
                  key={i}
                  className="flex justify-between text-sm border-b border-slate-100 pb-1"
                >
                  <span>
                    {item.name} × {qty}
                  </span>
                  <span>{formatINR(line)}</span>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-slate-500">No items</div>
          )}
        </div>

        {/* Totals Section */}
        <div className="border-t mt-4 pt-2 space-y-1 text-sm text-slate-700">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>

          {appliedDiscountPercent > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount ({appliedDiscountPercent}%)</span>
              <span>-{formatINR(computedDiscountAmount)}</span>
            </div>
          )}

          {appliedServiceChargePercent > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>Service Charge ({appliedServiceChargePercent}%)</span>
              <span>{formatINR(computedServiceChargeAmount)}</span>
            </div>
          )}

          {/* Display taxes using server data */}
          {Array.isArray(taxes) && taxes.length > 0 ? (
            taxes.map((t, i) => (
              <div key={i} className="flex justify-between">
                <span>
                  {t.name} ({t.rate}%)
                </span>
                <span>{formatINR(t.amount)}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between">
              <span>Tax Total</span>
              <span>{formatINR(computedTaxTotal)}</span>
            </div>
          )}

          {Array.isArray(extras) && extras.length > 0 && (
            <div className="flex justify-between">
              <span>Extras</span>
              <span>{formatINR(computedExtrasTotal)}</span>
            </div>
          )}

          <div className="flex justify-between font-semibold text-emerald-600 text-base border-t pt-2">
            <span>Grand Total</span>
            <span>{formatINR(computedTotal)}</span>
          </div>
        </div>

        {/* Print Button */}
        <div className="mt-5">
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition"
          >
            <Printer className="h-4 w-4" /> Print Bill
          </button>
        </div>
      </div>

      {/* Fade animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}