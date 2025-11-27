const jwt = require("jsonwebtoken");
const config = require("../../config");

/**
 * Generate JWT token with mandatory multi-tenant fields
 * @param {Object} payload - must include restaurantId + role
 */
function generateToken(payload, options = {}) {
  if (!payload || typeof payload !== "object") {
    throw new Error("JWT payload must be an object");
  }

  if (!payload.restaurantId) {
    throw new Error("JWT payload missing restaurantId");
  }

  if (!payload.role) {
    throw new Error("JWT payload missing role");
  }

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: options.expiresIn || "1h",
    ...options,
  });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  const decoded = jwt.verify(token, config.JWT_SECRET);

  // sanity check: token must always contain restaurantId and role
  if (!decoded.restaurantId) {
    throw new Error("Invalid token: missing restaurantId");
  }

  if (!decoded.role) {
    throw new Error("Invalid token: missing role");
  }

  return decoded;
}

module.exports = {
  generateToken,
  verifyToken,
};
