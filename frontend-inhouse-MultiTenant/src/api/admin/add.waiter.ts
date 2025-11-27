import client from "../client";

function authHeaders(rid: string) {
  const token = localStorage.getItem(`adminToken_${rid}`);
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

export const addWaiter = async (waiter: { name: string }, rid: string) => {
  const response = await client.post(
    `/api/${rid}/admin/waiters`,
    {
      name: waiter.name,
    },
    {
      headers: authHeaders(rid),
    }
  );
  return response.data;
};

export const getWaiters = async (rid: string) => {
  const response = await client.get(`/api/${rid}/admin/waiters`, {
    headers: authHeaders(rid),
  });
  return response.data;
};

export const updateWaiters = async (
  rid: string,
  { oldName, newName }: { oldName: string; newName: string }
) => {
  const response = await client.patch(
    `/api/${rid}/admin/waiters`,
    {
      oldName,
      newName,
    },
    {
      headers: authHeaders(rid),
    }
  );
  return response.data;
};

export const deleteWaiter = async (name: string, rid: string) => {
  const response = await client.delete(`/api/${rid}/admin/waiters`, {
    data: { name },
    headers: authHeaders(rid),
  });
  return response.data;
};


