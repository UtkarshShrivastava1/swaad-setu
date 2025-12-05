import { Calendar, Phone, Printer, Table, User, X } from "lucide-react";
import type { ApiBill } from "../../../api/staff/bill.api";
import { getTaxTotal } from "../../../utils/tax.utils";

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

  const {
    _id,
    orderNumberForDay,
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

  const computedDiscountAmount =
    discountAmount || (subtotal * appliedDiscountPercent) / 100;
  const computedServiceChargeAmount =
    serviceChargeAmount || (subtotal * appliedServiceChargePercent) / 100;
  const computedTaxTotal = getTaxTotal(bill);
  const computedExtrasTotal = extras.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  const computedTotal =
    subtotal -
    computedDiscountAmount +
    computedServiceChargeAmount +
    computedTaxTotal +
    computedExtrasTotal;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td>${item.name}</td>
        <td class="text-center">${item.qty}</td>
        <td class="text-right">${formatINR(item.price)}</td>
        <td class="text-right">${formatINR(item.qty * item.price)}</td>
      </tr>
    `
      )
      .join("");

    const totalsHtml = `
      <div class="totals-grid">
        <span>Subtotal</span><span class="text-right">${formatINR(
          subtotal
        )}</span>
        ${
          computedDiscountAmount > 0
            ? `<span>Discount (${appliedDiscountPercent}%)</span><span class="text-right text-green">- ${formatINR(
                computedDiscountAmount
              )}</span>`
            : ""
        }
        ${
          computedServiceChargeAmount > 0
            ? `<span>Service Charge (${appliedServiceChargePercent}%)</span><span class="text-right">+ ${formatINR(
                computedServiceChargeAmount
              )}</span>`
            : ""
        }
        ${taxes
          .map(
            (t) =>
              `<span>${t.name} (${
                t.rate
              }%)</span><span class="text-right">+ ${formatINR(
                t.amount
              )}</span>`
          )
          .join("")}
        ${
          computedExtrasTotal > 0
            ? `<span>Extras</span><span class="text-right">+ ${formatINR(
                computedExtrasTotal
              )}</span>`
            : ""
        }
        <span class="grand-total">Grand Total</span><span class="grand-total text-right">${formatINR(
          computedTotal
        )}</span>
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Bill #${orderNumberForDay}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 20px; }
            h1 { margin: 0; font-size: 24px; }
            p { margin: 2px 0; }
            .info-grid, .totals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 8px; border-bottom: 1px solid #eee; text-align: left; }
            th { background-color: #f9f9f9; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-green { color: #28a745; }
            .grand-total { font-weight: bold; font-size: 1.1em; border-top: 2px solid #333; padding-top: 8px; margin-top: 8px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Restaurant Name</h1>
            <p>123 Food Street, Flavor Town</p>
          </div>
          <div class="info-grid">
            <span>Bill #: <strong>${orderNumberForDay || "N/A"}</strong></span>
            <span>Table: <strong>${tableNumber || "N/A"}</strong></span>
            <span>Date: <strong>${
              createdAt ? new Date(createdAt).toLocaleString() : "N/A"
            }</strong></span>
            <span>Waiter: <strong>${staffAlias || "N/A"}</strong></span>
          </div>
          <table>
            <thead><tr><th>Item</th><th class="text-center">Qty</th><th class="text-right">Price</th><th class="text-right">Total</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          ${totalsHtml}
           <div class="footer">
            <p>Thank you for your visit!</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-lg w-full max-w-md max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Bill Details</h2>
              <p className="text-sm text-gray-500">
                Order #{orderNumberForDay || "N/A"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2 rounded-lg text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                <Printer className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Customer & Table Info */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-gray-50 p-4 rounded-xl my-5 border">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{customerName || "Guest"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Table className="h-4 w-4 text-gray-400" />
              <span className="font-medium">Table {tableNumber || "N/A"}</span>
            </div>
            {customerContact && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{customerContact}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="font-medium">
                {createdAt ? new Date(createdAt).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Items</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium text-gray-500 py-2">
                    Item
                  </th>
                  <th className="text-center font-medium text-gray-500 py-2">
                    Qty
                  </th>
                  <th className="text-right font-medium text-gray-500 py-2">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2">{item.name}</td>
                    <td className="text-center py-2">{item.qty}</td>
                    <td className="text-right py-2">
                      {formatINR(item.price * item.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t-2 border-dashed">
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {computedDiscountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedDiscountPercent}%)</span>
                  <span>- {formatINR(computedDiscountAmount)}</span>
                </div>
              )}
              {computedServiceChargeAmount > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge ({appliedServiceChargePercent}%)</span>
                  <span>+ {formatINR(computedServiceChargeAmount)}</span>
                </div>
              )}
              {taxes.map((t, i) => (
                <div key={i} className="flex justify-between">
                  <span>
                    {t.name} ({t.rate}%)
                  </span>
                  <span>+ {formatINR(t.amount)}</span>
                </div>
              ))}
              {extras.length > 0 && (
                <div className="flex justify-between">
                  <span>Extras</span>
                  <span>+ {formatINR(computedExtrasTotal)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <span className="text-base font-bold text-gray-800">
                Grand Total
              </span>
              <span className="text-xl font-bold text-gray-900">
                {formatINR(computedTotal)}
              </span>
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              Payment Status:
              <span
                className={`font-bold ${
                  paymentStatus === "paid"
                    ? "text-green-600"
                    : "text-orange-500"
                }`}
              >
                {` ${
                  paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)
                }`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
