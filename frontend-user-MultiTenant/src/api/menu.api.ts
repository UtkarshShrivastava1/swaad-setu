// menu.api.ts
import { api } from "./client";

export async function fetchMenu(rid : string) {
  const res = api(`/api/${rid.trim()}/admin/menu`, { method: "GET" });
  
   return res;
}
