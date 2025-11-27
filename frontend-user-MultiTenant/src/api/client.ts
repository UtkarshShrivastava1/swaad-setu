// client.ts
import { v4 as uuidv4 } from "uuid";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

type ReqOpts = RequestInit & { idempotency?: boolean };

export async function api<T>(path: string, opts: ReqOpts = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // ✅ Include Bearer token if present
  const token = localStorage.getItem("token");
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // ✅ Optional idempotency key
  if (opts.idempotency) {
    headers["Idempotency-Key"] = uuidv4();
  }

  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: { ...headers, ...(opts.headers || {}) },
 
  });


  if (!res.ok) {
    const text = await res.text();
    console.error("API error:", res.status, text);
    throw new Error(`${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}
