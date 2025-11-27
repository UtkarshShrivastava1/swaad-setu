import React, { useState } from "react";
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
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Table Calls</h2>
        <button
          onClick={fetchCalls}
          className="px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-sm"
        >
          Refresh
        </button>
      </div>

      {waiterLoading && <p className="text-center text-slate-500 py-4">Loading waiters...</p>}
      {waiterError && <p className="text-center text-red-500 py-4">{waiterError}</p>}

      <div className="flex items-center gap-2 mb-4">
        <label htmlFor="staffAlias" className="text-sm font-medium text-slate-700">Acknowledge As:</label>
        <select
          id="staffAlias"
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
          value={selectedStaffAlias}
          onChange={(e) => setSelectedStaffAlias(e.target.value)}
          disabled={waiterLoading}
        >
          <option value="waiter">Waiter</option>
          {waiterNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-t-2 border-indigo-600 rounded-full" />
        </div>
      ) : error ? (
        <p className="text-center text-red-500 py-8">{error}</p>
      ) : safeCalls.length === 0 ? (
        <p className="text-center text-slate-500 py-8">
          No active calls right now.
        </p>
      ) : (
        safeCalls.map((call) => (
          <div
            key={call._id}
            className="p-4 bg-rose-50 border border-rose-200 rounded-lg mb-3 flex justify-between items-center"
          >
            <div>
              <strong className="capitalize">{call.type} Request</strong> from
              table{" "}
              <strong>
                {
                  tables.find((t) => t._id === call.tableId)?.tableNumber
                }
              </strong>
              <p className="text-sm text-slate-600">{call.notes}</p>
            </div>
            <button
              onClick={() =>
                handleUpdateCallStatus(
                  call._id,
                  selectedStaffAlias
                )
              }
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg"
            >
              Acknowledge
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationsView;

