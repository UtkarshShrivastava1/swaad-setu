/**
 * Multi-tenant Role Authorization Middleware
 * - Enforces tenant isolation (defensive)
 * - Normalizes role from multiple token formats
 * - Allows admin override
 * - Redacted safe logging
 */

const redactUser = (user = {}) => {
  const allowed = {};
  if (user._id) allowed._id = user._id;
  if (user.id) allowed.id = user.id;
  if (user.email) allowed.email = user.email;
  if (user.username) allowed.username = user.username;
  if (user.role) allowed.role = user.role;

  allowed.keys = Object.keys(user).filter(
    (k) => !["hashedPin", "password", "hash", "overrideTokens"].includes(k)
  );

  return allowed;
};

const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles)
    ? allowedRoles
    : allowedRoles
    ? [allowedRoles]
    : [];

  return (req, res, next) => {
    try {
      const now = new Date().toISOString();
      const rid = req.params?.rid || null;

      // Defensive: ensure user & tenant exists
      if (!req.user || !req.user.restaurantId) {
        return res
          .status(401)
          .json({ error: "Unauthorized - User not authenticated" });
      }

      // Defensive tenant isolation check
      if (rid && req.user.restaurantId !== rid) {
        console.warn(`[${now}] [requireRole] Tenant mismatch`, {
          rid,
          tokenRid: req.user.restaurantId,
          user: redactUser(req.user),
        });
        return res.status(403).json({ error: "Forbidden - Tenant mismatch" });
      }

      // Normalize user role
      const userRole = (
        req.user.role ||
        (Array.isArray(req.user.roles) ? req.user.roles[0] : null) ||
        req.user.roleName
      )
        ?.toString()
        .toLowerCase();

      if (!userRole) {
        return res.status(403).json({ error: "Forbidden - User role missing" });
      }

      // If route requires no specific role → allow authenticated user
      if (roles.length === 0 || roles.includes("*")) {
        return next();
      }

      const normalizedAllowed = roles.map((r) => r.toString().toLowerCase());

      // Admin override: admin can perform everything except public/customer endpoints
      if (userRole === "admin") {
        return next();
      }

      // Check if user has required role
      if (!normalizedAllowed.includes(userRole)) {
        console.warn(`[${now}] [requireRole] Role mismatch`, {
          rid,
          userRole,
          required: normalizedAllowed,
          user: redactUser(req.user),
        });
        return res
          .status(403)
          .json({ error: "Forbidden - Insufficient permissions" });
      }

      return next();
    } catch (err) {
      const now = new Date().toISOString();
      console.error(`[${now}] [requireRole] Unexpected error`, err);
      return res
        .status(500)
        .json({ error: "Internal server error (role check)" });
    }
  };
};

module.exports = requireRole;
