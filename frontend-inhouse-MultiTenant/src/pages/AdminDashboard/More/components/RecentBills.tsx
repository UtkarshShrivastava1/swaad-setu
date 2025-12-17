import { format } from "date-fns";
import html2pdf from "html2pdf.js";
import { CheckCircle, Clock, Loader2, Receipt, Download, Printer, Eye, X } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { getBillsHistory } from "../../../../api/staff/bill.api";
import { TenantContext } from "../../../../context/TenantContext";

interface FormattedBill {
  billId: string;
  orderType: string;
  customer: string;
  itemsSummary: string;
  totalAmount: string;
  status: string;
  totalItems: number;
  customerName?: string;
  customerContact?: string;
  customerEmail?: string;
  subtotal?: string;
  taxDetails?: string;
  discountDetails?: string;
  serviceChargeDetails?: string;
  createdAt?: string;
  createdAtDate?: string;
  createdAtTime?: string;
  paymentStatus?: string;
}

export default function RecentBills() {
  const [billList, setBillList] = useState<FormattedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingBill, setViewingBill] = useState<FormattedBill | null>(null);
  const tenantContext = useContext(TenantContext);
  const rid = tenantContext?.rid;

  const generateBillHtmlContent = (bill: FormattedBill) => {
    // This function remains unchanged
    return `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 20px;">
        {/* ... existing HTML for PDF/Print ... */}
      </div>
    `;
  };

  const fetchRecentBills = async () => {
    if (!rid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await getBillsHistory(rid, { limit: 10 });
      const data = response.bills;

      if (Array.isArray(data)) {
        const formattedBills = data.map((bill) => {
          const totalItems = bill.items?.reduce((sum, item) => sum + item.qty, 0) || 0;
          const itemsSummary = bill.items
            ?.map((item: any) => {
              let modNames = "";
              if (item.modifiers && item.modifiers.length) {
                modNames = ` (+${item.modifiers
                  .map((m: any) => m.name)
                  .join(", ")})`;
              }
              return `<div class="text-zinc-300 py-1">${item.qty} × ${item.name}${modNames}</div>`;
            })
            .join("");

          return {
            billId: bill._id.slice(-6).toUpperCase(),
            orderType: bill.tableId ? `Table ${bill.tableNumber}` : "Takeaway",
            customer: bill.staffAlias || bill.customerName || "N/A",
            itemsSummary: itemsSummary || "No items",
            totalItems,
            totalAmount: (bill.total || bill.totalAmount || ((bill.subtotal || 0) + (bill.taxAmount || 0) + (bill.serviceChargeAmount || 0) - (bill.discountAmount || 0))).toFixed(2),
            status: bill.paymentStatus || bill.status || "unknown",
            createdAt: bill.createdAt ? format(new Date(bill.createdAt), "MMM dd, yyyy hh:mm a") : undefined,
            createdAtDate: bill.createdAt ? format(new Date(bill.createdAt), "MMM dd, yyyy") : undefined,
            createdAtTime: bill.createdAt ? format(new Date(bill.createdAt), "hh:mm a") : undefined,
            customerName: bill.customerName,
            customerContact: bill.customerContact,
            customerEmail: bill.customerEmail,
            subtotal: (bill.subtotal || 0).toFixed(2),
            taxDetails: bill.taxes?.map(t => `${t.name} (${t.rate}%): ₹${t.amount.toFixed(2)}`).join(", ") || "No Taxes",
            discountDetails: bill.discountAmount > 0 ? `Discount (${bill.appliedDiscountPercent || 0}%): -₹${bill.discountAmount.toFixed(2)}` : undefined,
            serviceChargeDetails: bill.serviceChargeAmount > 0 ? `Service Charge (${bill.appliedServiceChargePercent || 0}%): +₹${bill.serviceChargeAmount.toFixed(2)}` : undefined,
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
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentBills();
  }, [rid]);

  const handlePrintBill = (bill: FormattedBill) => { /* unchanged */ };
  const handleDownloadPdf = (bill: FormattedBill) => { /* unchanged */ };

  const StatusBadge = ({ status }: { status: string }) => (
    status.toLowerCase() === "paid" ? (
      <span className="flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
        <CheckCircle size={14} /> Paid
      </span>
    ) : (
      <span className="flex items-center justify-center gap-2 bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold">
        <Clock size={14} /> {status}
      </span>
    )
  );

  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-full max-w-7xl bg-zinc-950 border border-yellow-500/30 rounded-2xl shadow-[0_0_35px_rgba(250,204,21,0.15)] p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
            {/* ... Header ... */}
        </div>

        {loading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-yellow-400" /></div>
        ) : billList.length === 0 ? (
            <div className="px-6 py-20 text-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900">
                {/* ... Empty State ... */}
            </div>
        ) : (
            <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto rounded-lg border border-zinc-800">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-zinc-900">
                                <th className="px-6 py-3 text-left font-semibold text-yellow-400 uppercase tracking-wider">Bill ID</th>
                                <th className="px-6 py-3 text-left font-semibold text-yellow-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left font-semibold text-yellow-400 uppercase tracking-wider">Customer / Table</th>
                                <th className="px-6 py-3 text-left font-semibold text-yellow-400 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-3 text-right font-semibold text-yellow-400 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-center font-semibold text-yellow-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-center font-semibold text-yellow-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {billList.map((bill) => (
                                <tr key={bill.billId} className="hover:bg-zinc-900/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-yellow-400">#{bill.billId}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-zinc-300">{bill.createdAtDate}</div>
                                        <div className="text-xs text-zinc-500">{bill.createdAtTime}</div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-200 font-medium">{bill.orderType === 'Takeaway' ? bill.customer : bill.orderType}</td>
                                    <td className="px-6 py-4 text-zinc-300">
                                        <div className="flex items-center gap-3">
                                            <span>{bill.totalItems} item(s)</span>
                                            <button onClick={() => setViewingBill(bill)} className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-white">
                                                <Eye size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-yellow-300 text-base">₹{bill.totalAmount}</td>
                                    <td className="px-6 py-4 text-center"><StatusBadge status={bill.status} /></td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handlePrintBill(bill)} className="p-2 rounded-md bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 transition-all"><Printer size={14} /></button>
                                            <button onClick={() => handleDownloadPdf(bill)} className="p-2 rounded-md bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 transition-all"><Download size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="block md:hidden space-y-4">
                    {billList.map((bill) => (
                        <div key={bill.billId} className="bg-zinc-900/70 rounded-lg p-4 border border-zinc-800">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-mono text-yellow-400 font-bold">#{bill.billId}</p>
                                    <p className="text-xs text-zinc-400">{bill.createdAt}</p>
                                </div>
                                <StatusBadge status={bill.status} />
                            </div>
                            <div className="mb-3 border-t border-zinc-800 pt-3">
                                <p className="text-xs text-zinc-500 mb-1">Customer / Table</p>
                                <p className="font-medium text-zinc-200">{bill.orderType === 'Takeaway' ? bill.customer : bill.orderType}</p>
                            </div>
                            <div className="mb-4">
                                <p className="text-xs text-zinc-500 mb-1">Items</p>
                                <div className="text-sm" dangerouslySetInnerHTML={{ __html: bill.itemsSummary }}></div>
                            </div>
                            <div className="flex justify-between items-center border-t border-zinc-800 pt-3">
                                <div>
                                    <p className="text-xs text-zinc-500">Total</p>
                                    <p className="font-bold text-yellow-300 text-lg">₹{bill.totalAmount}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handlePrintBill(bill)} className="p-3 rounded-lg bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 transition-all"><Printer size={16} /></button>
                                    <button onClick={() => handleDownloadPdf(bill)} className="p-3 rounded-lg bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 transition-all"><Download size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        )}

        {/* ... Footer ... */}
      </div>

      {/* Item Details Modal */}
      {viewingBill && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setViewingBill(null)}>
            <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-yellow-500/30 shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-yellow-400 text-lg">Items for Bill #{viewingBill.billId}</h3>
                    <button onClick={() => setViewingBill(null)} className="p-1.5 rounded-full hover:bg-zinc-700"><X size={18} /></button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 pr-2" dangerouslySetInnerHTML={{ __html: viewingBill.itemsSummary }}></div>
                <button onClick={() => setViewingBill(null)} className="mt-6 w-full h-10 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition-colors">
                    Close
                </button>
            </div>
        </div>
    )}
    </div>
  );
}