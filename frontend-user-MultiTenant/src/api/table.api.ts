import { api } from "./client";

export async function fetchTable(rid: string) {
  const res = await api(`/api/${rid}/tables`, { method: "GET" });
   return res;
}