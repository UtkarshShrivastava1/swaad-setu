import {api} from "./client";

export async function fetchBill(rid: string) {
  const res = await api(`/api/${rid}/bills/active `, { method: "GET" });
  console.log('response from fetchBill API:', res);
  return res;
}