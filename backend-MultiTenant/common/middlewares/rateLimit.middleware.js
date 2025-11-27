const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit"); // REQUIRED for IPv6 safety

/**
 * Safe tenant-aware key generator
 * Uses express-rate-limit's official ipKeyGenerator internally.
 */
function tenantKey(req, res) {
  const rid = (req && req.params && req.params.rid) || "unknown";
  const ip = ipKeyGenerator(req, res); // safe for IPv4 + IPv6
  return `tenant:${rid}:rate:${ip}`;
}

/**
 * General API limiter — 200 req / 15 min
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: tenantKey,
});

/**
 * Sensitive limiter — 20 req / hr
 */
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many sensitive actions requested, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: tenantKey,
});

/**
 * Staff limiter — 50 req / 5 min
 */
const staffLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  message: "Too many staff actions from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: tenantKey,
});

// alias
const standardLimiter = apiLimiter;

module.exports = {
  apiLimiter,
  sensitiveLimiter,
  staffLimiter,
  standardLimiter,
};
