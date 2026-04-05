import * as fs from 'fs';
import * as path from 'path';
import { getDataDir, ensureDataDir } from './store';

export interface ChatLogEntry {
  timestamp: string;
  modelId: string;
  modelName: string;
  prompt: string;
  response: string;
  requestTokens?: number;
  responseTokens?: number;
  durationMs: number;
}

export interface ModelMetrics {
  modelId: string;
  modelName: string;
  totalRequests: number;
  totalPromptTokens: number;
  totalResponseTokens: number;
  totalDurationMs: number;
  firstRequestAt: string;
  lastRequestAt: string;
}

const LOGS_DIR = 'logs';
const METRICS_DIR = 'metrics';

function getLogsDir(): string {
  const dir = path.join(getDataDir(), LOGS_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getMetricsDir(): string {
  const dir = path.join(getDataDir(), METRICS_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getLogFileName(modelName: string): string {
  const date = new Date().toISOString().split('T')[0];
  const safeName = modelName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `log_${date}_${safeName}.json`;
}

function getMetricsFileName(modelName: string): string {
  const safeName = modelName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `metrics_${safeName}.json`;
}

function getLogFilePath(modelName: string): string {
  return path.join(getLogsDir(), getLogFileName(modelName));
}

function getMetricsFilePath(modelName: string): string {
  return path.join(getMetricsDir(), getMetricsFileName(modelName));
}

export function appendChatLog(entry: ChatLogEntry): void {
  ensureDataDir();
  const logPath = getLogFilePath(entry.modelName);
  
  let logs: ChatLogEntry[] = [];
  if (fs.existsSync(logPath)) {
    try {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
    } catch {
      logs = [];
    }
  }
  
  logs.push(entry);
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
}

export function loadTodayLogs(modelName: string): ChatLogEntry[] {
  const logPath = getLogFilePath(modelName);
  if (!fs.existsSync(logPath)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(logPath, 'utf-8'));
  } catch {
    return [];
  }
}

export function saveMetrics(modelName: string, metrics: ModelMetrics): void {
  ensureDataDir();
  const metricsPath = getMetricsFilePath(modelName);
  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
}

export function loadMetrics(modelName: string): ModelMetrics | null {
  const metricsPath = getMetricsFilePath(modelName);
  if (!fs.existsSync(metricsPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
  } catch {
    return null;
  }
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

export function listLogFiles(): string[] {
  const logsDir = getLogsDir();
  if (!fs.existsSync(logsDir)) {
    return [];
  }
  return fs.readdirSync(logsDir).filter(f => f.startsWith('log_') && f.endsWith('.json'));
}

export function listMetricsFiles(): string[] {
  const metricsDir = getMetricsDir();
  if (!fs.existsSync(metricsDir)) {
    return [];
  }
  return fs.readdirSync(metricsDir).filter(f => f.startsWith('metrics_') && f.endsWith('.json'));
}