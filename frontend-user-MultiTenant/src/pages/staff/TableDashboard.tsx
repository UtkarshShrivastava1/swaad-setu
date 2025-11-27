import { useState, useEffect } from "react";
import {
  Bell,
  Users,
  Clock,
  XCircle,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import BillingComponent from "../../components/staffBilling/BillingComponent";
import { fetchTable } from "../../api/table.api";
import { fetchBill } from "../../api/bill.api";

type TableStatus = "occupied" | "available";
type BillStatus = "pending" | "preparing" | "served" | "completed";

interface Bill {
  id: string;
  items: string[];
  amount: number;
  status: BillStatus;
  time: string;
}

interface Table {
  id: number;
  status: TableStatus;
  capacity: number;
  waiterAssigned?: string;
  bills: Bill[];
  waiterCalled: boolean;
}

import { useTenant } from "../../context/TenantContext";

export default function TableDashboard() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showBillDetail, setShowBillDetail] = useState<Bill | null>(null);
  const [view, setView] = useState<"dashboard" | "billing">("dashboard");
  const [billData, setBillData] = useState<Bill[]>([]);
  const { rid } = useTenant();

  const [tables, setTables] = useState<Table[]>([]);

  // ✅ Fetch tables on component load
  useEffect(() => {
    fetchTables();
  }, []);

const fetchTables = async () => {
  const tableData = await fetchTable(rid); // Tables from API
  const billData = await fetchBill(rid);   // Bills from API

  const formatted = tableData.map((t: any) => ({
    id: t.tableNumber,
    status: t.currentSessionId ? "occupied" : "available",
    capacity: t.capacity,
    waiterAssigned: t.staffAlias,
    bills: billData
      .filter((b: any) => b.tableId === String(t.tableNumber)) // 👈 Match
      .map((b: any) => ({
        id: b._id,
        items: b.items.map((i: any) => i.name),
        amount: b.totalAmount,
        status: b.status === "draft" ? "pending" : "served", // Adjust if needed
        time: new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })),
    waiterCalled: false,
  }));

  setTables(formatted);
};


  console.log(billData);

  const handleRejectBill = (billId: string) => {
    if (selectedTable) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTable.id
            ? { ...t, bills: t.bills.filter((b) => b.id !== billId) }
            : t
        )
      );

      setShowBillDetail(null);
    }
  };

  const getStatusColor = (status: BillStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "preparing":
        return "bg-blue-100 text-blue-700";
      case "served":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-gray-100 text-gray-700";
    }
  };

  if (view === "billing" && showBillDetail && selectedTable) {
    return (
      <BillingComponent
        bill={showBillDetail}
        tableId={selectedTable.id}
        onBack={() => setView("dashboard")}
      />
    );
  }

  const handleCallWaiter = (tableId: number) => {
    setTables(tables.map(t => 
      t.id === tableId ? { ...t, waiterCalled: true } : t
    ));
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Active Tables</h1>
            <p className="text-emerald-100 text-sm">
              {tables.filter(t => t.status === 'occupied').length} occupied • {tables.filter(t => t.status === 'available').length} available
            </p>
          </div>
          <button className="bg-white text-emerald-600 p-3 rounded-full shadow-lg">
            <Bell size={24} />
          </button>
        </div>
      </div>

      {/* Tables List */}
      <div className="p-4 space-y-3">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`bg-white rounded-xl shadow-md overflow-hidden ${
              table.status === 'occupied' ? 'border-2 border-emerald-500' : 'border-2 border-gray-200'
            }`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${
                    table.status === 'occupied' ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    <Users className={table.status === 'occupied' ? 'text-emerald-600' : 'text-gray-400'} size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Table {table.id}</h3>
                    <p className="text-sm text-gray-500">Capacity: {table.capacity} people</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  table.status === 'occupied' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {table.status === 'occupied' ? 'Occupied' : 'Available'}
                </span>
              </div>

              {table.status === 'occupied' && (
                <>
                  <div className="flex items-center justify-between mb-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Assigned Waiter</p>
                      <p className="font-semibold text-gray-800">{table.waiterAssigned}</p>
                    </div>
                    <button
                      onClick={() => handleCallWaiter(table.id)}
                      disabled={table.waiterCalled}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 ${
                        table.waiterCalled
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600'
                      }`}
                    >
                      <Bell size={16} />
                      {table.waiterCalled ? 'Called' : 'Call'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700">Running Bills</p>
                      <span className="text-xs text-gray-500">{table.bills.length} order(s)</span>
                    </div>
                    
                    {table.bills.map((bill) => (
                      <div
                        key={bill.id}
                        onClick={() => {
                          setSelectedTable(table);
                          setShowBillDetail(bill);
                        }}
                        className="bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-800">{bill.id}</p>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                                {bill.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={12} />
                              {bill.time}
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <p className="font-bold text-emerald-600">₹{bill.amount}</p>
                            <ChevronRight size={20} className="text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bill Detail Popup */}
      {showBillDetail && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Bill Details</h2>
              <button
                onClick={() => setShowBillDetail(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={28} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-600">Bill ID</p>
                  <p className="font-bold text-gray-800">{showBillDetail.id}</p>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-600">Table</p>
                  <p className="font-bold text-gray-800">Table {selectedTable.id}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-bold text-gray-800">{showBillDetail.time}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Status</p>
                <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(showBillDetail.status)}`}>
                  {showBillDetail.status.toUpperCase()}
                </span>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Waiter Assigned</p>
                <p className="text-gray-800 font-medium">{selectedTable.waiterAssigned}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Items Ordered</p>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {showBillDetail.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-500" />
                      <p className="text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold text-gray-800">Total Amount</p>
                  <p className="text-2xl font-bold text-emerald-600">₹{showBillDetail.amount}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleRejectBill(showBillDetail.id)}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-all"
                >
                  Reject Bill
                </button>
                <button
                  onClick={() => {setView("billing");
                    // Add navigation logic here
                  }}
                  className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all"
                >
                  Process Bill
                </button>
              </div>
            </div>
          </div>
        </div>
        
      )}  
    </div>
  );
}