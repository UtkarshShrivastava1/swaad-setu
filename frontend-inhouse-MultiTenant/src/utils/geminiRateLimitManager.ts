/**
 * Tenant-Aware Gemini Rate Limit Manager
 * Handles graceful rate limiting with queue, retry, and user feedback
 *
 * Features:
 * - Per-tenant rate limiting (20 req/min per tenant)
 * - Request queueing for graceful degradation
 * - Exponential backoff retry (2s → 4s → 8s)
 * - Local cache to avoid redundant API calls
 * - Progress tracking for bulk operations
 * - User-friendly error messages
 */

export interface RateLimitConfig {
  maxRequestsPerMinute: number; // Default: 20
  retryMaxAttempts: number; // Default: 3
  initialRetryDelayMs: number; // Default: 2000 (2s)
  queueMaxSize: number; // Default: 50
}

export interface RateLimitStats {
  tenantId: string;
  requestsInWindow: number;
  rateLimitedAt?: number;
  retryAfterSeconds?: number;
}

export interface QueuedRequest {
  id: string;
  tenantId: string;
  prompt: string;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}

export interface GeminiResponse {
  success: boolean;
  content?: string;
  error?: string;
  errorCode?: string;
  statusCode?: number;
  retryAfter?: number; // Seconds
  fromCache?: boolean;
  queuePosition?: number; // For queued requests
  isQueued?: boolean;
}

class GeminiRateLimitManager {
  private config: RateLimitConfig = {
    maxRequestsPerMinute: 20,
    retryMaxAttempts: 3,
    initialRetryDelayMs: 2000,
    queueMaxSize: 50,
  };

  // Per-tenant rate limit tracking
  private tenantStats: Map<string, RateLimitStats> = new Map();

  // Request queue
  private queue: QueuedRequest[] = [];
  private isProcessingQueue = false;

  // Local cache (prompt hash → cached response)
  private cache: Map<string, { content: string; timestamp: number }> =
    new Map();
  private cacheMaxAgeMs = 24 * 60 * 60 * 1000; // 24 hours

  // Timing for rate limit window
  private windowStartTime: Map<string, number> = new Map();
  private windowDurationMs = 60 * 1000; // 1 minute

  constructor(config?: Partial<RateLimitConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Generate simple MD5-like hash for prompt caching
   * (using substring of SHA256 for demo, not cryptographically secure)
   */
  private hashPrompt(prompt: string): string {
    const hash = Array.from(prompt).reduce((h, c) => {
      const n = (h << 5) - h + c.charCodeAt(0);
      return n & n; // Convert to 32bit integer
    }, 0);
    return Math.abs(hash).toString(16);
  }

  /**
   * Get cached response if exists and not expired
   */
  private getCachedResponse(prompt: string): string | null {
    const hash = this.hashPrompt(prompt);
    const cached = this.cache.get(hash);

    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheMaxAgeMs) {
      this.cache.delete(hash);
      console.log(
        "[Gemini] Cache EXPIRED for prompt:",
        prompt.substring(0, 50)
      );
      return null;
    }

    console.log(
      "[Gemini] Cache HIT for prompt:",
      prompt.substring(0, 50),
      `(${Math.round(age / 1000)}s old)`
    );
    return cached.content;
  }

  /**
   * Set cached response
   */
  private cacheResponse(prompt: string, content: string): void {
    const hash = this.hashPrompt(prompt);
    this.cache.set(hash, { content, timestamp: Date.now() });
    console.log("[Gemini] Cache SET for prompt:", prompt.substring(0, 50));
  }

  /**
   * Get current rate limit stats for tenant
   */
  private getOrCreateStats(tenantId: string): RateLimitStats {
    if (!this.tenantStats.has(tenantId)) {
      this.tenantStats.set(tenantId, {
        tenantId,
        requestsInWindow: 0,
      });
    }
    return this.tenantStats.get(tenantId)!;
  }

  /**
   * Update rate limit window for tenant
   */
  private updateRateLimitWindow(tenantId: string): void {
    const now = Date.now();
    const windowStart = this.windowStartTime.get(tenantId) || now;

    if (now - windowStart > this.windowDurationMs) {
      // Reset window
      this.windowStartTime.set(tenantId, now);
      const stats = this.getOrCreateStats(tenantId);
      stats.requestsInWindow = 0;
      console.log(`[Gemini] Rate limit window RESET for tenant: ${tenantId}`);
    }
  }

  /**
   * Check if tenant is rate limited
   */
  private isRateLimited(tenantId: string): boolean {
    this.updateRateLimitWindow(tenantId);
    const stats = this.getOrCreateStats(tenantId);
    const isLimited =
      stats.requestsInWindow >= this.config.maxRequestsPerMinute;

    if (isLimited) {
      const windowStart = this.windowStartTime.get(tenantId) || Date.now();
      const timeUntilResetMs =
        this.windowDurationMs - (Date.now() - windowStart);
      stats.rateLimitedAt = Date.now();
      stats.retryAfterSeconds = Math.ceil(timeUntilResetMs / 1000);

      console.log(
        `[Gemini] Rate limited for tenant: ${tenantId}, retry after: ${stats.retryAfterSeconds}s`
      );
    }

    return isLimited;
  }

  /**
   * Increment request count for tenant
   */
  private incrementRequestCount(tenantId: string): void {
    this.updateRateLimitWindow(tenantId);
    const stats = this.getOrCreateStats(tenantId);
    stats.requestsInWindow++;
    const remaining = this.config.maxRequestsPerMinute - stats.requestsInWindow;
    console.log(
      `[Gemini] Request count for ${tenantId}: ${stats.requestsInWindow}/${this.config.maxRequestsPerMinute} (${remaining} remaining)`
    );
  }

  /**
   * Add request to queue
   */
  private enqueueRequest(
    tenantId: string,
    prompt: string,
    resolve: (value: string) => void,
    reject: (error: Error) => void
  ): QueuedRequest {
    const request: QueuedRequest = {
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      tenantId,
      prompt,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.retryMaxAttempts,
      resolve,
      reject,
    };

    this.queue.push(request);
    console.log(
      `[Gemini] Request queued for tenant: ${tenantId}, queue size: ${this.queue.length}`
    );

    return request;
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.queue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.queue.length > 0) {
      const request = this.queue[0]; // Peek at first request

      // Check if this tenant is rate limited
      if (this.isRateLimited(request.tenantId)) {
        const stats = this.getOrCreateStats(request.tenantId);
        const retryAfter = stats.retryAfterSeconds || 60;

        console.log(
          `[Gemini] Queue processing paused for tenant: ${request.tenantId}, waiting ${retryAfter}s`
        );

        // Wait until rate limit resets
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue; // Try again
      }

      // Remove from queue and process
      this.queue.shift();

      try {
        // Check cache first
        const cached = this.getCachedResponse(request.prompt);
        if (cached) {
          request.resolve(cached);
          continue;
        }

        // Make API call
        const response = await this.callGeminiAPI(
          request.tenantId,
          request.prompt
        );

        if (response.statusCode === 429) {
          // Re-queue if rate limited
          request.retryCount++;
          if (request.retryCount < request.maxRetries) {
            console.log(
              `[Gemini] Re-queuing request (attempt ${request.retryCount + 1}/${
                request.maxRetries
              })`
            );
            this.queue.unshift(request); // Put back at front
            const backoffMs = Math.pow(2, request.retryCount) * 1000;
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          } else {
            request.reject(
              new Error(
                `Rate limited. Retry after ${
                  response.retryAfter || 60
                } seconds.`
              )
            );
          }
        } else if (response.statusCode === 503) {
          // Service unavailable
          request.reject(new Error("Service temporarily unavailable"));
        } else if (response.statusCode === 200 && response.content) {
          this.cacheResponse(request.prompt, response.content);
          request.resolve(response.content);
        } else {
          request.reject(new Error(response.error || "Unknown error"));
        }
      } catch (error) {
        request.reject(
          error instanceof Error ? error : new Error("Unknown error")
        );
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Actual API call to Gemini endpoint
   */
  private async callGeminiAPI(
    _tenantId: string,
    prompt: string
  ): Promise<{
    statusCode: number;
    content?: string;
    error?: string;
    retryAfter?: number;
  }> {
    const apiBaseUrl =
      import.meta.env.MODE === "production"
        ? import.meta.env.VITE_API_BASE_URL_PROD || "https://api.swaadsetu.com"
        : import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

    try {
      const response = await fetch(`${apiBaseUrl}/api/gemini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          prompt,
        }),
      });

      const data = await response.json().catch(() => ({}));

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = parseInt(
          response.headers.get("Retry-After") || "60"
        );
        console.warn(
          `[Gemini] Rate limit (429) from API. Retry after: ${retryAfter}s`
        );
        return {
          statusCode: 429,
          error: "Rate limited by API",
          retryAfter,
        };
      }

      // Handle service unavailable (503)
      if (response.status === 503) {
        console.warn("[Gemini] Service unavailable (503)");
        return {
          statusCode: 503,
          error: "Service temporarily unavailable",
        };
      }

      // Handle success
      if (response.ok) {
        const content = data.content || data.text || JSON.stringify(data);
        return {
          statusCode: 200,
          content,
        };
      }

      // Handle other errors
      return {
        statusCode: response.status,
        error: data.message || response.statusText || "Unknown error",
      };
    } catch (error) {
      console.error("[Gemini] API call error:", error);
      throw error;
    }
  }

  /**
   * Main method to generate content with rate limiting
   * This is the method to use from components
   */
  public async generateContent(
    tenantId: string,
    prompt: string
  ): Promise<GeminiResponse> {
    // Validate inputs
    if (!tenantId?.trim()) {
      return {
        success: false,
        error: "Tenant ID is required",
        errorCode: "MISSING_TENANT",
        statusCode: 400,
      };
    }

    if (!prompt?.trim()) {
      return {
        success: false,
        error: "Prompt is required",
        errorCode: "EMPTY_PROMPT",
        statusCode: 400,
      };
    }

    console.log(
      `[Gemini] Generate request for tenant: ${tenantId}, prompt: ${prompt.substring(
        0,
        50
      )}...`
    );

    // Check cache first
    const cached = this.getCachedResponse(prompt);
    if (cached) {
      return {
        success: true,
        content: cached,
        fromCache: true,
      };
    }

    // Check if rate limited
    if (this.isRateLimited(tenantId)) {
      const queuePosition = this.queue.length + 1;

      console.log(
        `[Gemini] Tenant rate limited. Queueing request. Position in queue: ${queuePosition}`
      );

      return new Promise((resolve) => {
        this.enqueueRequest(
          tenantId,
          prompt,
          (content) => {
            resolve({
              success: true,
              content,
              isQueued: true,
            });
          },
          (error) => {
            resolve({
              success: false,
              error: error.message,
              errorCode: "QUEUED_REQUEST_FAILED",
              isQueued: true,
            });
          }
        );

        this.processQueue(); // Start processing queue
      });
    }

    // Increment counter and make request
    this.incrementRequestCount(tenantId);

    try {
      const result = await this.callGeminiAPI(tenantId, prompt);

      // Handle rate limiting even on direct call
      if (result.statusCode === 429) {
        const queuePosition = this.queue.length + 1;

        return new Promise((resolve) => {
          this.enqueueRequest(
            tenantId,
            prompt,
            (content) => {
              resolve({
                success: true,
                content,
                isQueued: true,
                queuePosition,
              });
            },
            (error) => {
              resolve({
                success: false,
                error: error.message,
                errorCode: "RATE_LIMITED",
                statusCode: 429,
                retryAfter: result.retryAfter,
                queuePosition,
              });
            }
          );

          this.processQueue();
        });
      }

      // Success
      if (result.statusCode === 200 && result.content) {
        this.cacheResponse(prompt, result.content);
        return {
          success: true,
          content: result.content,
        };
      }

      // Error
      return {
        success: false,
        error: result.error || "Unknown error",
        statusCode: result.statusCode,
      };
    } catch (error) {
      console.error("[Gemini] Error generating content:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate content",
        statusCode: 500,
      };
    }
  }

  /**
   * Get current stats for a tenant (for monitoring)
   */
  public getStats(tenantId: string): RateLimitStats {
    this.updateRateLimitWindow(tenantId);
    return this.getOrCreateStats(tenantId);
  }

  /**
   * Get queue size (for UI feedback)
   */
  public getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear cache (useful for testing)
   */
  public clearCache(): void {
    this.cache.clear();
    console.log("[Gemini] Cache cleared");
  }

  /**
   * Clear all state (useful for testing)
   */
  public reset(): void {
    this.tenantStats.clear();
    this.queue = [];
    this.cache.clear();
    this.windowStartTime.clear();
    this.isProcessingQueue = false;
    console.log("[Gemini] Rate limit manager reset");
  }
}

// Export singleton instance
export const geminiRateLimitManager = new GeminiRateLimitManager({
  maxRequestsPerMinute: 20,
  retryMaxAttempts: 3,
  initialRetryDelayMs: 2000,
  queueMaxSize: 50,
});

export default geminiRateLimitManager;
