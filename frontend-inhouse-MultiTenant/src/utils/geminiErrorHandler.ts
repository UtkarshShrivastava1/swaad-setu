/**
 * Gemini Error Handler & User Feedback Utilities
 * Provides user-friendly error messages and retry logic
 *
 * Features:
 * - Error code to message translation
 * - Retry suggestions with exponential backoff
 * - Queue position feedback
 * - Cache status indication
 * - Console logging with context
 */

import type { GeminiResponse } from "./geminiRateLimitManager";

export interface ErrorFeedback {
  userMessage: string; // What to show the user
  technicalMessage: string; // For console logs
  severity: "error" | "warning" | "info"; // For styling
  isRetryable: boolean; // Can be retried
  suggestedRetryDelayMs?: number; // When to retry
  action?: string; // Suggested action for user
}

/**
 * Translate API response to user-friendly feedback
 */
export function handleGeminiError(response: GeminiResponse): ErrorFeedback {
  const errorCode = response.errorCode || "UNKNOWN_ERROR";

  // Rate limited - queued
  if (errorCode === "RATE_LIMITED" && response.isQueued) {
    return {
      userMessage: `🔄 Your request is queued. You'll be notified when it's ready. (${
        response.queuePosition || "?"
      } ahead)`,
      technicalMessage: `Rate limited (429). Queued at position ${
        response.queuePosition
      }. Retry after ${response.retryAfter || 60}s`,
      severity: "info",
      isRetryable: true,
      suggestedRetryDelayMs: ((response.retryAfter || 60) + 5) * 1000, // Add 5s buffer
    };
  }

  // Queued request failed
  if (errorCode === "QUEUED_REQUEST_FAILED") {
    return {
      userMessage:
        "❌ Request timeout. Please try again or describe the item manually.",
      technicalMessage: `Queued request failed: ${response.error}`,
      severity: "error",
      isRetryable: true,
      suggestedRetryDelayMs: 5000,
      action: "Retry or describe manually",
    };
  }

  // Rate limited on direct call
  if (response.statusCode === 429) {
    return {
      userMessage: `⏳ Restaurant is busy generating descriptions. Try again in ${
        response.retryAfter || 60
      } seconds.`,
      technicalMessage: `Direct API call rate limited (429). Retry after ${
        response.retryAfter || 60
      }s`,
      severity: "warning",
      isRetryable: true,
      suggestedRetryDelayMs: ((response.retryAfter || 60) + 2) * 1000, // Add 2s buffer
      action: "Wait then retry",
    };
  }

  // Service unavailable (503)
  if (response.statusCode === 503) {
    return {
      userMessage:
        "🔧 Google AI service is temporarily unavailable. Try again in a few moments.",
      technicalMessage: "Google AI service temporarily unavailable (503)",
      severity: "warning",
      isRetryable: true,
      suggestedRetryDelayMs: 30000, // Wait 30s before retry
      action: "Retry later",
    };
  }

  // Missing tenant
  if (errorCode === "MISSING_TENANT") {
    return {
      userMessage: "❌ Unable to identify restaurant. Please log in again.",
      technicalMessage: "Missing tenant ID for Gemini request",
      severity: "error",
      isRetryable: false,
      action: "Log out and log back in",
    };
  }

  // Empty prompt
  if (errorCode === "EMPTY_PROMPT") {
    return {
      userMessage: "❌ Please enter an item name to generate description.",
      technicalMessage: "Empty prompt provided to Gemini",
      severity: "error",
      isRetryable: false,
      action: "Enter item name",
    };
  }

  // Invalid token / auth error
  if (response.statusCode === 401 || response.statusCode === 403) {
    return {
      userMessage: "❌ Authentication error. Please log in again to continue.",
      technicalMessage: `Authentication error: ${response.error}`,
      severity: "error",
      isRetryable: false,
      action: "Log in again",
    };
  }

  // Bad request (400)
  if (response.statusCode === 400) {
    return {
      userMessage: "❌ Invalid request. Please describe the item manually.",
      technicalMessage: `Bad request (400): ${response.error}`,
      severity: "error",
      isRetryable: false,
      action: "Describe manually",
    };
  }

  // Server error (500)
  if (response.statusCode === 500) {
    return {
      userMessage:
        "⚠️ Server error occurred. Try again or describe the item manually.",
      technicalMessage: `Server error (500): ${response.error}`,
      severity: "error",
      isRetryable: true,
      suggestedRetryDelayMs: 5000,
      action: "Retry or describe manually",
    };
  }

  // Network error (no status code)
  if (!response.statusCode) {
    return {
      userMessage: "📡 Network error. Check your connection and try again.",
      technicalMessage: `Network error: ${response.error}`,
      severity: "error",
      isRetryable: true,
      suggestedRetryDelayMs: 3000,
      action: "Check connection and retry",
    };
  }

  // Unknown error
  return {
    userMessage:
      "❌ Unable to generate description. Please describe the item manually.",
    technicalMessage: `Unknown error: ${response.error} (${response.statusCode})`,
    severity: "error",
    isRetryable: true,
    suggestedRetryDelayMs: 5000,
    action: "Describe manually or retry",
  };
}

/**
 * Retry with exponential backoff
 * @param fn Function to retry
 * @param maxAttempts Maximum retry attempts
 * @param initialDelayMs Initial delay in milliseconds
 * @param onRetry Callback when retrying
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelayMs: number = 1000,
  onRetry?: (attempt: number, nextDelayMs: number, error: Error) => void
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `[Gemini] Attempt ${attempt}/${maxAttempts}: Calling Gemini...`
      );
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[Gemini] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < maxAttempts) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        console.log(
          `[Gemini] Retrying in ${delayMs}ms (exponential backoff)...`
        );

        if (onRetry) {
          onRetry(attempt, delayMs, lastError);
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error(`Failed after ${maxAttempts} attempts`);
}

/**
 * Format queue position feedback
 */
export function getQueueFeedback(queuePosition?: number): string {
  if (!queuePosition) return "";

  if (queuePosition === 1) {
    return "📊 You're next in queue!";
  }
  if (queuePosition <= 5) {
    return `📊 ${queuePosition} items ahead in queue`;
  }
  return `📊 Queue position: ${queuePosition}`;
}

/**
 * Format cache feedback
 */
export function getCacheFeedback(fromCache?: boolean): string {
  if (fromCache) {
    return "⚡ (From cache - instant!)";
  }
  return "";
}

/**
 * Log gemini operation with context
 */
export function logGeminiOperation(
  operation: string,
  details?: unknown,
  level: "log" | "warn" | "error" = "log"
): void {
  const timestamp = new Date().toLocaleTimeString();
  const message = `[Gemini ${timestamp}] ${operation}`;

  if (level === "error") {
    console.error(message, details);
  } else if (level === "warn") {
    console.warn(message, details);
  } else {
    console.log(message, details);
  }
}

/**
 * Get countdown text for retry
 */
export function getRetryCountdownText(remainingMs: number): {
  text: string;
  seconds: number;
} {
  const seconds = Math.ceil(remainingMs / 1000);
  const text = `Retry in ${seconds}s...`;
  return { text, seconds };
}

/**
 * Validate if response indicates success
 */
export function isSuccessResponse(response: GeminiResponse): boolean {
  return response.success && !!response.content;
}

/**
 * Validate if error is due to rate limiting
 */
export function isRateLimitError(response: GeminiResponse): boolean {
  return (
    response.statusCode === 429 ||
    response.errorCode === "RATE_LIMITED" ||
    response.isQueued === true
  );
}

/**
 * Validate if error is retryable
 */
export function isRetryableError(response: GeminiResponse): boolean {
  const feedback = handleGeminiError(response);
  return feedback.isRetryable;
}

export default {
  handleGeminiError,
  retryWithExponentialBackoff,
  getQueueFeedback,
  getCacheFeedback,
  logGeminiOperation,
  getRetryCountdownText,
  isSuccessResponse,
  isRateLimitError,
  isRetryableError,
};
