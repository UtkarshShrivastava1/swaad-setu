// src/api/admin/admin.login.ts
import client from "../client";

export async function loginAsAdmin(rid: string, pin: string) {
  try {
    const res = await client.post<{ token: string; admin: any }>(
      `/api/${rid}/admin/login`,
      { pin }
    );
    return res;
  } catch (err) {
    console.error("Admin login failed:", err);
    throw err;
  }
}

