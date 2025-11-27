// src/utils/tenant.utils.ts

/**
 * Basic validation for RIDs.
 * Enforces lowercase alphanumeric + hyphens.
 */
export function isValidRid(rid: string): boolean {
  return /^[a-z0-9-]+$/.test(rid) && rid.length >= 3 && rid.length <= 60;
}

/**
 * Extract RID from subdomain: rid.example.com
 */
export function getRidFromSubdomain(): string | null {
  const host = window.location.hostname;
  const parts = host.split(".");

  if (parts.length > 2 && parts[0] !== "www" && parts[0] !== "localhost") {
    return parts[0];
  }

  return null;
}

/**
 * Extract RID from URL path: /t/:rid/...
 */
export function getRidFromPath(): string | null {
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/t\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * Detect RID from any source (priority order)
 */
export function detectRid(): string | null {
  return (
    getRidFromPath() ||
    getRidFromSubdomain() ||
    localStorage.getItem("currentRid") ||
    null
  );
}

/**
 * Build tenant-scoped path
 */
export function getTenantPath(rid: string, path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `/t/${rid}/${cleanPath}`;
}

/**
 * Build tenant-scoped API path
 */
export function getTenantApiPath(rid: string, path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `/api/${rid}/${cleanPath}`;
}
