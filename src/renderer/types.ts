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
}
