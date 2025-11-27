import { api } from "./client";

export async function createCall(rid: string, body: any) {
  const res = await api(`/api/${rid}/calls`, {
    method: "POST",
    body: JSON.stringify(body),
    idempotency: true,
  });
  return res;
}
