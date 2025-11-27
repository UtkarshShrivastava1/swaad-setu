import { client } from "../client";

export interface ICall {
  _id: string;
  restaurantId: string;
  tableId: string;
  sessionId: string;
  orderId: string;
  type: "bill" | "waiter";
  notes: string;
  status: "active" | "resolved";
  customerName: string;
  customerContact: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  __v?: number;
}

function getAuthHeaders(rid?: string | null) {
  let token = null;
  if (rid) {
    token = localStorage.getItem(`staffToken_${rid}`) || localStorage.getItem("staffToken");
  } else {
    token = localStorage.getItem("staffToken");
  }
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ===============================================================
// ✅ GET ACTIVE CALLS (STAFF)
// ===============================================================
export const getActiveCalls = async (tenant: { rid: string | null }) => {
  try {
    console.log("Fetching active calls for tenant:", tenant.rid);
    const response = await client.get<ICall[]>(
      `/api/${tenant.rid}/calls/active`,
      { headers: getAuthHeaders(tenant.rid) }
    );
    console.log("Received active calls:", response);
    return response;
  } catch (error) {
    console.error("Failed to fetch active calls:", error);
    throw error;
  }
};

// ===============================================================
// ✅ RESOLVE A CALL (STAFF)
// ===============================================================
export const resolveCall = async (
  tenant: { rid: string | null },
  callId: string,
  staffAlias: string
) => {
  const response = await client.patch(
    `/api/${tenant.rid}/calls/${callId}/resolve`,
    { staffAlias },
    { headers: getAuthHeaders(tenant.rid) }
  );
  return response;
};
