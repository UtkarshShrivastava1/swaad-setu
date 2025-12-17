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

const NotificationsView = ({ calls, isLoading, error, fetchCalls, handleUpdateCallStatus, tables, waiterNames, waiterLoading, waiterError }: NotificationsViewProps) => {
  const safeCalls = Array.isArray(calls) ? calls : [];
  const [selectedStaffAlias, setSelectedStaffAlias] = useState("waiter");

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-yellow-500/15 text-yellow-400">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-yellow-400">Table Calls</h2>
            <p className="text-sm text-zinc-400">Live customer requests</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <select
              className="px-4 py-2 rounded-xl border border-zinc-700 text-sm bg-zinc-800 text-white shadow-sm focus:border-yellow-400 focus:ring-yellow-400"
              value={selectedStaffAlias}
              onChange={(e) => setSelectedStaffAlias(e.target.value)}
              disabled={waiterLoading}
            >
              <option value="waiter">Acknowledge as Waiter</option>
              {waiterNames.map((name) => (<option key={name} value={name}>{name}</option>))}
            </select>
            <button onClick={fetchCalls} className="p-2.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50">
              <RefreshCcw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
        </div>
      </div>

      {isLoading && <div className="text-center py-10 text-zinc-400">Loading calls...</div>}
      {error && <div className="text-center py-10 text-red-400">{error}</div>}
      {!isLoading && !error && safeCalls.length === 0 && <div className="text-center text-zinc-500 py-16 border border-dashed border-zinc-800 rounded-xl">No active calls right now.</div>}
      
      <div className="space-y-3">
        {safeCalls.map((call) => {
          const tableNumber = tables.find((t) => t._id === call.tableId)?.tableNumber || "--";
          return (
            <div key={call._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 hover:border-zinc-700 transition">
              <div>
                <p className="font-semibold text-white"><span className="capitalize">{call.type}</span> Request from Table <span className="font-bold text-yellow-400">{tableNumber}</span></p>
                {call.notes && <p className="text-xs text-zinc-400 mt-1 italic">"{call.notes}"</p>}
              </div>
              <button onClick={() => handleUpdateCallStatus(call._id, selectedStaffAlias)} className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 text-emerald-300 px-4 py-2 font-bold hover:bg-emerald-500/30 active:scale-[0.96] transition">
                <CheckCircle size={16} /> Acknowledge
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default NotificationsView;