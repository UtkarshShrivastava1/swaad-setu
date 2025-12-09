/**
 * Queue system for managing Gemini requests during rate limiting
 * Allows clients to queue requests that will be processed when rate limit resets
 */

class GeminiRequestQueue {
  constructor() {
    this.queues = new Map(); // Map<tenantId, Array<request>>
    this.processing = new Map(); // Map<tenantId, boolean>
    this.retryTimers = new Map(); // Map<tenantId, timeout>
  }

  /**
   * Add a request to queue for a specific tenant
   */
  enqueue(tenantId, request) {
    if (!this.queues.has(tenantId)) {
      this.queues.set(tenantId, []);
    }

    const queue = this.queues.get(tenantId);
    const position = queue.length + 1;

    queue.push(request);

    console.log(
      `[GeminiQueue] Request queued for tenant ${tenantId} (position: ${position})`
    );

    return {
      queued: true,
      position,
      estimatedWaitTime: position * 2, // Rough estimate: 2s per request
    };
  }

  /**
   * Process queue for a tenant after rate limit resets
   */
  async processQueue(tenantId, processor) {
    if (this.processing.get(tenantId)) {
      return; // Already processing
    }

    const queue = this.queues.get(tenantId);
    if (!queue || queue.length === 0) {
      return;
    }

    this.processing.set(tenantId, true);

    try {
      while (queue.length > 0) {
        const request = queue.shift();

        try {
          // Process the request
          const result = await processor(request);
          request.resolve(result);
        } catch (error) {
          request.reject(error);

          // If rate limited again, re-queue remaining requests
          if (error.status === 429) {
            queue.unshift(request); // Put it back
            console.warn(
              `[GeminiQueue] Rate limited again, re-queuing ${queue.length} requests`
            );
            this.scheduleRetry(tenantId, processor);
            break;
          }
        }

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } finally {
      this.processing.set(tenantId, false);
    }
  }

  /**
   * Schedule retry after rate limit resets
   */
  scheduleRetry(tenantId, processor, delayMs = 60000) {
    // Clear any existing timer
    if (this.retryTimers.has(tenantId)) {
      clearTimeout(this.retryTimers.get(tenantId));
    }

    console.log(
      `[GeminiQueue] Scheduling retry for tenant ${tenantId} in ${delayMs}ms`
    );

    const timer = setTimeout(() => {
      this.processQueue(tenantId, processor);
      this.retryTimers.delete(tenantId);
    }, delayMs);

    this.retryTimers.set(tenantId, timer);
  }

  /**
   * Get queue status for a tenant
   */
  getStatus(tenantId) {
    const queue = this.queues.get(tenantId) || [];
    const isProcessing = this.processing.get(tenantId) || false;

    return {
      queueLength: queue.length,
      isProcessing,
      estimatedWaitTime: queue.length * 2,
    };
  }

  /**
   * Clear queue for a tenant
   */
  clearQueue(tenantId) {
    this.queues.delete(tenantId);
    this.processing.delete(tenantId);

    if (this.retryTimers.has(tenantId)) {
      clearTimeout(this.retryTimers.get(tenantId));
      this.retryTimers.delete(tenantId);
    }

    console.log(`[GeminiQueue] Cleared queue for tenant ${tenantId}`);
  }

  /**
   * Clear all queues
   */
  clearAll() {
    this.queues.clear();
    this.processing.clear();

    this.retryTimers.forEach((timer) => clearTimeout(timer));
    this.retryTimers.clear();

    console.log("[GeminiQueue] Cleared all queues");
  }
}

// Singleton instance
const geminiQueue = new GeminiRequestQueue();

module.exports = {
  geminiQueue,
  GeminiRequestQueue,
};
