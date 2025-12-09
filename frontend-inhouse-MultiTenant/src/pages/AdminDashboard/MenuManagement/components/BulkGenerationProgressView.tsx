/**
 * Bulk Gemini Generation Progress Component
 * Displays visual feedback for bulk description generation
 *
 * Shows:
 * - Overall progress bar
 * - Per-item status with icons
 * - Rate limit queue information
 * - Cache hits
 * - Errors with retry options
 */

import { AlertCircle, CheckCircle, Clock, Loader2, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import type {
  BulkGenerationProgress,
  BulkGenerationTask,
} from "../../hooks/useBulkGenerateDescriptions";

interface BulkGenerationProgressViewProps {
  progress: BulkGenerationProgress;
  onRetryErrors?: (failedTasks: BulkGenerationTask[]) => void;
  showDetails?: boolean;
}

export const BulkGenerationProgressView: React.FC<
  BulkGenerationProgressViewProps
> = ({ progress, onRetryErrors, showDetails = false }) => {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  // Auto-collapse successful items after 2s
  useEffect(() => {
    if (showDetails && progress.isComplete) {
      const timer = setTimeout(() => {
        setExpandedTask(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [progress.isComplete, showDetails]);

  const failedTasks = progress.tasks.filter(
    (t: BulkGenerationTask) => t.status === "error"
  );
  const canRetry = failedTasks.length > 0 && onRetryErrors;

  return (
    <div className="space-y-4 p-4 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-xl">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Generating Descriptions</h3>
          <span className="text-sm text-gray-400">
            {progress.completedItems} of {progress.totalItems}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progress.errorItems > 0
                ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                : "bg-gradient-to-r from-blue-400 to-cyan-500"
            }`}
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>

        {/* Status Text */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex gap-4 text-xs text-gray-400">
            {progress.completedItems > 0 && (
              <span className="text-green-400">
                ✓ {progress.completedItems} done
              </span>
            )}
            {progress.errorItems > 0 && (
              <span className="text-red-400">
                ✗ {progress.errorItems} errors
              </span>
            )}
            {progress.queuedItems > 0 && (
              <span className="text-blue-400">
                ⏱ {progress.queuedItems} queued
              </span>
            )}
            {progress.currentlyGenerating && (
              <span className="text-yellow-400 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" />{" "}
                {progress.currentlyGenerating.substring(0, 20)}...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Task List (if details enabled) */}
      {showDetails && progress.tasks.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {progress.tasks.map((task: BulkGenerationTask) => (
            <div
              key={task.id}
              className={`p-2 rounded-lg cursor-pointer transition-colors ${
                expandedTask === task.id
                  ? "bg-white/10"
                  : "bg-white/5 hover:bg-white/7"
              }`}
              onClick={() =>
                setExpandedTask(expandedTask === task.id ? null : task.id)
              }
            >
              {/* Task Header */}
              <div className="flex items-center gap-2">
                {/* Status Icon */}
                {task.status === "success" && (
                  <CheckCircle
                    size={14}
                    className="text-green-400 flex-shrink-0"
                  />
                )}
                {task.status === "error" && (
                  <AlertCircle
                    size={14}
                    className="text-red-400 flex-shrink-0"
                  />
                )}
                {task.status === "generating" && (
                  <Loader2
                    size={14}
                    className="text-yellow-400 animate-spin flex-shrink-0"
                  />
                )}
                {task.status === "queued" && (
                  <Clock size={14} className="text-blue-400 flex-shrink-0" />
                )}
                {task.status === "pending" && (
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-400 flex-shrink-0" />
                )}

                {/* Item Name */}
                <span className="text-sm flex-1 text-gray-300 truncate">
                  {task.itemName}
                </span>

                {/* Badges */}
                <div className="flex gap-1">
                  {task.fromCache && (
                    <div className="flex items-center gap-0.5 text-xs bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded">
                      <Zap size={10} /> Cache
                    </div>
                  )}
                  {task.queuePosition && (
                    <div className="text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                      #{task.queuePosition}
                    </div>
                  )}
                </div>
              </div>

              {/* Task Details (Expanded) */}
              {expandedTask === task.id && (
                <div className="mt-2 pt-2 border-t border-white/5 text-xs text-gray-400 space-y-1">
                  {task.description && (
                    <div>
                      <p className="text-gray-500">Description:</p>
                      <p className="text-gray-300 ml-2 italic">
                        "{task.description}"
                      </p>
                    </div>
                  )}
                  {task.error && (
                    <div>
                      <p className="text-red-400">Error:</p>
                      <p className="text-red-300 ml-2">{task.error}</p>
                    </div>
                  )}
                  {task.queuePosition && (
                    <div className="text-blue-400">
                      Queue position: {task.queuePosition}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Retry Button */}
      {canRetry && (
        <button
          onClick={() => onRetryErrors?.(failedTasks)}
          className="w-full px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-sm font-medium rounded-lg transition-colors"
        >
          Retry {failedTasks.length} Failed Item
          {failedTasks.length !== 1 ? "s" : ""}
        </button>
      )}

      {/* Completion Message */}
      {progress.isComplete && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-300">
          ✓ All descriptions generated successfully!
        </div>
      )}
    </div>
  );
};

export default BulkGenerationProgressView;
