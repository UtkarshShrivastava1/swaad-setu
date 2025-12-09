/**
 * Hook for bulk menu item description generation
 * Handles multiple items with rate limit awareness
 *
 * Features:
 * - Queue multiple items for description generation
 * - Track progress per item
 * - Handle rate limiting gracefully
 * - Provide user feedback during bulk operations
 */

import { useCallback, useRef, useState } from "react";
import { generateContentWithRateLimit } from "../../../api/gemini.api";
import { handleGeminiError } from "../../../utils/geminiErrorHandler";

export interface BulkGenerationTask {
  id: string;
  itemName: string;
  status: "pending" | "generating" | "success" | "error" | "queued";
  description?: string;
  error?: string;
  queuePosition?: number;
  fromCache?: boolean;
}

export interface BulkGenerationProgress {
  totalItems: number;
  completedItems: number;
  errorItems: number;
  queuedItems: number;
  currentlyGenerating: string | null;
  tasks: BulkGenerationTask[];
  progressPercent: number;
  isComplete: boolean;
}

interface UseBulkGenerationOptions {
  maxConcurrentRequests?: number;
  onProgressUpdate?: (progress: BulkGenerationProgress) => void;
}

export function useBulkGenerateDescriptions(
  tenantId: string,
  options?: UseBulkGenerationOptions
) {
  const maxConcurrent = options?.maxConcurrentRequests || 1;
  const onProgressUpdate = options?.onProgressUpdate;

  const [tasks, setTasks] = useState<BulkGenerationTask[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Add items to generation queue
   */
  const addItems = useCallback((itemNames: string[]) => {
    const newTasks: BulkGenerationTask[] = itemNames.map((name, index) => ({
      id: `${Date.now()}-${index}`,
      itemName: name,
      status: "pending",
    }));

    setTasks((prev) => [...prev, ...newTasks]);
    return newTasks;
  }, []);

  /**
   * Calculate progress
   */
  const calculateProgress = useCallback(
    (tasks: BulkGenerationTask[]): Omit<BulkGenerationProgress, "tasks"> => {
      const completed = tasks.filter(
        (t) => t.status === "success" || t.status === "error"
      ).length;
      const errored = tasks.filter((t) => t.status === "error").length;
      const queued = tasks.filter((t) => t.status === "queued").length;
      const generating = tasks.filter((t) => t.status === "generating");

      return {
        totalItems: tasks.length,
        completedItems: completed,
        errorItems: errored,
        queuedItems: queued,
        currentlyGenerating:
          generating.length > 0 ? generating[0].itemName : null,
        progressPercent:
          tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
        isComplete: completed === tasks.length,
      };
    },
    []
  );

  /**
   * Process queue with rate limit awareness
   */
  const updateProgress = useCallback(
    (updatedTasks: BulkGenerationTask[]) => {
      if (onProgressUpdate) {
        const progress = calculateProgress(updatedTasks);
        onProgressUpdate({
          ...progress,
          tasks: updatedTasks,
        });
      }
    },
    [calculateProgress, onProgressUpdate]
  );

  const processQueue = useCallback(async () => {
    abortControllerRef.current = new AbortController();

    let currentTasks = [...tasks];

    while (!abortControllerRef.current.signal.aborted) {
      // Get pending tasks
      const pendingTasks = currentTasks.filter((t) => t.status === "pending");
      const generatingTasks = currentTasks.filter(
        (t) => t.status === "generating"
      );

      if (pendingTasks.length === 0 && generatingTasks.length === 0) {
        // All done
        break;
      }

      // Start generating tasks up to concurrent limit
      const tasksToStart = pendingTasks.slice(
        0,
        maxConcurrent - generatingTasks.length
      );

      const generationPromises = tasksToStart.map(async (task) => {
        // Update task to generating
        currentTasks = currentTasks.map((t) =>
          t.id === task.id ? { ...t, status: "generating" as const } : t
        );
        setTasks([...currentTasks]);
        updateProgress(currentTasks);

        try {
          console.log(
            `[BulkGeneration] Generating description for: ${task.itemName}`
          );

          const response = await generateContentWithRateLimit(
            tenantId,
            task.itemName
          );

          if (response.success && response.content) {
            // Success
            currentTasks = currentTasks.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    status: "success" as const,
                    description: response.content,
                    fromCache: response.fromCache,
                  }
                : t
            );
          } else if (response.isQueued) {
            // Queued
            currentTasks = currentTasks.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    status: "queued" as const,
                    queuePosition: response.queuePosition,
                  }
                : t
            );

            // Queue will be processed automatically, so we continue
          } else {
            // Error
            const feedback = handleGeminiError(response);
            currentTasks = currentTasks.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    status: "error" as const,
                    error: feedback.userMessage,
                  }
                : t
            );
          }

          setTasks([...currentTasks]);
          updateProgress(currentTasks);
        } catch (error) {
          console.error("[BulkGeneration] Error:", error);
          currentTasks = currentTasks.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: "error" as const,
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                }
              : t
          );
          setTasks([...currentTasks]);
          updateProgress(currentTasks);
        }
      });

      // Wait for all concurrent tasks to complete
      await Promise.all(generationPromises);

      // Small delay before next batch
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }, [tasks, tenantId, maxConcurrent, updateProgress]);

  /**
   * Get current progress
   */
  const getProgress = useCallback((): BulkGenerationProgress => {
    const progress = calculateProgress(tasks);
    return {
      ...progress,
      tasks,
    };
  }, [tasks, calculateProgress]);

  /**
   * Cancel ongoing operations
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Clear all tasks
   */
  const clear = useCallback(() => {
    setTasks([]);
  }, []);

  /**
   * Get results only
   */
  const getResults = useCallback((): Record<string, string | undefined> => {
    return tasks.reduce((acc, task) => {
      acc[task.itemName] = task.description;
      return acc;
    }, {} as Record<string, string | undefined>);
  }, [tasks]);

  return {
    tasks,
    addItems,
    processQueue,
    getProgress,
    cancel,
    clear,
    getResults,
  };
}

export default useBulkGenerateDescriptions;
