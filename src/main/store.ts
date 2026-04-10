import * as fs from 'fs';
import * as path from 'path';

import { ChatLogEntry, ModelEntry, AppConfig, ModelMetrics } from './types';

export { ModelEntry, AppConfig, ModelMetrics };

export function getDataDir(): string {
  try {
    // In packaged Electron, app.asar is read-only — use the OS user data dir instead.
    const { app } = require('electron');
    return app.getPath('userData');
  } catch {
    // Fallback for web/Node mode (npm run web)
    return path.join(__dirname, '..', '..', 'data');
  }
}

export function ensureDataDir() {
  const dir = getDataDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const DEFAULT_CONFIG: AppConfig = {
  llamaCppPath: '',
  defaultContextSize: 2048,
  defaultGpuLayers: 0,
  serverPort: 8080,
  models: [],
  loggingEnabled: false,
};

const LOGS_DIR = 'logs';
const METRICS_DIR = 'metrics';


function readJsonFromPath<T>(filepath: string, fallback: T): T {
  ensureDataDir();
  if (!fs.existsSync(filepath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJsonToPath(filepath: string, data: unknown): void {
  ensureDataDir();
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function readJson<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const fp = path.join(getDataDir(), filename);
  return readJsonFromPath(fp, fallback)
}

function writeJson(filename: string, data: unknown): void {
  ensureDataDir();
  fs.writeFileSync(path.join(getDataDir(), filename), JSON.stringify(data, null, 2));
}

export function getModels(): ModelEntry[] {
  const config = getConfig();
  return config.models;
}

export function saveModels(models: ModelEntry[]): void {
  const curConfig = getConfig();
  curConfig.models = models
  writeJson('config.json', curConfig);
}

export function getConfig(): AppConfig {
  return { ...DEFAULT_CONFIG, ...readJson('config.json', {}) };
}

export function saveConfig(config: Partial<AppConfig>): AppConfig {
  const current = getConfig();
  const updated = { ...current, ...config };
  writeJson('config.json', updated);
  return updated;
}

export function getLogsDir(): string {
  const dir = path.join(getDataDir(), LOGS_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getLogFilePath(filename: string): string {
  return path.join(getLogsDir(), filename);
}

export function getLogs(filename: string): ChatLogEntry[] {
  const filepath = getLogFilePath(filename);
  return readJsonFromPath(filepath, []);
}

export function appendLogs(entry: ChatLogEntry, filename: string): ChatLogEntry[] {
  const filepath = getLogFilePath(filename);
  const logs = getLogs(filepath);
  logs.push(entry)
  writeJsonToPath(filepath, logs);
  return logs;
}

export function listLogFiles(): string[] {
  const logsDir = getLogsDir();
  if (!fs.existsSync(logsDir)) {
    return [];
  }
  return fs.readdirSync(logsDir).filter(f => f.startsWith('log_') && f.endsWith('.json'));
}

function getMetricsDir(): string {
  const dir = path.join(getDataDir(), METRICS_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getMetricsFileName(modelName: string): string {
  const safeName = modelName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `metrics_${safeName}.json`;
}

function getMetricsFilePath(modelName: string): string {
  return path.join(getMetricsDir(), getMetricsFileName(modelName));
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
  const avgTokensPerSecond=metrics.totalDurationMs > 0 
    ? (metrics.totalPromptTokens + metrics.totalResponseTokens) / (metrics.totalDurationMs / 1000)
    : 0;
  
  return {
    avgTokensPerSecond,
    avgPromptTokens: metrics.totalRequests > 0 ? metrics.totalPromptTokens / metrics.totalRequests : 0,
    avgResponseTokens: metrics.totalRequests > 0 ? metrics.totalResponseTokens / metrics.totalRequests : 0,
    avgDurationMs: metrics.totalRequests > 0 ? metrics.totalDurationMs / metrics.totalRequests : 0,
  };
}

export function listMetricsFiles(): string[] {
  const metricsDir = getMetricsDir();
  if (!fs.existsSync(metricsDir)) {
    return [];
  }
  return fs.readdirSync(metricsDir).filter(f => f.startsWith('metrics_') && f.endsWith('.json'));
}
