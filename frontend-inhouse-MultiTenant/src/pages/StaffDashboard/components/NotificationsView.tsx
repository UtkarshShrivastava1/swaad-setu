import { Bell, CheckCircle, RefreshCcw } from "lucide-react";
import { useState } from "react";
import type { ICall } from "../../../api/staff/call.api";
import type { Table } from "../types";

interface NotificationsViewProps {
  calls: ICall[];
  isLoading: boolean;
  error: string | null;
  fetchCalls: () => void;
  handleUpdateCallStatus: (callId: string, staffAlias: string) => void;
  tables: Table[];
  waiterNames: string[];
  waiterLoading: boolean;
  waiterError: string | null;
}

const NotificationsView = ({
  calls,
  isLoading,
  error,
  fetchCalls,
  handleUpdateCallStatus,
  tables,
  waiterNames,
  waiterLoading,
  waiterError,
}: NotificationsViewProps) => {
  const safeCalls = Array.isArray(calls) ? calls : [];
  const [selectedStaffAlias, setSelectedStaffAlias] = useState("waiter");

  return (
    <section className="relative rounded-3xl border border-yellow-400/30 bg-gradient-to-br from-black via-zinc-900 to-black backdrop-blur-xl shadow-[0_0_45px_rgba(250,204,21,0.25)] overflow-hidden">
      {/* ================= HEADER ================= */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-black p-2.5 rounded-xl">
            <Bell className="text-yellow-400 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-black">Table Calls</h2>
            <p className="text-xs text-black/70">Live customer requests</p>
          </div>
        </div>

        <button
          onClick={fetchCalls}
          className="flex items-center gap-2 rounded-xl bg-black text-yellow-400 px-4 py-2 font-bold shadow hover:bg-zinc-900 active:scale-[0.97] transition"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {/* ================= STAFF SELECT ================= */}
      <div className="px-6 py-4 bg-white border-b border-yellow-200 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm font-semibold text-black">
          Acknowledge As:
        </label>

        <select
          className="px-4 py-2 rounded-xl border border-gray-300 text-sm bg-white shadow-sm focus:border-yellow-400 focus:ring-yellow-400"
          value={selectedStaffAlias}
          onChange={(e) => setSelectedStaffAlias(e.target.value)}
          disabled={waiterLoading}
        >
          <option value="waiter">Waiter</option>
          {waiterNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        {waiterLoading && (
          <span className="text-gray-500 text-sm">Loading waiters...</span>
        )}
        {waiterError && (
          <span className="text-red-500 text-sm">{waiterError}</span>
        )}
      </div>

      {/* ================= BODY ================= */}
      <div className="max-h-[520px] overflow-y-auto px-6 py-5 bg-white">
        {/* LOADING */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-yellow-400 border-t-transparent rounded-full" />
          </div>
        )}

        {/* ERROR */}
        {error && (
          <p className="text-center text-red-500 py-10 font-medium">{error}</p>
        )}

        {/* EMPTY */}
        {!isLoading && !error && safeCalls.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            No active calls right now.
          </p>
        )}

        {/* CALL CARDS */}
        <div className="space-y-4">
          {safeCalls.map((call) => {
            const tableNumber =
              tables.find((t) => t._id === call.tableId)?.tableNumber || "--";

            return (
              <div
                key={call._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-yellow-300 bg-yellow-50 px-5 py-4 shadow-sm hover:shadow-md transition"
              >
                <div>
                  <p className="font-semibold text-black">
                    <span className="capitalize">{call.type}</span> Request
                  </p>
                  <p className="text-sm text-gray-600">
                    From Table{" "}
                    <span className="font-bold text-black">{tableNumber}</span>
                  </p>
                  {call.notes && (
                    <p className="text-xs text-gray-500 mt-1">{call.notes}</p>
                  )}
                </div>

                <button
                  onClick={() =>
                    handleUpdateCallStatus(call._id, selectedStaffAlias)
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-black text-yellow-400 px-5 py-2 font-bold shadow hover:bg-zinc-900 active:scale-[0.96] transition"
                >
                  <CheckCircle size={16} />
                  Acknowledge
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-3 text-black font-semibold text-sm flex justify-between">
        <span>Active Calls: {safeCalls.length}</span>
        <span>Live Service Monitoring</span>
      </div>
    </section>
  );
};

export default NotificationsView;
