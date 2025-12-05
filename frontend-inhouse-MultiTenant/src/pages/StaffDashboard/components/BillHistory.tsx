import {
  Calendar,
  ChevronRight,
  Clock,
  Receipt,
  RotateCcw,
  Utensils,
} from "lucide-react";

// Import React hooks for managing component state and side effects
import { useCallback, useEffect, useRef, useState } from "react";
// Import types and functions for API interactions related to bills
import type { ApiBill } from "../../../api/staff/bill.api";
import { fetchBillById } from "../../../api/staff/bill.api";
// Import the BillModalComponent for displaying detailed bill information
import BillModalComponent from "./BillModalComponent";
import { useTenant } from "../../../context/TenantContext";
import { normalizeBill } from "../utils/normalize";
import type { Restaurant } from "../../../api/restaurant.api";

// Define the props type for the BillHistory component
type Props = {
  billHistory: ApiBill[]; // An array of bill objects to display
  summary?: {
    // An optional object containing the summary of financial data
    subtotal: number;
    tax: number;
    serviceCharge: number;
    total: number;
  } | null;
  pagination?: {
    // An optional object for managing pagination
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  fetchBillHistory: (params?: {
    // A function to fetch the bill history from the API
    from?: string;
    to?: string;
    limit?: number;
    page?: number;
  }) => Promise<void>;
  isHistoryLoading: boolean; // A boolean indicating if the data is currently being fetched
  historyError: string | null; // A string containing any error message, or null if there are no errors
  formatINR: (n?: number | null) => string; // A function to format numbers into Indian Rupee currency format
  tenant: Restaurant | null;
};

/**
 * Renders the bill history component for the current day.
 */
export default function BillHistory({
  billHistory = [],
  summary,
  pagination,
  fetchBillHistory,
  isHistoryLoading,
  historyError,
  formatINR,
  tenant,
}: Props) {
  /* -------------------------------------------
     Local State
  ------------------------------------------- */
  const [selectedBill, setSelectedBill] = useState<ApiBill | null>(null);
  const { rid } = useTenant();

  const today = new Date().toISOString().split("T")[0];

  /* -------------------------------------------
     Initial Auto Fetch for Today
  ------------------------------------------- */
  const loadTodaysBills = useCallback(() => {
    fetchBillHistory({ from: today, to: today, limit: 100, page: 1 });
  }, [fetchBillHistory, today]);

  /* -------------------------------------------
     View Bill (modal)
  ------------------------------------------- */
  const handleViewBill = async (billId: string) => {
    console.log("handleViewBill called with id:", billId);
    if (!billId) {
      alert("This bill has no ID and cannot be viewed.");
      return;
    }
    if (!rid) {
      console.error("Missing rid in handleViewBill");
      return;
    }
    try {
      console.log("Fetching bill with rid:", rid, "and billId:", billId);
      const rawBill = await fetchBillById(rid, billId);
      console.log("Fetched raw bill:", rawBill);
      const normalized = normalizeBill(rawBill);
      console.log("Normalized bill:", normalized);
      setSelectedBill(normalized);
    } catch (err) {
      console.error("Failed to load bill details:", err);
      alert("Failed to load bill details. Check console for errors.");
    }
  };

  /* -------------------------------------------
     Pagination
  ------------------------------------------- */
  const handleNextPage = () => {
    if (!pagination || pagination.page >= pagination.pages) return;
    fetchBillHistory({ from: today, to: today, page: pagination.page + 1, limit: pagination.limit });
  };

  const handlePrevPage = () => {
    if (!pagination || pagination.page <= 1) return;
    fetchBillHistory({ from: today, to: today, page: pagination.page - 1, limit: pagination.limit });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
      {/* Header section with title and refresh button */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-600" />
            Today's Bill History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Showing completed bills for today.
          </p>
        </div>

        <button
          onClick={loadTodaysBills}
          disabled={isHistoryLoading}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition disabled:bg-indigo-400"
        >
          {isHistoryLoading ? (
            <RotateCcw className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          <span>{isHistoryLoading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Display error message if any */}
      {historyError && <div className="mb-3 text-sm text-rose-600">❌ {historyError}</div>}

      {/* Daily Summary section */}
      {summary && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-slate-700">
            Today's Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 text-sm">
            <div>Subtotal: {formatINR(summary.subtotal)}</div>
            <div>Tax: {formatINR(summary.tax)}</div>
            <div>Service: {formatINR(summary.serviceCharge)}</div>
            <div className="font-semibold">
              Total: {formatINR(summary.total)}
            </div>
          </div>
        </div>
      )}

      {/* Bill List, Loading state, or Empty message */}
      {isHistoryLoading && billHistory.length === 0 ? (
        <div className="py-8 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-t-2 border-indigo-600 rounded-full"></div>
        </div>
      ) : billHistory.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Receipt className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          No bills found for today.
        </div>
      ) : (
        <div className="space-y-3">
          {billHistory.map((bill, index) => (
            <div
              key={`${bill._id || index}`}
              className="bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow p-4 cursor-pointer"
              onClick={() => handleViewBill(bill._id)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Utensils className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      #{bill.orderNumberForDay ?? "N/A"} - Table {bill.tableNumber ?? "N/A"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {bill.customerName || "Guest"} • {bill.staffAlias || "Staff"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-base text-emerald-600">
                    {formatINR(bill.total || bill.totalAmount || 0)}
                  </p>
                   <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      bill.paymentStatus === "paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {bill.paymentStatus}
                  </span>
                </div>
              </div>
              <div className="border-t border-dashed border-slate-200 my-3"></div>
              <div className="flex justify-between items-center text-xs text-slate-600">
                 <div className="flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-slate-400" />
                    <span>{bill.items?.length ?? 0} items</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>
                      {bill.createdAt
                        ? new Date(bill.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </span>
                 </div>
                 <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handlePrevPage}
            disabled={pagination.page <= 1}
            className="px-3 py-1 text-sm bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-sm text-slate-600">
            Page {pagination.page} / {pagination.pages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={pagination.page >= pagination.pages}
            className="px-3 py-1 text-sm bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Bill Modal for viewing detailed bill information */}
      {selectedBill && (
        <BillModalComponent
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          formatINR={formatINR}
          tenant={tenant}
        />
      )}
    </div>
  );
}