const { GoogleGenerativeAI } = require("@google/generative-ai");
const RedisCache = require("../common/libs/redisCache");

// Simple in-memory cache for Gemini responses (TTL: 24 hours)
const responseCache = new RedisCache({ stdTTL: 86400 });

/**
 * Generate a cache key from prompt
 */
function getCacheKey(prompt) {
  const crypto = require("crypto");
  return crypto.createHash("md5").update(prompt).digest("hex");
}

/**
 * Retry logic with exponential backoff
 * Handles 429 (rate limit) and 500-series errors
 */
async function generateContentWithRetry(model, prompt, maxRetries = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return await result.response.text();
    } catch (error) {
      lastError = error;

      const is429 =
        error.status === 429 ||
        error.message?.includes("429") ||
        error.message?.includes("Too Many Requests") ||
        error.message?.includes("RESOURCE_EXHAUSTED");

      const is500 = error.status >= 500;

      // Only retry on 429 or 5xx errors
      if (!is429 && !is500) {
        throw error;
      }

      // Last attempt - throw error
      if (attempt === maxRetries) {
        const err = new Error(
          is429
            ? "Gemini API rate limited. Please try again later."
            : "Gemini API temporarily unavailable. Please try again."
        );
        err.status = is429 ? 429 : 503;
        err.retryable = true;
        throw err;
      }

      // Exponential backoff with jitter
      // Attempt 1: 2-3 seconds
      // Attempt 2: 4-6 seconds
      // Attempt 3: 8-12 seconds
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitterAmount = baseDelay * 0.5;
      const delayMs = baseDelay + Math.random() * jitterAmount;

      console.warn(
        `[Gemini] Error on attempt ${attempt}/${maxRetries}: ${error.message}`
      );
      console.warn(`[Gemini] Retrying in ${Math.round(delayMs)}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Fallback (should not reach here)
  throw lastError || new Error("Gemini API error after maximum retries");
}

/**
 * Generate content with caching and retry logic
 */
async function generateContent(prompt, options = {}) {
  const { useCache = true, maxRetries = 3 } = options;

  // Check cache first
  if (useCache) {
    const cacheKey = getCacheKey(prompt);
    const cachedResponse = await responseCache.get(cacheKey);

    if (cachedResponse) {
      console.log("[Gemini] Cache hit for prompt");
      return {
        content: cachedResponse,
        cached: true,
      };
    }
  }

  // Get API key
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  // Development mode: Use mock response if API key missing or MOCK_GEMINI enabled
  if (!apiKey || process.env.MOCK_GEMINI === "true") {
    console.log("[Gemini] Using mock response (development mode)");
    const mockResponses = [
      "A delightful appetizer with fresh herbs and light dressing.",
      "Crispy on the outside, tender on the inside - a perfect balance of textures.",
      "Rich and savory with subtle notes of spice.",
      "Light and refreshing, perfect for a summer meal.",
      "A classic favorite made with premium ingredients.",
    ];
    const mockResponse =
      mockResponses[Math.floor(Math.random() * mockResponses.length)];

    if (useCache) {
      const cacheKey = getCacheKey(prompt);
      await responseCache.set(cacheKey, mockResponse);
    }

    return {
      content: mockResponse,
      cached: false,
      mock: true,
    };
  }

  // Initialize Gemini client
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  // Generate with retries
  const text = await generateContentWithRetry(model, prompt, maxRetries);

  // Cache the response
  if (useCache) {
    const cacheKey = getCacheKey(prompt);
    await responseCache.set(cacheKey, text);
  }

  return {
    content: text,
    cached: false,
  };
}

/**
 * Clear cache (useful for testing)
 */
async function clearCache() {
  await responseCache.flushAll();
}

/**
 * Get cache stats (for monitoring)
 */
async function getCacheStats() {
  return await responseCache.getStats();
}

module.exports = {
  generateContent,
  clearCache,
  getCacheStats,
};
