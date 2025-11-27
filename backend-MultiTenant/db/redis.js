// db/redis.js - in-memory dev stub (NOT for production)
const EventEmitter = require("events");
const emitter = new EventEmitter();

const idempotencyStore = new Map(); // key -> { value, expiresAt }
const locks = new Map(); // key -> token (simple)

function publishEvent(channel, message) {
  // Asynchronous publish to emulate Redis pub/sub
  setImmediate(() => emitter.emit(channel, message));
  return Promise.resolve(true);
}

async function checkIdempotency(key) {
  const entry = idempotencyStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    idempotencyStore.delete(key);
    return null;
  }
  return entry.value;
}

async function storeIdempotency(key, value, ttlSec = 24 * 3600) {
  const expiresAt = Date.now() + ttlSec * 1000;
  idempotencyStore.set(key, { value, expiresAt });
  return true;
}

// Simple lock: returns true if acquired, false otherwise
async function acquireLock(key, ttlMs = 5000) {
  if (locks.has(key)) return false;
  locks.set(key, Date.now() + ttlMs);
  // auto-release after ttl
  setTimeout(() => {
    const v = locks.get(key);
    if (v && v <= Date.now()) locks.delete(key);
  }, ttlMs + 50);
  return true;
}

async function releaseLock(key) {
  if (locks.has(key)) {
    locks.delete(key);
    return true;
  }
  return false;
}

module.exports = {
  publishEvent,
  checkIdempotency,
  storeIdempotency,
  acquireLock,
  releaseLock,
  // expose emitter for local listeners
  emitter,
};
