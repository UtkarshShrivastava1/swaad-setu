const jwt = require("jsonwebtoken");
const config = require("../../config");

/**
 * Validate JWT_SECRET is configured
 */
function ensureJWTSecretConfigured() {
  if (!config.JWT_SECRET || !config.JWT_SECRET.trim()) {
    throw new Error(
      "JWT_SECRET environment variable is not configured. " +
        "Set JWT_SECRET in .env file. " +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
}

/**
 * Generate JWT token with mandatory multi-tenant fields
 * @param {Object} payload - must include restaurantId + role
 */
function generateToken(payload, options = {}) {
  // Ensure JWT is configured
  ensureJWTSecretConfigured();

  if (!payload || typeof payload !== "object") {
    throw new Error("JWT payload must be an object");
  }

  if (!payload.restaurantId) {
    throw new Error("JWT payload missing restaurantId");
  }

  if (!payload.role) {
    throw new Error("JWT payload missing role");
  }

  try {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: options.expiresIn || "1h",
      ...options,
    });
  } catch (error) {
    const errorMsg = `Failed to generate JWT token: ${error.message}`;
    console.error("[JWT] " + errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Verify JWT token with detailed error handling
 */
function verifyToken(token) {
  // Ensure JWT is configured
  ensureJWTSecretConfigured();

  if (!token || typeof token !== "string") {
    throw new Error("Invalid token: token must be a non-empty string");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    // Provide specific error messages for common JWT errors
    if (error.name === "TokenExpiredError") {
      const err = new Error(`Token expired at ${error.expiredAt}`);
      err.code = "TOKEN_EXPIRED";
      err.expiredAt = error.expiredAt;
      throw err;
    }

    if (error.name === "JsonWebTokenError") {
      if (error.message.includes("invalid signature")) {
        throw new Error(
          "Invalid token signature. Token may have been tampered with or generated with different secret."
        );
      }
      if (error.message.includes("malformed")) {
        throw new Error("Malformed token. Token format is invalid.");
      }
    }

    // Generic JWT error
    const err = new Error(`Invalid token: ${error.message}`);
    err.code = "INVALID_TOKEN";
    throw err;
  }

  // Sanity check: token must always contain restaurantId and role
  if (!decoded.restaurantId) {
    throw new Error("Invalid token: missing restaurantId claim");
  }

  if (!decoded.role) {
    throw new Error("Invalid token: missing role claim");
  }

  return decoded;
}

module.exports = {
  generateToken,
  verifyToken,
  ensureJWTSecretConfigured,
};
