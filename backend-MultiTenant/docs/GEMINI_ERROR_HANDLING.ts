/**
 * Frontend Error Handler for Gemini API Rate Limiting
 *
 * This file contains utilities to handle HTTP 429 errors from the Gemini API
 * gracefully on the client side (React/TypeScript).
 *
 * Usage in AddItemDrawer.tsx or similar component:
 *
 * import { handleGeminiError, retryWithExponentialBackoff } from '@/utils/geminiErrorHandler'
 *
 * Example:
 * ```
 * try {
 *   const response = await generateDescription(prompt);
 * } catch (error) {
 *   const handler = handleGeminiError(error);
 *   if (handler.shouldRetry) {
 *     showUserMessage(handler.userMessage);
 *     // Schedule retry with exponential backoff
 *     setTimeout(() => retry(), handler.suggestedRetryDelay);
 *   } else {
 *     showErrorMessage(handler.userMessage);
 *   }
 * }
 * ```
 */

// Error type definitions
interface GeminiErrorResponse {
  error: string;
  details?: string;
  retryable?: boolean;
  retryAfter?: number;
  cached?: boolean;
}

interface GeminiErrorHandler {
  shouldRetry: boolean;
  userMessage: string;
  suggestedRetryDelay: number;
  errorType: "rate-limit" | "server-error" | "invalid-request" | "unknown";
}

/**
 * Parse error response from Gemini API
 */
export function handleGeminiError(
  error: any,
  currentAttempt: number = 1,
  maxAttempts: number = 3
): GeminiErrorHandler {
  // Extract error details
  const status = error?.status || error?.response?.status;
  const errorData = error?.response?.data || error;
  const message =
    errorData?.error || errorData?.message || error?.message || "Unknown error";

  // Rate limit error (429)
  if (status === 429) {
    const retryAfter = errorData?.retryAfter || 60; // Default: 60 seconds

    return {
      shouldRetry: currentAttempt < maxAttempts,
      userMessage:
        "Gemini API is busy. Please wait a moment and try again. " +
        "The request has been queued and will be processed automatically.",
      suggestedRetryDelay: retryAfter * 1000,
      errorType: "rate-limit",
    };
  }

  // Server error (5xx)
  if (status >= 500) {
    return {
      shouldRetry: currentAttempt < maxAttempts,
      userMessage: "Gemini service is temporarily unavailable. Retrying...",
      suggestedRetryDelay: Math.pow(2, currentAttempt) * 1000, // Exponential backoff
      errorType: "server-error",
    };
  }

  // Invalid request (400)
  if (status === 400) {
    return {
      shouldRetry: false,
      userMessage:
        "Invalid request to Gemini API. Please try again with different input.",
      suggestedRetryDelay: 0,
      errorType: "invalid-request",
    };
  }

  // Network or unknown error
  return {
    shouldRetry: currentAttempt < maxAttempts,
    userMessage: "Connection error. Please check your internet and try again.",
    suggestedRetryDelay: 2000,
    errorType: "unknown",
  };
}

/**
 * Retry a function with exponential backoff
 *
 * Usage:
 * ```
 * const result = await retryWithExponentialBackoff(
 *   () => generateDescription(prompt),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, delay: number, error: any) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const exponentialDelay = initialDelay * Math.pow(2, attempt - 1);
      const jitteredDelay =
        exponentialDelay + Math.random() * exponentialDelay * 0.1;
      const delay = Math.min(jitteredDelay, maxDelay);

      // Call retry callback
      if (onRetry) {
        onRetry(attempt, delay, error);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Check if a request is from Gemini API by inspecting request URL
 */
export function isGeminiRequest(error: any): boolean {
  const url =
    error?.config?.url ||
    error?.response?.config?.url ||
    error?.request?.url ||
    "";

  return url.includes("/api/gemini") || error?.message?.includes("Gemini");
}

/**
 * Create user-friendly message for Gemini errors
 */
export function getGeminiErrorMessage(
  error: any,
  isRateLimited: boolean
): string {
  if (isRateLimited) {
    return (
      "Too many requests to description generator. " +
      "Please wait a moment and try again. " +
      "Your request will be processed when the service is available."
    );
  }

  const status = error?.response?.status;
  if (status >= 500) {
    return "Description service is temporarily unavailable. Please try again in a moment.";
  }

  return (
    "Unable to generate description at this time. " +
    "Please check your connection and try again."
  );
}

/**
 * Format retry timer display for UI
 * Usage: Display countdown in UI while waiting for retry
 */
export function formatRetryCountdown(seconds: number): string {
  if (seconds < 60) {
    return `Retrying in ${seconds}s...`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `Retrying in ${minutes}m...`;
}
