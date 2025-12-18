import { useCallback, useEffect, useState } from "react";
import {
  FiInbox,
  FiMail,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi";
import { MdTableRestaurant } from "react-icons/md";
import { getBillHistory, type Bill } from "../../../../api/admin/bill.api";
import {
  getOrder,
  type Order,
  type OrderItem,
} from "../../../../api/admin/order.api";
import { getTables, resetTable, type ApiTable } from "../../../../api/admin/table.api";
import { useTenant } from "../../../../context/TenantContext";

const mapBillToOrder = (bill: Bill): Order => {
  const getDateString = (
    date: { $date: string } | string | undefined | null
  ): string | null => {
    if (!date) return null;
    if (typeof date === "string") return date;
    if (date.$date) return date.$date;
    return null;
  };

  const createdAt =
    getDateString(bill.createdAt) ||
    getDateString(bill.finalizedAt) ||
    new Date().toISOString();
  const updatedAt =
    getDateString(bill.updatedAt) || getDateString(bill.finalizedAt) || createdAt;

  return {
    _id: { $oid: bill._id?.$oid || crypto.randomUUID() },
    restaurantId: bill.restaurantId,
    tableId: bill.tableId,
    sessionId: bill.sessionId,
    items: bill.items.map((item) => ({
      menuItemId: { $oid: item.itemId || crypto.randomUUID() },
      name: item.name,
      quantity: item.qty,
      price: item.price,
      priceAtOrder: item.priceAtOrder,
      notes: item.notes,
      status: "served",
      _id: { $oid: item.itemId || crypto.randomUUID() },
      createdAt: { $date: createdAt },
      updatedAt: { $date: updatedAt },
    })),
    totalAmount: bill.totalAmount,
    status: "done",
    paymentStatus: bill.paymentStatus === "unpaid" ? "unpaid" : "paid",
    isCustomerOrder: bill.isCustomerOrder,
    customerName: bill.customerName,
    customerContact: bill.customerContact,
    customerEmail: bill.customerEmail,
    staffAlias: bill.staffAlias,
    overrideToken: bill.overrideToken,
    version: 0,
    createdAt: { $date: createdAt },
    updatedAt: { $date: updatedAt },
    __v: bill.__v,
    discountAmount: bill.discountAmount,
    serviceChargeAmount: bill.serviceChargeAmount,
    orderNumberForDay: bill.orderNumberForDay,
    appliedTaxes: bill.taxes.map((tax) => ({
      _id: tax._id.$oid,
      name: tax.name,
      percent: tax.rate,
      amount: tax.amount,
    })),
  };
};

const STATUS_CLASSES: Record<string, string> = {
  placed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  preparing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  ready: "bg-green-500/10 text-green-400 border-green-500/20",
  done: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const FILTERS = [
  { label: "Current", key: "all" },
  { label: "Placed", key: "placed" },
  { label: "Preparing", key: "preparing" },
  { label: "Ready", key: "ready" },
  { label: "Paid", key: "done" },
];

export default function OrdersManagement() {
  const { rid } = useTenant();
  const [activeFilter, setActiveFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!rid) return;
    setLoading(true);
    try {
      let fetchedOrders: Order[] = [];
      if (activeFilter === "done") {
        const billHistoryResult = await getBillHistory(rid);
        fetchedOrders = billHistoryResult.map(mapBillToOrder);
      } else {
        const filterToApply = activeFilter === "all" ? "all" : activeFilter;
        const orderResult = await getOrder(rid, filterToApply);
        fetchedOrders = (orderResult || []).map((order: any) => {
          const getDateString = (
            date: { $date: string } | string | undefined | null
          ): string | null => {
            if (!date) return null;
            if (typeof date === "string") return date;
            if (date.$date) return date.$date;
            return null;
          };
          const createdAt =
            getDateString(order.createdAt) || new Date().toISOString();
          const updatedAt = getDateString(order.updatedAt) || createdAt;

          return {
            ...order,
            orderNumberForDay:
              order.orderNumberForDay ?? order.OrderNumberForDay ?? null,
            customerContact:
              order.customerContact ?? order.customer_contact ?? null,
            _id: { $oid: order._id?.$oid || crypto.randomUUID() },
            createdAt: {
              $date: createdAt,
            },
            updatedAt: {
              $date: updatedAt,
            },
          };
        });
      }
      const tableResult = await getTables(rid);
      setOrders(fetchedOrders);
      const tableMap = new Map(
        tableResult.map((table: ApiTable) => [table._id, table.tableNumber])
      );
      setTables(tableMap);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [rid, activeFilter]);

  const handleResetTable = useCallback(
    async (tableId: string) => {
      if (!rid) return;
      if (window.confirm("Are you sure you want to reset this table? This will cancel all active orders and clear the session.")) {
        try {
          await resetTable(rid, tableId);
          fetchData(); // Refresh data after successful reset
          alert("Table reset successfully!");
        } catch (error) {
          console.error("Error resetting table:", error);
          alert("Failed to reset table. Please try again.");
        }
      }
    },
    [rid, fetchData]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "all")
      return order.status !== "done" && order.status !== "completed";
    return order.status === activeFilter;
  });

  const capitalize = (word: string) =>
    word ? word.charAt(0).toUpperCase() + word.slice(1) : "";
  const openCustomerPortal = () => {
    window.open(
      import.meta.env.VITE_USER_LINK || "http://localhost:5173/",
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-yellow-400">
            Orders Dashboard
          </h1>
          <p className="text-sm text-zinc-400">
            Track, filter, and manage all running orders in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
          >
            <FiRefreshCw
              className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={openCustomerPortal}
            className="flex items-center gap-2 bg-yellow-400 text-black py-2 px-4 rounded-lg font-semibold text-sm hover:bg-yellow-500 active:scale-[0.97] transition-all"
          >
            <FiPlus /> New Order
          </button>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {FILTERS.map((filt) => (
            <button
              key={filt.key}
              onClick={() => setActiveFilter(filt.key)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeFilter === filt.key
                  ? "bg-yellow-400 text-black"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {filt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <div className="h-8 w-8 rounded-full border-2 border-dashed border-zinc-400 animate-spin mb-3" />
            <p className="text-sm font-medium">Fetching latest orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-zinc-500">
            <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-3">
              <FiInbox className="h-6 w-6 text-zinc-600" />
            </div>
            <p className="text-sm font-semibold mb-1">
              No orders in "{capitalize(activeFilter)}".
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order._id.$oid}
                className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"
              >
                <div className="bg-zinc-800/50 px-4 py-3 border-b border-zinc-800">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-black text-xs font-mono">
                        #{" "}
                        {order.orderNumberForDay ??
                          order._id?.$oid?.slice(-6) ??
                          "N/A"}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {new Date(order.createdAt.$date).toLocaleString([], {
                          hour12: true,
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`px-3 py-1 rounded-full font-semibold text-xs flex items-center gap-1.5 ${
                          STATUS_CLASSES[order.status] ??
                          "bg-zinc-700 text-zinc-300"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {capitalize(order.status)}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full font-semibold text-xs flex items-center gap-1.5 ${
                          order.paymentStatus === "paid"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-zinc-400 items-center">
                    <span className="flex items-center gap-1.5">
                      <FiUser /> Customer:{" "}
                      <strong className="text-zinc-200">
                        {order.customerName || "Walk-in"}
                      </strong>
                    </span>
                    {order.customerContact && (
                      <span className="flex items-center gap-1.5">
                        <FiPhone />{" "}
                        <strong className="text-zinc-200">
                          {order.customerContact}
                        </strong>
                      </span>
                    )}
                    {order.customerEmail && (
                      <span className="flex items-center gap-1.5">
                        <FiMail />{" "}
                        <strong className="text-zinc-200">
                          {order.customerEmail}
                        </strong>
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <MdTableRestaurant /> Table:{" "}
                      <strong className="text-zinc-200">
                        {tables.get(order.tableId) ?? "N/A"}
                      </strong>
                      {order.tableId &&
                        order.status !== "done" &&
                        order.status !== "completed" && (
                          <button
                            onClick={() => handleResetTable(order.tableId)}
                            className="ml-2 px-2 py-1 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 transition-colors"
                            title="Reset Table"
                          >
                            Reset Table
                          </button>
                        )}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-zinc-400">
                      <tr className="border-b border-zinc-800">
                        <th className="p-2 text-left font-medium">Dish</th>
                        <th className="p-2 text-center font-medium w-16">
                          Qty
                        </th>
                        <th className="p-2 text-right font-medium w-24">
                          Price
                        </th>
                        <th className="p-2 pr-4 text-right font-medium w-28">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items?.map((item: OrderItem, idx: number) => (
                        <tr
                          key={idx}
                          className="border-t border-zinc-800 text-zinc-300"
                        >
                          <td className="p-2">{item.name}</td>
                          <td className="p-2 text-center">{item.quantity}</td>
                          <td className="p-2 text-right">
                            ₹{item.priceAtOrder || item.price}
                          </td>
                          <td className="p-2 pr-4 text-right font-medium">
                            ₹
                            {(
                              (item.priceAtOrder || item.price) * item.quantity
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-800/50 flex justify-end">
                  <div className="flex flex-col items-end gap-0.5 text-xs text-zinc-400 w-full max-w-xs">
                    {(order.discountAmount ?? 0) > 0 && (
                      <>
                        <div className="flex justify-between w-full">
                          <span>Discount</span>
                          <span className="font-medium">
                            - ₹{order.discountAmount.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                    {(order.serviceChargeAmount ?? 0) > 0 && (
                      <>
                        <div className="flex justify-between w-full">
                          <span>Service Charge</span>
                          <span className="font-medium">
                            + ₹{order.serviceChargeAmount.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                    {order.appliedTaxes?.map((tax, idx) => (
                      <div key={idx} className="flex justify-between w-full">
                        <span>
                          {tax.name} ({tax.percent}%)
                        </span>
                        <span className="font-medium">
                          + ₹{tax.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between w-full mt-2 pt-2 border-t border-zinc-700">
                      <span className="font-semibold text-zinc-200">Total</span>
                      <span className="font-extrabold text-base text-yellow-300">
                        ₹{order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}