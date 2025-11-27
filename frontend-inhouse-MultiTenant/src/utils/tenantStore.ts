// src/utils/tenantStore.ts
let rid: string | null = null;

export function setTenantRid(newRid: string) {
  rid = newRid;
  localStorage.setItem("currentRid", newRid);
}

export function getTenantRid(): string | null {
  if (rid) return rid;
  rid = localStorage.getItem("currentRid");
  return rid;
}
