// Import necessary icons from the lucide-react library
import {
  Calendar,
  ChevronRight,
  Clock,
  IndianRupee,
  Receipt,
  RotateCcw,
  Utensils,
} from "lucide-react";

// Import React hooks for managing component state and side effects
import { useEffect, useRef, useState } from "react";
// Import types and functions for API interactions related to bills
import type { ApiBill } from "../../../api/staff/bill.api";
import { fetchBillById } from "../../../api/staff/bill.api";
// Import the BillModalComponent for displaying detailed bill information
import BillModalComponent from "./BillModalComponent";

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
  loading: boolean; // A boolean indicating if the data is currently being fetched
  err: string | null; // A string containing any error message, or null if there are no errors
  formatINR: (n?: number | null) => string; // A function to format numbers into Indian Rupee currency format
};

/**
 * Renders the bill history component, allowing users to view past bills,
 * filter them by date, and see a summary of financial data.
 */
export default function BillHistory({
  billHistory = [],
  summary,
  pagination,
  fetchBillHistory,
  loading,
  err,
  formatINR,
}: Props) {
  /* -------------------------------------------
     Local State
  ------------------------------------------- */
  // State for the selected date, initialized to the current date
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // State for the selected date preset (e.g., "today", "yesterday")
  const [selectedPreset, setSelectedPreset] = useState<
    "today" | "yesterday" | "7d" | null
  >(null);

  // State to hold the currently selected bill for modal view
  const [selectedBill, setSelectedBill] = useState<ApiBill | null>(null);
  // State to manage loading status when fetching a single bill's details
  const [isBillLoading, setIsBillLoading] = useState(false);

  // Ref to track if the initial data fetch has occurred
  const hasFetchedOnce = useRef(false);

  /* -------------------------------------------
     Initial Auto Fetch
  ------------------------------------------- */
  // Effect to automatically fetch bill history for the current date on initial component mount
  useEffect(() => {
    if (!hasFetchedOnce.current) {
      fetchBillHistory({ from: selectedDate, to: selectedDate, limit: 50 });
      hasFetchedOnce.current = true;
    }
  }, [fetchBillHistory, selectedDate]);

  /* -------------------------------------------
     Fetch by Selected Date
  ------------------------------------------- */
  // Handler for fetching bills based on the selected date from the date picker
  const handleFetchDate = async () => {
    if (!selectedDate || loading) return; // Prevent fetching if no date is selected or if already loading
    setSelectedPreset(null); // Reset the preset when a custom date is used

    // Fetch bills for the selected date range
    await fetchBillHistory({
      from: selectedDate,
      to: selectedDate,
      limit: 50,
      page: 1,
    });
  };

  /* -------------------------------------------
     Quick Presets
  ------------------------------------------- */
  // Handler for fetching bills using predefined date presets like "today", "yesterday", or "last 7 days"
  const handlePreset = async (
    daysAgo: number,
    preset: "today" | "yesterday" | "7d"
  ) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split("T")[0];

    setSelectedDate(dateStr);
    setSelectedPreset(preset);

    // Fetch bills based on the selected preset's date range
    await fetchBillHistory(
      preset === "7d"
        ? { from: dateStr, to: new Date().toISOString().split("T")[0] }
        : { from: dateStr, to: dateStr }
    );
  };

  /* -------------------------------------------
     View Bill (modal)
  ------------------------------------------- */
  // Handler for fetching and displaying a single bill's details in a modal
  const handleViewBill = async (billId: string) => {
    try {
      setIsBillLoading(true);
      const bill = await fetchBillById(billId); // Fetch the bill by its ID
      setSelectedBill(bill); // Set the fetched bill to be displayed in the modal
    } catch (err) {
      alert("Failed to load bill details"); // Show an alert on failure
    } finally {
      setIsBillLoading(false);
    }
  };

  /* -------------------------------------------
     Pagination
  ------------------------------------------- */
  // Handler for navigating to the next page of bills
  const handleNextPage = () => {
    if (!pagination || pagination.page >= pagination.pages) return;
    fetchBillHistory({ page: pagination.page + 1, limit: pagination.limit });
  };

  // Handler for navigating to the previous page of bills
  const handlePrevPage = () => {
    if (!pagination || pagination.page <= 1) return;
    fetchBillHistory({ page: pagination.page - 1, limit: pagination.limit });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
      {/* Header section with title and date picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-600" />
            Bill History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Choose a date or use presets to load completed bills.
          </p>
        </div>

        {/* Date Picker and Fetch Button controls */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />

          <button
            onClick={handleFetchDate}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition"
          >
            {loading ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Fetch
              </>
            )}
          </button>

          {/* Preset buttons for quick date selection */}
          <div className="hidden sm:flex gap-2 ml-2">
            {[
              { label: "Today", key: "today", daysAgo: 0 },
              { label: "Yesterday", key: "yesterday", daysAgo: 1 },
              { label: "7d", key: "7d", daysAgo: 6 },
            ].map(({ label, key, daysAgo }) => (
              <button
                key={key}
                onClick={() =>
                  handlePreset(daysAgo, key as "today" | "yesterday" | "7d")
                }
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  selectedPreset === key
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Display error message if any */}
      {err && <div className="mb-3 text-sm text-rose-600">❌ {err}</div>}

      {/* Daily Summary section */}
      {summary && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-slate-700">
            Daily Summary
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
      {loading ? (
        <div className="py-8 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-t-2 border-indigo-600 rounded-full"></div>
        </div>
      ) : billHistory.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Receipt className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          No bills found for {selectedDate}.
        </div>
      ) : (
        <div className="space-y-4">
          {billHistory.map((bill, index) => (
            <div
              key={`${bill._id || index}`}
              className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition p-4 sm:p-5 cursor-pointer"
              onClick={() => handleViewBill(bill._id)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Utensils className="h-6 w-6 text-indigo-600" />
                  </div>

                  <div>
                    <div className="font-semibold text-slate-800 text-base">
                      Order #{bill.orderNumberForDay ?? "—"}
                      <span className="text-slate-500 text-sm ml-2">
                        • Table {bill.tableNumber ?? "—"}
                      </span>
                    </div>

                    <div className="text-sm text-slate-600">
                      Customer: {bill.customerName || "Guest"}
                    </div>

                    <div className="text-xs text-slate-400">
                      Staff: {bill.staffAlias || "Unknown"} •{" "}
                      {bill.createdAt
                        ? new Date(bill.createdAt).toLocaleString()
                        : "--"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-md font-medium ${
                      bill.paymentStatus === "paid"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {bill.paymentStatus}
                  </span>

                  <span className="font-bold text-emerald-600">
                    {formatINR(bill.totalAmount ?? 0)}
                  </span>

                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 text-slate-700 text-sm">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-slate-600" />
                  <span>{bill.items?.length ?? 0} items</span>
                </div>

                <div className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-emerald-600" />
                  <span>{formatINR(bill.subtotal ?? 0)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span>
                    {bill.createdAt
                      ? new Date(bill.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
                  </span>
                </div>
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
          // The isBillLoading prop was passed here, but the BillModalComponent does not accept it.
          // This might be a remnant of previous code or a potential bug.
          // For now, it's removed to align with the component's expected props.
        />
      )}
    </div>
  );
}
