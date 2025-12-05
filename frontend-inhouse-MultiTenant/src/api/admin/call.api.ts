// src/api/admin/call.api.ts

import { client } from "../client";

export interface ICall {
  _id: string;
  restaurantId: string;
  tableId: string;
  sessionId: string;
  orderId?: string; // Order ID might not always be present
  type: "bill" | "waiter" | string; // Type can be other things
  notes: string;
  status: "active" | "resolved" | string;
  customerName?: string;
  customerContact?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  __v?: number;
  table?: { tableNumber: string }; // Include nested table info
}

function getAuthHeaders(rid?: string | null) {
  let token = null;
  if (rid) {
    token = localStorage.getItem(`adminToken_${rid}`) || localStorage.getItem("adminToken");
  } else {
    token = localStorage.getItem("adminToken");
  }
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// GET ACTIVE CALLS (ADMIN)
export const getActiveCalls = async (rid: string) => {
  if (!rid) throw new Error("Restaurant ID is required");
  try {
    const response = await client.get<ICall[]>(
      `/api/${rid}/calls/active`,
      { headers: getAuthHeaders(rid) }
    );
    return response;
  } catch (error) {
    console.error("Failed to fetch active calls:", error);
    throw error;
  }
};

// RESOLVE A CALL (ADMIN)
export const resolveCall = async (
  rid: string,
  callId: string,
  adminAlias: string
) => {
  if (!rid || !callId) throw new Error("RID and Call ID are required");
  const response = await client.patch(
    `/api/${rid}/calls/${callId}/resolve`,
    { staffAlias: adminAlias }, // API likely expects staffAlias
    { headers: getAuthHeaders(rid) }
  );
  return response;
};
