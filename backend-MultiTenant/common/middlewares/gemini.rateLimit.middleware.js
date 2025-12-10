const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit"); // REQUIRED for IPv6 safety

/**
 * Safe tenant-aware key generator
 * Uses express-rate-limit's official ipKeyGenerator internally.
 */
function tenantKey(req, res) {
  const rid = (req && req.params && req.params.rid) || "unknown";
  const ip = ipKeyGenerator(req, res); // safe for IPv4 + IPv6
  return `tenant:${rid}:gemini:${ip}`;
}

/**
 * Gemini-specific rate limiter
 * Gemini free tier: 60 requests per minute globally
 * We set local limit higher to allow testing; Gemini service handles global limit with retries
 */
const geminiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute PER TENANT (local limit, Gemini has 60/min global)
  message: "Gemini API rate limit exceeded. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: tenantKey,
  skip: (req, res) => {
    // Don't apply rate limit on non-POST requests
    return req.method !== "POST";
  },
  handler: (req, res, next, options) => {
    res.status(429).json({
      error: "Rate limit exceeded",
      message: options.message,
      retryAfter: req.rateLimit?.resetTime
        ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        : 60,
    });
  },
});

module.exports = {
  geminiLimiter,
};
