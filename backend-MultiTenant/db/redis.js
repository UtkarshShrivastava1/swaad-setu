// db/redis.js - in-memory dev stub (NOT for production)
const EventEmitter = require("events");
const logger = require("../common/libs/logger"); // Assuming logger is available

// Create a single, shared event emitter for the entire application.
// This prevents issues where different parts of the app might get separate instances
// due to module caching complexities.
if (!global.swaadSetuEmitter) {
  global.swaadSetuEmitter = new EventEmitter();
  logger.info("[RedisStub] Initialized global.swaadSetuEmitter (in-memory stub).");
} else {
  logger.info("[RedisStub] Re-using existing global.swaadSetuEmitter.");
}


const emitter = global.swaadSetuEmitter;

const idempotencyStore = new Map(); // key -> { value, expiresAt }
const locks = new Map(); // key -> token (simple)

function publishEvent(channel, message) {
  logger.info(`[RedisStub] publishEvent called: Channel - ${channel}, Event - ${message?.event || JSON.stringify(message)}`);
  // Asynchronous publish to emulate Redis pub/sub
  // The socket service bridge listens for the "event" event.
  setImmediate(() => emitter.emit("event", channel, message));
  return Promise.resolve(true);
}

async function checkIdempotency(key) {
  const entry = idempotencyStore.get(key);
  logger.debug(`[RedisStub] checkIdempotency called for key: ${key}, Found: ${!!entry}`);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    idempotencyStore.delete(key);
    logger.debug(`[RedisStub] Idempotency key ${key} expired and deleted.`);
    return null;
  }
  logger.debug(`[RedisStub] Idempotency key ${key} found and active.`);
  return entry.value;
}

async function storeIdempotency(key, value, ttlSec = 24 * 3600) {
  const expiresAt = Date.now() + ttlSec * 1000;
  idempotencyStore.set(key, { value, expiresAt });
  logger.debug(`[RedisStub] Idempotency key ${key} stored with TTL: ${ttlSec}s.`);
  return true;
}

// Simple lock: returns true if acquired, false otherwise
async function acquireLock(key, ttlMs = 5000) {
  logger.debug(`[RedisStub] acquireLock called for key: ${key}, TTL: ${ttlMs}ms.`);
  if (locks.has(key)) {
    logger.debug(`[RedisStub] Lock ${key} already held.`);
    return false;
  }
  locks.set(key, Date.now() + ttlMs);
  logger.debug(`[RedisStub] Lock ${key} acquired.`);
  // auto-release after ttl
  setTimeout(() => {
    const v = locks.get(key);
    if (v && v <= Date.now()) {
      locks.delete(key);
      logger.debug(`[RedisStub] Lock ${key} auto-released.`);
    }
  }, ttlMs + 50);
  return true;
}

async function releaseLock(key) {
  logger.debug(`[RedisStub] releaseLock called for key: ${key}.`);
  if (locks.has(key)) {
    locks.delete(key);
    logger.debug(`[RedisStub] Lock ${key} released.`);
    return true;
  }
  logger.debug(`[RedisStub] Lock ${key} not held.`);
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
