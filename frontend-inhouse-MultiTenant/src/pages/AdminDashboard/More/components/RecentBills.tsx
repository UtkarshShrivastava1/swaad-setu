import { useContext, useEffect, useState } from "react";
import { getRecentBills } from "../../../../api/admin/admin.api";
import { CreditCard, Receipt, Clock, CheckCircle } from 'lucide-react';
import { TenantContext } from "../../../../context/TenantContext";
import type { ApiBill } from "../../../../api/staff/bill.api";

interface FormattedBill {
  billId: string;
  orderType: string;
  customer: string;
  itemsSummary: (JSX.Element | null)[] | string;
  totalAmount: string;
  status: string;
}

export default function RecentBills() {
  const [billList, setBillList] = useState<FormattedBill[]>([]);
  const tenantContext = useContext(TenantContext);
  const rid = tenantContext?.rid;

  const fetchRecentBills = async () => {
    if (!rid) return;
    try {
      const data = (await getRecentBills(rid)) as ApiBill[];
      if (Array.isArray(data)) {
        // Map raw data into UI-friendly format
        const formattedBills = data.map((bill) => {
          const itemsSummary = bill.items?.map((item: any, index: number) => {
            let modNames = "";
            if (item.modifiers && item.modifiers.length) {
              modNames = ` (+${item.modifiers.map((m: any) => m.name).join(", ")})`;
            }
            return (
              <div key={index}>
                {item.qty} × {item.name}
                {modNames}
              </div>
            );
          });

          return {
            billId: bill._id,
            orderType: bill.tableId ? `Table ${bill.tableNumber}` : "Takeaway",
            customer: bill.staffAlias || "Customer",
            itemsSummary: itemsSummary || "No items",
            totalAmount: bill.total.toFixed(2),
            status: bill.status || "unknown",
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

  const handleProcessPayment = (billId: string) => {
    alert(`Processing payment for bill ${billId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black text-yellow-400 rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex items-center gap-3 justify-center">
            <Receipt size={32} />
            <h2 className="text-3xl font-bold">Recent Bills</h2>
          </div>
        </div>

        <div className="space-y-4">
          {billList.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-gray-400 mb-3">
                <Receipt size={48} className="mx-auto" />
              </div>
              <p className="text-gray-500 text-lg">No recent bills found</p>
            </div>
          ) : (
            billList.map((bill) => (
              <div
                key={bill.billId}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-yellow-400"
              >
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Receipt size={20} className="text-black" />
                      <span className="font-bold text-black text-lg">{bill.billId}</span>
                    </div>
                    <span className="bg-black text-yellow-400 px-4 py-1 rounded-full text-sm font-semibold">
                      {bill.orderType}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-yellow-100 p-2 rounded-lg">
                      <CreditCard size={24} className="text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 font-medium">Customer</div>
                      <div className="text-xl font-bold text-black">{bill.customer}</div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="text-sm text-gray-600 mb-1 font-medium">Items</div>
                    <div className="text-gray-800">{bill.itemsSummary}</div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t-2 border-yellow-200">
                    <div>
                      <div className="text-sm text-gray-500 font-medium mb-1">Total Amount</div>
                      <div className="text-3xl font-bold text-black">₹{bill.totalAmount}</div>
                    </div>
                    <div>
                      {bill.status.toLowerCase() === "paid" ? (
                        <div className="flex items-center gap-2 bg-black text-yellow-400 px-4 py-2 rounded-lg">
                          <CheckCircle size={20} />
                          <span className="font-bold">Paid</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-lg">
                          <Clock size={20} />
                          <span className="font-bold">Pending</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {bill.status.toLowerCase() !== "paid" && (
                    <button
                      onClick={() => handleProcessPayment(bill.billId)}
                      className="w-full bg-black hover:bg-gray-900 text-yellow-400 font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <CreditCard size={20} />
                      Process Payment
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}