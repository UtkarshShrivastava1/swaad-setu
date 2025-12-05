import { format } from "date-fns"; // Import format from date-fns
import html2pdf from "html2pdf.js"; // Import html2pdf.js
import { CheckCircle, Clock, CreditCard, Receipt } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { getBillsHistory } from "../../../../api/staff/bill.api"; // Changed import
import { TenantContext } from "../../../../context/TenantContext";

interface FormattedBill {
  billId: string;
  orderType: string;
  customer: string;
  itemsSummary: string;
  totalAmount: string;
  status: string;
  // New fields
  customerName?: string;
  customerContact?: string;
  customerEmail?: string;
  subtotal?: string;
  taxDetails?: string;
  discountDetails?: string;
  serviceChargeDetails?: string;
  createdAt?: string;
  paymentStatus?: string;
}

export default function RecentBills() {
  const [billList, setBillList] = useState<FormattedBill[]>([]);
  const tenantContext = useContext(TenantContext);
  const rid = tenantContext?.rid;

  // Helper function to generate HTML content for a single bill
  const generateBillHtmlContent = (bill: FormattedBill) => {
    return `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0;">
          <h3 style="margin: 0; font-size: 18px; color: #333;">Bill #${
            bill.billId
          }</h3>
          <span style="background-color: #333; color: #fff; padding: 5px 10px; border-radius: 5px; font-size: 12px;">${
            bill.orderType
          }</span>
        </div>
        <div style="padding-top: 15px;">
          ${
            bill.customerName
              ? `<p style="margin: 0; font-size: 14px; color: #777;">Customer Name: <strong style="color: #333;">${bill.customerName}</strong></p>`
              : ""
          }
          ${
            bill.customerContact
              ? `<p style="margin: 0; font-size: 14px; color: #777;">Contact: <strong style="color: #333;">${bill.customerContact}</strong></p>`
              : ""
          }
          ${
            bill.customerEmail
              ? `<p style="margin: 0; font-size: 14px; color: #777;">Email: <strong style="color: #333;">${bill.customerEmail}</strong></p>`
              : ""
          }
          <p style="margin: 0; font-size: 14px; color: #777;">Served By: <strong style="color: #333;">${
            bill.customer
          }</strong></p>
          <div style="margin-top: 15px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
            <p style="margin: 0; font-size: 14px; color: #777; text-transform: uppercase; font-weight: bold;">Items:</p>
            <div style="margin-top: 5px; font-size: 14px; color: #333;">
              ${bill.itemsSummary}
            </div>
          </div>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e0e0e0;">
            <p style="margin: 0; font-size: 14px; display: flex; justify-content: space-between;"><span>Subtotal:</span> <strong style="color: #333;">₹${
              bill.subtotal
            }</strong></p>
            ${
              bill.discountDetails
                ? `<p style="margin: 5px 0; font-size: 14px; display: flex; justify-content: space-between;"><span>${
                    bill.discountDetails.split(":")[0]
                  }:</span> <strong style="color: #e74c3c;">${
                    bill.discountDetails.split(":")[1]
                  }</strong></p>`
                : ""
            }
            ${
              bill.serviceChargeDetails
                ? `<p style="margin: 5px 0; font-size: 14px; display: flex; justify-content: space-between;"><span>${
                    bill.serviceChargeDetails.split(":")[0]
                  }:</span> <strong style="color: #27ae60;">${
                    bill.serviceChargeDetails.split(":")[1]
                  }</strong></p>`
                : ""
            }
            ${
              bill.taxDetails !== "No Taxes"
                ? `<p style="margin: 5px 0; font-size: 14px; display: flex; justify-content: space-between;"><span>Taxes (${
                    bill.taxDetails.split("(")[1].split(")")[0]
                  }):</span> <strong style="color: #333;">₹${(
                    parseFloat(bill.totalAmount) -
                    parseFloat(bill.subtotal) +
                    (bill.discountDetails
                      ? parseFloat(bill.discountDetails.split("₹")[1])
                      : 0) -
                    (bill.serviceChargeDetails
                      ? parseFloat(bill.serviceChargeDetails.split("₹")[1])
                      : 0)
                  ).toFixed(2)}</strong></p>`
                : ""
            }
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; margin-top: 15px; border-top: 1px solid #333;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #777; text-transform: uppercase; font-weight: bold;">Total</p>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #333;">₹${
                bill.totalAmount
              }</p>
              ${
                bill.createdAt
                  ? `<p style="margin: 5px 0 0; font-size: 12px; color: #777;">Date: ${bill.createdAt}</p>`
                  : ""
              }
            </div>
            <span style="background-color: ${
              bill.status.toLowerCase() === "paid"
                ? "#d4edda"
                : bill.status.toLowerCase() === "unpaid"
                ? "#f8d7da"
                : "#fff3cd"
            }; color: ${
      bill.status.toLowerCase() === "paid"
        ? "#155724"
        : bill.status.toLowerCase() === "unpaid"
        ? "#721c24"
        : "#856404"
    }; padding: 8px 12px; border-radius: 5px; font-size: 14px; font-weight: bold;">
              ${
                bill.paymentStatus
                  ? bill.paymentStatus.toUpperCase()
                  : bill.status.toUpperCase()
              }
            </span>
          </div>
        </div>
      </div>
    `;
  };

  const fetchRecentBills = async () => {
    if (!rid) return;
    try {
      // Calling getBillsHistory instead of getRecentBills
      // Using a limit of 10 to fetch the most recent bills
      const response = await getBillsHistory(rid, {
        limit: 10,
      });
      const data = response.bills; // Accessing the bills array from the response

      if (Array.isArray(data)) {
        // Map raw data into UI-friendly format
        const formattedBills = data.map((bill) => {
          const itemsSummary = bill.items
            ?.map((item: any) => {
              let modNames = "";
              if (item.modifiers && item.modifiers.length) {
                modNames = ` (+${item.modifiers
                  .map((m: any) => m.name)
                  .join(", ")})`;
              }
              return `<div>${item.qty} × ${item.name}${modNames}</div>`;
            })
            .join(""); // Join into a single HTML string

          return {
            billId: bill._id,
            orderType: bill.tableId ? `Table ${bill.tableNumber}` : "Takeaway",
            customer: bill.staffAlias || bill.customerName || "Customer", // Prioritize customerName
            itemsSummary: itemsSummary || "No items",
            totalAmount: (bill.total !== undefined && bill.total !== null
              ? bill.total
              : (bill.subtotal || 0) +
                (bill.taxAmount || 0) +
                (bill.serviceChargeAmount || 0) -
                (bill.discountAmount || 0)
            ).toFixed(2),
            status: bill.status || "unknown",
            customerName: bill.customerName,
            customerContact: bill.customerContact,
            customerEmail: bill.customerEmail,
            subtotal: (bill.subtotal || 0).toFixed(2),
            taxDetails:
              bill.taxes && bill.taxes.length > 0
                ? bill.taxes
                    .map(
                      (tax) =>
                        `${tax.name} (${tax.rate}%): ₹${tax.amount.toFixed(2)}`
                    )
                    .join(", ")
                : "No Taxes",
            discountDetails:
              bill.discountAmount && bill.discountAmount > 0
                ? `Discount (${
                    bill.appliedDiscountPercent || 0
                  }%): -₹${bill.discountAmount.toFixed(2)}`
                : undefined,
            serviceChargeDetails:
              bill.serviceChargeAmount && bill.serviceChargeAmount > 0
                ? `Service Charge (${
                    bill.appliedServiceChargePercent || 0
                  }%): +₹${bill.serviceChargeAmount.toFixed(2)}`
                : undefined,
            createdAt: bill.createdAt
              ? format(new Date(bill.createdAt), "MMM dd, yyyy hh:mm a")
              : undefined,
            paymentStatus: bill.paymentStatus || "unknown",
          };
        });
        setBillList(formattedBills);
      } else {
        setBillList([]);
      }
    } catch (error) {
      console.error("Error fetching recent bills:", error);
      setBillList([]);
    }
  };

  useEffect(() => {
    fetchRecentBills();
  }, [rid]);

  // ... (existing code)

  const handlePrintBill = (bill: FormattedBill) => {
    const content = generateBillHtmlContent(bill);
    const printWindow = window.open("", "", "height=600,width=800");
    if (printWindow) {
      printWindow.document.write("<html><head><title>Bill</title>");
      printWindow.document.write("</head><body>");
      printWindow.document.write(content);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleDownloadPdf = (bill: FormattedBill) => {
    const content = generateBillHtmlContent(bill);
    html2pdf().from(content).save(`bill-${bill.billId}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ================= HEADER ================= */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
              <Receipt size={26} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                Recent Bills
              </h2>
              <p className="text-sm text-gray-500">
                Last 10 recent transactions
              </p>
            </div>
          </div>
        </div>

        {/* ================= EMPTY STATE ================= */}
        {billList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-3">
              <Receipt size={48} className="mx-auto" />
            </div>
            <p className="text-gray-600 text-lg font-medium">
              No recent bills found
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Paid bills will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {billList.map((bill) => (
              <div
                key={bill.billId}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* ===== BILL TOP BAR ===== */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Receipt size={18} className="text-gray-700" />
                    <span className="font-semibold text-gray-900">
                      #{bill.billId}
                    </span>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-900 text-white">
                    {bill.orderType}
                  </span>
                </div>

                {/* ===== BILL BODY ===== */}
                <div className="p-5 space-y-4">
                  {/* Customer */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <CreditCard size={22} className="text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 font-semibold uppercase">
                          Customer
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {bill.customerName || bill.customer}
                        </div>
                      </div>
                    </div>
                    {bill.customerContact && (
                      <p className="text-sm text-gray-600">
                        Contact: {bill.customerContact}
                      </p>
                    )}
                    {bill.customerEmail && (
                      <p className="text-sm text-gray-600">
                        Email: {bill.customerEmail}
                      </p>
                    )}
                  </div>

                  {/* Items */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1 font-semibold uppercase">
                      Items
                    </div>
                    <div
                      className="text-gray-800 text-sm space-y-1"
                      dangerouslySetInnerHTML={{ __html: bill.itemsSummary }}
                    ></div>
                  </div>

                  {/* Charges Summary */}
                  <div className="space-y-1 border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Subtotal:</span>
                      <span>₹{bill.subtotal}</span>
                    </div>
                    {bill.discountDetails && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>{bill.discountDetails.split(":")[0]}:</span>
                        <span>{bill.discountDetails.split(":")[1]}</span>
                      </div>
                    )}
                    {bill.serviceChargeDetails && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>{bill.serviceChargeDetails.split(":")[0]}:</span>
                        <span>{bill.serviceChargeDetails.split(":")[1]}</span>
                      </div>
                    )}
                    {bill.taxDetails && bill.taxDetails !== "No Taxes" && (
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>
                          GST ({bill.taxDetails.split("(")[1].split(")")[0]}):
                        </span>
                        <span>
                          ₹
                          {(
                            parseFloat(bill.totalAmount) -
                            parseFloat(bill.subtotal) +
                            (bill.discountDetails
                              ? parseFloat(bill.discountDetails.split("₹")[1])
                              : 0) -
                            (bill.serviceChargeDetails
                              ? parseFloat(
                                  bill.serviceChargeDetails.split("₹")[1]
                                )
                              : 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-xs text-gray-500 font-semibold uppercase mb-1">
                        Total
                      </div>
                      <div className="text-2xl font-extrabold text-gray-900">
                        ₹{bill.totalAmount}
                      </div>
                      {bill.createdAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Date: {bill.createdAt}
                        </p>
                      )}
                    </div>

                    <div>
                      {bill.paymentStatus?.toLowerCase() === "paid" ? (
                        <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold">
                          <CheckCircle size={18} />
                          Paid
                        </div>
                      ) : bill.paymentStatus?.toLowerCase() === "unpaid" ? (
                        <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-bold">
                          <Clock size={18} />
                          Unpaid
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-lg text-sm font-bold">
                          <Clock size={18} />
                          {bill.status}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handlePrintBill(bill)}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl transition active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
                    >
                      <Receipt size={18} />
                      Print Bill
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(bill)}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
                    >
                      <Receipt size={18} />
                      Download PDF
                    </button>
                  </div>

                  {/* Action Button (only if not paid) */}
                  {bill.status.toLowerCase() !== "paid" && (
                    <button
                      onClick={() => handleProcessPayment(bill.billId)}
                      className="w-full mt-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
                    >
                      <CreditCard size={18} />
                      Process Payment
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
