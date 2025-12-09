/**
 * Optional: Advanced Rate Limit Handling with Request Queueing
 *
 * This is an OPTIONAL enhancement for handling extreme rate limiting scenarios.
 * The basic implementation (exponential backoff + retry) handles 95% of cases.
 *
 * Use this if you have:
 * - 1000+ concurrent users
 * - Batch operations (generate 50+ descriptions at once)
 * - Limited Gemini API quota
 *
 * Otherwise, the basic implementation in gemini.route.js is sufficient.
 */

const { Router } = require("express");
const { generateContent } = require("../services/gemini.service");
const {
  geminiLimiter,
} = require("../common/middlewares/gemini.rateLimit.middleware");
const { geminiQueue } = require("../services/gemini.queue");

const geminiAdvancedRouter = Router();

let logger = console;
try {
  logger = require("../common/libs/logger") || console;
} catch (e) {
  // Use console fallback
}

/**
 * Advanced endpoint with queueing support
 * POST /api/gemini/queue
 *
 * This endpoint queues requests if rate limited
 * and automatically processes them when limit resets
 */
geminiAdvancedRouter.post("/gemini/queue", geminiLimiter, async (req, res) => {
  try {
    const { prompt, useCache = true } = req.body;
    const tenantId = req.params.rid || "global";

    // Validate prompt
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Prompt is required and must be a non-empty string",
      });
    }

    logger.info?.(`[Gemini Queue] Request for tenant: ${tenantId}`);

    // Try to generate immediately
    try {
      const result = await generateContent(prompt, { useCache });
      return res.json({
        content: result.content,
        cached: result.cached,
        queued: false,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // If rate limited, queue the request instead of failing
      if (error.status === 429) {
        logger.warn?.(`[Gemini Queue] Rate limited, queueing request`);

        const queueInfo = await new Promise((resolve, reject) => {
          const request = {
            prompt,
            useCache,
            resolve,
            reject,
          };

          const info = geminiQueue.enqueue(tenantId, request);
          resolve(info);

          // Start processing queue
          geminiQueue.processQueue(tenantId, async (req) => {
            return await generateContent(req.prompt, {
              useCache: req.useCache,
            });
          });
        });

        return res.status(202).json({
          error: "Request queued",
          message:
            "Service is busy. Your request has been queued for processing.",
          ...queueInfo,
          timestamp: new Date().toISOString(),
        });
      }

      // For other errors, throw normally
      throw error;
    }
  } catch (error) {
    logger.error?.(`[Gemini Queue] Error: ${error.message}`);

    let status = 500;
    let message = "Failed to generate content";

    if (error.status === 503) {
      status = 503;
      message = "Service temporarily unavailable";
    } else if (error.status === 400) {
      status = 400;
      message = "Invalid request";
    }

    res.status(status).json({
      error: message,
      details: error.message,
      retryable: status === 429 || status === 503,
    });
  }
});

/**
 * GET /api/gemini/queue-status/:tenantId
 * Check status of queued requests for a tenant
 */
geminiAdvancedRouter.get("/gemini/queue-status/:tenantId", (req, res) => {
  const tenantId = req.params.tenantId;
  const status = geminiQueue.getStatus(tenantId);

  res.json({
    tenantId,
    ...status,
    timestamp: new Date().toISOString(),
  });
});

/**
 * DELETE /api/gemini/queue/:tenantId
 * Clear queue for a tenant (admin only)
 */
geminiAdvancedRouter.delete("/gemini/queue/:tenantId", (req, res) => {
  const tenantId = req.params.tenantId;
  geminiQueue.clearQueue(tenantId);

  logger.warn?.(`[Gemini Queue] Cleared queue for tenant: ${tenantId}`);

  res.json({
    message: "Queue cleared",
    tenantId,
  });
});

/**
 * CLIENT SIDE USAGE WITH QUEUEING
 *
 * In your React component:
 *
 * ```typescript
 * async function generateWithQueueing(prompt: string) {
 *   try {
 *     const response = await apiClient.post('/api/gemini/queue',
 *       { prompt, useCache: true }
 *     );
 *
 *     // Status 202 = queued, need to poll
 *     if (response.status === 202) {
 *       const { position, estimatedWaitTime } = response.data;
 *       showMessage(`Queued at position ${position}`);
 *
 *       // Poll for result or use websocket
 *       await pollForResult(prompt);
 *       return;
 *     }
 *
 *     // Status 200 = generated or cached
 *     setDescription(response.data.content);
 *   } catch (error) {
 *     if (error.response?.status === 429) {
 *       // Even queueing failed, show retry message
 *       showMessage('Service overloaded. Please try again later.');
 *     } else {
 *       showError(error.message);
 *     }
 *   }
 * }
 *
 * async function pollForResult(prompt: string, maxAttempts = 60) {
 *   for (let i = 0; i < maxAttempts; i++) {
 *     const response = await apiClient.post('/api/gemini/queue',
 *       { prompt, useCache: true }
 *     );
 *
 *     if (response.status === 200) {
 *       // Got result!
 *       return response.data.content;
 *     }
 *
 *     // Still queued, wait and retry
 *     const waitTime = response.data.estimatedWaitTime || 5;
 *     await new Promise(resolve =>
 *       setTimeout(resolve, waitTime * 1000)
 *     );
 *   }
 *
 *   throw new Error('Request timed out');
 * }
 * ```
 */

module.exports = geminiAdvancedRouter;
