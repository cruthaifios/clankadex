import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
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
}

const DEFAULT_CONFIG: AppConfig = {
  llamaCppPath: '',
  defaultContextSize: 2048,
  defaultGpuLayers: 0,
  serverPort: 8080,
  models: [],
};

function readJson<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJson(filename: string, data: unknown): void {
  ensureDataDir();
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
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
