import * as fs from 'fs';
import * as path from 'path';

import { ChatLogEntry } from './types';

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

export interface ModelEntry {
  id: string;
  name: string;
  filePath: string;
  format: string;
  sizeBytes: number | null;
  contextSize: number;
  gpuLayers: number;
  notes: string;
  addedAt: string;
  remote: boolean;
  host: string;
  port: number;
}

export interface AppConfig {
  llamaCppPath: string;
  defaultContextSize: number;
  defaultGpuLayers: number;
  serverPort: number;
  models: ModelEntry[];
  loggingEnabled: boolean;
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
