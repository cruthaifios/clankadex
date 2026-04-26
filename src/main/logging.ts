import { appendLogs, getLogs, listLogFiles, saveMetrics, loadMetrics, listMetricsFiles } from './store';
import { ChatLogEntry, ModelMetrics } from './types';

function getLogFileName(modelName: string): string {
  const date = new Date().toISOString().split('T')[0];
  const safeName = modelName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `log_${date}_${safeName}.json`;
}

export function appendChatLog(entry: ChatLogEntry): void {
  const filename = getLogFileName(entry.modelId);
  appendLogs(entry, filename);
}

export function loadTodayLogs(modelName: string): ChatLogEntry[] {
  const filename = getLogFileName(modelName);
  return getLogs(filename);
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
