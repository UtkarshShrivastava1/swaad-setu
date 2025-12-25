import { api } from "@/api/client";

interface CreateCallBody {
  tableId: string;
  type: string;
  notes: string;
}

export async function createCall(rid: string, body: CreateCallBody) {
  const res = await api(`/api/${rid}/calls`, {
    method: "POST",
    body: JSON.stringify(body),
    idempotency: true,
  });
  return res;
}

export async function getCall(rid: string, callId: string) {
  const res = await api(`/api/${rid}/calls/${callId}`, {
    method: "GET",
  });
  return res;
}
