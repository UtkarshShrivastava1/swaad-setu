// src/api/admin/table.api.ts
import client from "./client";

export interface ApiTable {
    _id: string;
    tableNumber: number;
    capacity: number;
    status: string;
    isActive: boolean;
    waiterCalled?: boolean;
    currentSessionId?: string;
    staffAlias?: string;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("staffToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getTables(rid: string): Promise<ApiTable[]> {
  return client.get(`/api/${rid}/tables?includeInactive=true`);
}



export async function deleteTable(rid: string, tableId: string): Promise<void> {
  return client.delete(`/api/${rid}/tables/${tableId}`);
}

export async function createTable(
  rid: string,
  payload: object
): Promise<ApiTable> {
  return client.post(`/api/${rid}/tables`, payload);
}

export async function toggleTableActive(
  rid: string,
  tableId: string,
  isActive: boolean
): Promise<ApiTable> {
  return client.patch(
    `/api/${rid}/tables/${tableId}/active`,
    { isActive },
  );
}

export async function resetTable(
  rid: string,
  tableId: string
): Promise<ApiTable> {
  return client.patch(`/api/${rid}/tables/${tableId}/reset`, {}, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
}
