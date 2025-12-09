// config/index.js
require("dotenv").config();

const env = (name, fallback) => {
  const v = process.env[name];
  return typeof v === "undefined" ? fallback : v;
};

const parseIntEnv = (name, fallback) => {
  const v = env(name);
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

const parseBoolEnv = (name, fallback) => {
  const v = env(name);
  if (!v) return fallback;
  return /^(1|true|yes)$/i.test(String(v).trim());
};

// -------------------------------------------------------------
// Core configuration
// -------------------------------------------------------------
const NODE_ENV = env("NODE_ENV", "development");
const IS_PROD = NODE_ENV === "production";

const config = {
  nodeEnv: NODE_ENV,
  isProduction: IS_PROD,

  // DB
  MONGO_URI:
    env("MONGO_URI") ||
    env("MONGO_URI") ||
    "mongodb://127.0.0.1:27017/swadsetu",

  // Redis
  REDIS_URL: env("REDIS_URL", null),
  REDIS_HOST: env("REDIS_HOST", "127.0.0.1"),
  REDIS_PORT: parseIntEnv("REDIS_PORT", 6379),
  REDIS_PASSWORD: env("REDIS_PASSWORD", null),

  PORT: parseIntEnv("PORT", 5001),

  // Security
  JWT_SECRET: env("JWT_SECRET", ""),
  BCRYPT_ROUNDS: parseIntEnv("BCRYPT_ROUNDS", 10),

  // Tokens
  OVERRIDE_TOKEN_TTL_MIN: parseIntEnv("OVERRIDE_TOKEN_TTL_MIN", 10),

  // Business defaults
  SESSION_TTL_MS: parseIntEnv("SESSION_TTL_MS", 1000 * 60 * 60),
  SERVICE_CHARGE_DEFAULT: parseIntEnv("SERVICE_CHARGE_DEFAULT", 0),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseIntEnv("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  RATE_LIMIT_MAX: parseIntEnv("RATE_LIMIT_MAX", 100),

  // Logging
  LOG_LEVEL: env("LOG_LEVEL", "info"),

  // Feature flags
  STAFF_ALIAS_STRICT: parseBoolEnv("STAFF_ALIAS_STRICT", false),

  // App identity
  APP_NAME: env("APP_NAME", "Swad Setu"),
};

// Build redis URL automatically
if (!config.REDIS_URL) {
  const pass = config.REDIS_PASSWORD
    ? `:${encodeURIComponent(config.REDIS_PASSWORD)}@`
    : "";
  config.REDIS_URL = `redis://${pass}${config.REDIS_HOST}:${config.REDIS_PORT}`;
}

// -------------------------------------------------------------
// Validation
// -------------------------------------------------------------
function validate(throwOnError = true) {
  const errors = [];

  if (!config.MONGO_URI) errors.push("MONGO_URI is required");
  if (!config.JWT_SECRET.trim()) errors.push("JWT_SECRET is required");

  if (IS_PROD) {
    if (config.BCRYPT_ROUNDS < 10) {
      errors.push("BCRYPT_ROUNDS should be >= 10 in production");
    }
    if (!config.REDIS_URL) {
      errors.push("REDIS_URL should be configured in production");
    }
  }

  if (errors.length) {
    const msg = "Configuration validation failed:\n - " + errors.join("\n - ");
    if (throwOnError) throw new Error(msg);
    console.error(msg);
  }

  return true;
}

module.exports = { ...config, validate };
