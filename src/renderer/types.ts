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
  proxyPort?: number;
}

export interface AppConfig {
  llamaCppPath: string;
  defaultContextSize: number;
  defaultGpuLayers: number;
  serverPort: number;
  models: ModelEntry[];
  loggingEnabled: boolean;
}

export type ChatLogType = 'PROMPT' | 'RESPONSE'

export interface ChatLogEntry {
  timestamp: string;
  modelId: string;
  message: string;
  type: ChatLogType;
  tokens?: number;
  durationMs?: number;
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
