// src/api/staff/staff.login.ts
import client from "../client";

export async function loginAsStaff(pin: string, rid: string) {
  try {
    const res = await client.post<{ token: string }>(
      `/api/${rid}/admin/auth/staff-login`,
      { pin }
    );

    const token = res.token;
    localStorage.setItem("staffToken", token);
    return res;
  } catch (err) {
    console.error("Staff login failed:", err);
    throw err;
  }
}
