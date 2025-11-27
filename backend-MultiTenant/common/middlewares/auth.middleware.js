const { verifyToken } = require("../libs/jwt");
const { randomBytes } = require("crypto");

/**
 * Multi-tenant Authentication Middleware
 * - Enforces tenant isolation
 * - Allows safe public GET endpoints
 * - Validates rid <-> token.restaurantId
 */
module.exports = function authMiddleware(req, res, next) {
  const now = new Date().toISOString();
  const method = (req.method || "GET").toUpperCase();
  const path = req.originalUrl || req.url || "";

  const rid = req.params?.rid || null;

  // correlate request
  const headerReqId = req.header?.("x-request-id");
  const reqId = headerReqId || randomBytes(8).toString("hex");
  req.requestId = req.requestId || reqId;
  res.setHeader?.("x-request-id", req.requestId);

  console.debug(`[${now}] [authMiddleware] Enter`, {
    reqId,
    method,
    path,
    rid,
  });

  // ============================================================
  // 🚀 PUBLIC ROUTES (SAFE)
  // ============================================================
  // These are prefix-based, not strict equality.
  const publicRoutes = [
    { method: "GET", pattern: /^\/api\/([^/]+)\/admin\/menu$/ },
    { method: "POST", pattern: /^\/api\/([^/]+)\/admin\/login$/ },
    { method: "POST", pattern: /^\/api\/([^/]+)\/admin\/auth\/staff-login$/ },
  ];

  const isPublic = publicRoutes.some((route) => {
    return route.method === method && route.pattern.test(path);
  });

  if (isPublic) {
    console.info(`[${now}] [authMiddleware] Public route skipped`, {
      reqId,
      method,
      path,
      rid,
    });
    return next();
  }

  // ============================================================
  // 🔐 PROTECTED PATHS
  // ============================================================
  const rawAuth = req.header?.("Authorization");
  const token = rawAuth ? rawAuth.replace(/^Bearer\s+/i, "") : null;

  if (!token) {
    console.warn(`[${now}] [authMiddleware] Missing token`, {
      reqId,
      path,
    });
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const tokenPreview =
    token.length > 10 ? `${token.slice(0, 6)}...${token.slice(-4)}` : token;

  console.debug(`[${now}] [authMiddleware] Token found`, {
    reqId,
    tokenPreview,
  });

  let decoded;
  try {
    decoded = verifyToken(token);
    console.debug(`[${now}] [authMiddleware] Decoded token payload`, {
      reqId,
      payload: decoded,
    });
  } catch (err) {
    console.error(`[${now}] [authMiddleware] Token verify failed`, {
      reqId,
      error: err?.message,
    });
    return res.status(400).json({ error: "Invalid token" });
  }

  // ============================================================
  // 🛑 Tenant Enforcement
  // ============================================================

  const tokenRid = decoded.restaurantId;

  if (!rid || typeof rid !== "string" || rid.trim() === "") {
    console.warn(`[${now}] [authMiddleware] Missing rid param`, {
      reqId,
      tokenRid,
    });
    return res.status(400).json({ error: "Missing restaurant id (rid)" });
  }

  if (!tokenRid) {
    console.warn(`[${now}] [authMiddleware] Token missing restaurantId`, {
      reqId,
      decoded,
    });
    return res.status(400).json({ error: "Token missing tenant info" });
  }


  if (tokenRid !== rid) {
    console.warn(`[${now}] [authMiddleware] Tenant mismatch`, {
      reqId,
      path,
      ridParam: rid,
      tokenRid,
    });
    return res.status(403).json({ error: "Forbidden (cross-tenant)" });
  }

  // ============================================================
  // 🧩 Attach user
  // ============================================================
  req.user = {
    restaurantId: tokenRid,
    role: decoded.role || "user",
    id: decoded.id,
  };

  console.info(`[${now}] [authMiddleware] OK`, {
    reqId,
    rid,
    role: req.user.role,
  });

  return next();
};
