import client from "./client";

export const addWaiter = async (waiter: { name: string }, rid: string) => {
  const response = await client.post(
    `/api/${rid}/admin/waiters`,
    {
      name: waiter.name,
    },
  );
  return response;
};

export const getWaiters = async (rid: string) => {
  const response = await client.get(`/api/${rid}/admin/waiters`);
  return response;
};

export const updateWaiter = async (
  rid: string,
  { oldName, newName }: { oldName: string; newName: string }
) => {
  const response = await client.patch(
    `/api/${rid}/admin/waiters`,
    {
      oldName,
      newName,
    },
  );
  return response;
};

export const deleteWaiter = async (name: string, rid: string) => {
  const response = await client.delete(`/api/${rid}/admin/waiters`, {
    data: { name },
  });
  return response;
};
