// common/libs/helpers.js
// Shared helpers used across controllers & routes.
// - ensureStaffAliasValid(rid, alias)
// - requireRoleMiddleware(authMiddleware, role)
// - requestHasRole(req, allowedRoles)
// - ensureStaffAliasMiddleware(fieldName = 'staffAlias')
//
// Usage examples:
// const { requireRoleMiddleware, ensureStaffAliasMiddleware } = require('../common/libs/helpers');
// router.patch('/x', requireRoleMiddleware(authMiddleware, 'staff'), ensureStaffAliasMiddleware(), controller.fn);

const logger = (() => {
  try {
    return require("./logger");
  } catch (e) {
    return console;
  }
})();

// Defensive require of Admin model (optional)
let Admin = null;
try {
  Admin = require("../../models/admin.model");
} catch (e) {
  try {
    Admin = require("../models/admin.model");
  } catch (err) {
    Admin = null;
  }
}

/**
 * Check whether a staffAlias is valid for the given restaurant (rid).
 * Behavior:
 *  - If Admin model is missing, returns true (permissive) but logs a warning.
 *  - If Admin document exists and staffAliases is a non-empty array, returns true only if alias is in array.
 *  - If Admin exists but staffAliases is empty/undefined:
 *      - If process.env.STAFF_ALIAS_STRICT === "true" => returns false (strict mode)
 *      - Otherwise returns true (backwards-compatible permissive)
 *
 * @param {String} rid
 * @param {String} staffAlias
 * @returns {Promise<Boolean>}
 */
async function ensureStaffAliasValid(rid, staffAlias) {
  if (!staffAlias || typeof staffAlias !== "string") return false;
  if (!rid || typeof rid !== "string") {
    logger &&
      logger.warn &&
      logger.warn("ensureStaffAliasValid called without rid");
    return false;
  }

  if (!Admin) {
    logger &&
      logger.warn &&
      logger.warn("Admin model missing; skipping staffAlias strict validation");
    return true;
  }

  try {
    const admin = await Admin.findOne({ restaurantId: rid }).lean();
    if (!admin) {
      // No admin configured -> permissive
      return true;
    }

    const aliases = Array.isArray(admin.staffAliases) ? admin.staffAliases : [];
    if (aliases.length === 0) {
      // If strict mode turned on, disallow unknown alias when none configured.
      if (String(process.env.STAFF_ALIAS_STRICT).toLowerCase() === "true") {
        return false;
      }
      return true;
    }

    return aliases.includes(staffAlias);
  } catch (err) {
    logger &&
      logger.error &&
      logger.error("ensureStaffAliasValid error:", err && err.message);
    // Fail-safe: deny if DB check errors
    return false;
  }
}

/**
 * Synchronous role-check helper for request objects.
 * Returns true only if req.user exists and user.role matches one of allowedRoles,
 * or if user.role === 'admin' (admin always allowed).
 *
 * Note: this helper DOES NOT run auth middleware. Call it after auth has populated req.user,
 * or use requireRoleMiddleware to enforce auth first.
 *
 * @param {Object} req - express request
 * @param {Array<String>} allowedRoles - e.g. ['staff']
 * @returns {Boolean}
 */
function requestHasRole(req, allowedRoles = ["staff"]) {
  if (!req || !req.user) return false;
  const role = req.user.role || (req.user && req.user.roles) || null;
  if (!role) return false;
  if (role === "admin") return true;
  if (Array.isArray(allowedRoles)) return allowedRoles.includes(role);
  return role === allowedRoles;
}

/**
 * Returns an express middleware that ensures authentication has run (via authMiddleware)
 * and checks that the user's role matches `role` (or admin).
 *
 * Usage:
 * router.post('/x', requireRoleMiddleware(authMiddleware, 'staff'), handler)
 *
 * If authMiddleware is missing the returned middleware will error (so dev notices).
 *
 * @param {Function} authMiddleware - your auth.middleware function
 * @param {String} role - required role (e.g. 'staff' or 'admin')
 * @returns {Function} express middleware
 */
function requireRoleMiddleware(authMiddleware, role = "staff") {
  if (typeof authMiddleware !== "function") {
    return (_req, _res, next) => {
      const err = new Error(
        "auth.middleware required but not provided to requireRoleMiddleware"
      );
      err.status = 500;
      return next(err);
    };
  }

  return function (req, res, next) {
    // Run auth middleware first if req.user not present
    const runCheck = () => {
      const userRole = req.user && (req.user.role || req.user.roles);
      if (!userRole) {
        return res.status(403).json({ error: "Forbidden (role missing)" });
      }
      if (userRole === role || userRole === "admin") return next();
      return res.status(403).json({ error: "Forbidden (insufficient role)" });
    };

    if (!req.user) {
      // invoke auth middleware (it should populate req.user or return 401)
      return authMiddleware(req, res, (err) => {
        if (err) return next(err);
        return runCheck();
      });
    }

    return runCheck();
  };
}

/**
 * Express middleware to validate staffAlias found in request (body/header/query).
 * Default looks in req.body.staffAlias, req.headers['x-staff-alias'], req.query.staffAlias.
 * Responds 400 if missing/invalid.
 *
 * @param {String} fieldName (optional) - body field name to validate (default: 'staffAlias')
 * @returns express middleware
 */
function ensureStaffAliasMiddleware(fieldName = "staffAlias") {
  return async function (req, res, next) {
    const rid = req.params && req.params.rid;
    const supplied =
      (req.body && req.body[fieldName]) ||
      req.headers["x-staff-alias"] ||
      (req.query && req.query[fieldName]);

    if (!supplied) {
      return res.status(400).json({ error: `${fieldName} required` });
    }

    const ok = await ensureStaffAliasValid(rid, supplied);
    if (!ok) return res.status(400).json({ error: "Invalid staffAlias" });
    // normalize into req.staffAlias for handlers
    req.staffAlias = supplied;
    return next();
  };
}

/**
 * Small response helpers (optional)
 */
function sendSuccess(res, data = null) {
  return res.json({ success: true, data, error: null });
}
function sendError(
  res,
  status = 400,
  code = "error",
  message = "An error occurred"
) {
  return res
    .status(status)
    .json({ success: false, data: null, error: { code, message } });
}

module.exports = {
  ensureStaffAliasValid,
  requestHasRole,
  requireRoleMiddleware,
  ensureStaffAliasMiddleware,
  sendSuccess,
  sendError,
};
