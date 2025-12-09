const { Router } = require("express");
const { generateContent } = require("../services/gemini.service");
const {
  geminiLimiter,
} = require("../common/middlewares/gemini.rateLimit.middleware");

const geminiRouter = Router();

// Logger fallback
let logger = console;
try {
  logger = require("../common/libs/logger") || console;
} catch (e) {
  // Use console as fallback
}

/**
 * POST /api/gemini
 * Generate content using Gemini API with rate limiting and caching
 *
 * Request body:
 * {
 *   "prompt": "Your prompt here",
 *   "useCache": true (optional, default: true)
 * }
 *
 * Response:
 * {
 *   "content": "Generated content",
 *   "cached": false,
 *   "timestamp": "2025-12-09T12:34:56Z"
 * }
 *
 * Error responses:
 * - 400: Invalid request (missing prompt)
 * - 429: Rate limited (too many requests)
 * - 500: Server error
 */
geminiRouter.post("/gemini", geminiLimiter, async (req, res) => {
  try {
    const { prompt, useCache = true } = req.body;

    // Validate prompt
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Prompt is required and must be a non-empty string",
      });
    }

    // Log the request
    logger.info?.(
      `[Gemini] Processing request for prompt (${prompt.length} chars)`
    );

    // Generate content with retries and caching
    const result = await generateContent(prompt, { useCache });

    // Return success response
    res.json({
      content: result.content,
      cached: result.cached,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error?.(`[Gemini] Error: ${error.message}`);

    // Determine HTTP status code
    let status = 500;
    let message = "Failed to generate content";

    if (error.status === 429) {
      status = 429;
      message = "Gemini API rate limit exceeded. Please try again later.";
    } else if (error.status === 503) {
      status = 503;
      message = "Gemini API temporarily unavailable. Please try again.";
    } else if (error.status === 400) {
      status = 400;
      message = "Invalid request to Gemini API";
    }

    res.status(status).json({
      error: message,
      details: error.message,
      retryable: error.retryable || status === 429 || status === 503,
      retryAfter: status === 429 ? 60 : undefined, // Suggest retry after 60 seconds for 429
    });
  }
});

module.exports = geminiRouter;
