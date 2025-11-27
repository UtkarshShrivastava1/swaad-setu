import client from "./client";

export async function fetchBill(rid: string) {
  const res = await client.get(`/api/${rid}/bills/active `);
  console.log('response from fetchBill API:', res);
  return res;
}