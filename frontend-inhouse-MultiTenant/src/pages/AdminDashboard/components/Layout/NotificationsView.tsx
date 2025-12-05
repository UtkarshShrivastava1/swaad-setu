// src/pages/AdminDashboard/components/Layout/NotificationsView.tsx

import { Bell, Check } from "lucide-react";
import { useCalls } from "../../hooks/useCalls";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

export default function NotificationsView({ onBack }: { onBack: () => void }) {
  const { calls, isLoading, error, handleResolveCall } = useCalls();
  const [resolving, setResolving] = useState<string | null>(null);

  const onResolve = async (callId: string) => {
    setResolving(callId);
    try {
      await handleResolveCall(callId);
    } catch (e) {
      // Show some error to the user
      alert("Failed to resolve call. Please try again.");
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Bell />
          Active Waiter Calls
        </h2>
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          &larr; Back to Dashboard
        </button>
      </div>

      {isLoading && calls.length === 0 && <p>Loading calls...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && calls.length === 0 && (
        <p className="text-gray-500">No active calls right now.</p>
      )}

      <div className="space-y-4">
        {calls.map((call) => (
          <div
            key={call._id}
            className="p-4 border rounded-lg flex justify-between items-center bg-gray-50"
          >
            <div>
              <p className="font-semibold">
                Table {call.table?.tableNumber || call.tableId}
              </p>
              <p className="text-sm text-gray-600 capitalize">
                Type: {call.type}
              </p>
              {call.notes && (
                <p className="text-sm text-gray-500 mt-1">
                  Notes: {call.notes}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {formatDistanceToNow(new Date(call.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <button
              onClick={() => onResolve(call._id)}
              disabled={resolving === call._id}
              className="bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 flex items-center gap-1"
            >
              {resolving === call._id ? (
                "Resolving..."
              ) : (
                <>
                  <Check size={16} /> Mark as Resolved
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
