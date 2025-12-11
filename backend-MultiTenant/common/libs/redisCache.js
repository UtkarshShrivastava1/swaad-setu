// common/libs/redisCache.js
const { checkIdempotency, storeIdempotency } = require("../../db/redis");

/**
 * A cache implementation that uses the Redis idempotency functions.
 * This is compatible with the SimpleCache interface.
 */
class RedisCache {
  constructor(options = {}) {
    this.ttl = options.stdTTL || 86400; // Default: 24 hours
    this.stats = { hits: 0, misses: 0, "not-supported": 0 };
  }

  async set(key, value) {
    await storeIdempotency(key, value, this.ttl);
  }

  async get(key) {
    const value = await checkIdempotency(key);
    if (value) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    return value;
  }

  flushAll() {
    this.stats["not-supported"]++;
    // The mock redis doesn't support flushing, so this is a no-op.
    console.warn("RedisCache.flushAll() is not supported by the current mock");
  }

  getStats() {
    this.stats["not-supported"]++;
    // The mock redis doesn't support stats, so this is a no-op.
    return this.stats;
  }
}

module.exports = RedisCache;
