import { appendLogs, getLogs, listLogFiles, saveMetrics, loadMetrics, listMetricsFiles } from './store';
import { ChatLogEntry, ModelMetrics } from './types';

function getLogFileName(modelId: string, onDate: string): string {
  return `log_${onDate}_${modelId}.json`;
}

export function appendChatLog(entry: ChatLogEntry): void {
  const date = new Date().toISOString().split('T')[0];
  const filename = getLogFileName(entry.modelId, date);
  appendLogs(entry, filename);
}

export function loadTodayLogs(modelId: string): ChatLogEntry[] {
  const date = new Date().toISOString().split('T')[0];
  const filename = getLogFileName(modelId, date);
  console.log("SAM getting logs for filename: ", filename, ", modelName: ", modelId);
  return getLogs(filename);
}

export function loadLogFilesForModel(modelId: string): string[] {
  const logFiles = getLogFiles();
  return logFiles.filter(file => file.endsWith(`${modelId}.json`));
}

export function getLogFiles(): string[] {
  return listLogFiles();
}

export function updateMetrics(modelId: string, modelName: string, promptTokens: number, responseTokens: number, durationMs: number): ModelMetrics {
  const existing = loadMetrics(modelName);
  const now = new Date().toISOString();
  
  if (!existing) {
    const metrics: ModelMetrics = {
      modelId,
      modelName,
      totalRequests: 1,
      totalPromptTokens: promptTokens,
      totalResponseTokens: responseTokens,
      totalDurationMs: durationMs,
      firstRequestAt: now,
      lastRequestAt: now,
    };
    saveMetrics(modelName, metrics);
    return metrics;
  } else {
    const updated: ModelMetrics = {
      ...existing,
      totalRequests: existing.totalRequests + 1,
      totalPromptTokens: existing.totalPromptTokens + promptTokens,
      totalResponseTokens: existing.totalResponseTokens + responseTokens,
      totalDurationMs: existing.totalDurationMs + durationMs,
      lastRequestAt: now,
    };
    saveMetrics(modelName, updated);
    return updated;
  }
}

export function getMetricsSummary(metrics: ModelMetrics): {
  avgTokensPerSecond: number;
  avgPromptTokens: number;
  avgResponseTokens: number;
  avgDurationMs: number;
} {
  const avgTokensPerSecond = metrics.totalDurationMs > 0 
    ? (metrics.totalPromptTokens + metrics.totalResponseTokens) / (metrics.totalDurationMs / 1000)
    : 0;
  
  return {
    avgTokensPerSecond,
    avgPromptTokens: metrics.totalRequests > 0 ? metrics.totalPromptTokens / metrics.totalRequests : 0,
    avgResponseTokens: metrics.totalRequests > 0 ? metrics.totalResponseTokens / metrics.totalRequests : 0,
    avgDurationMs: metrics.totalRequests > 0 ? metrics.totalDurationMs / metrics.totalRequests : 0,
  };
}

// Re-export metrics functions from store for backward compatibility
export { saveMetrics, loadMetrics, listMetricsFiles };
