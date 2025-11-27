// staffLogin.ts
import { api } from "./client";

export async function staffLogin(
  pin: string,
  userType:  "staff",
  rid: string
) {
  return api(`/api/${rid}/admin/auth/staff-login`, {
    method: "POST",
    body: JSON.stringify({ pin, userType }),
  });
}
