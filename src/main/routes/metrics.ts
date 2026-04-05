import { Router, Request, Response } from 'express';
import {
  loadMetrics,
  loadTodayLogs,
  getMetricsSummary,
  listLogFiles,
  listMetricsFiles,
  ModelMetrics,
  ChatLogEntry,
} from '../logging';
import * as fs from 'fs';
import * as path from 'path';
import { getDataDir } from '../store';

export const metricsRouter = Router();

const LOGS_DIR = 'logs';
const METRICS_DIR = 'metrics';

function getLogsDir(): string {
  return path.join(getDataDir(), LOGS_DIR);
}

function getMetricsDir(): string {
  return path.join(getDataDir(), METRICS_DIR);
}

metricsRouter.get('/', (_req: Request, res: Response) => {
  const metricsFiles = listMetricsFiles();
  const metrics: any[] = [];
  
  for (const file of metricsFiles) {
    const modelName = file.replace('metrics_', '').replace('.json', '');
    const metricsPath = path.join(getMetricsDir(), file);
    try {
      const data: ModelMetrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
      metrics.push({
        ...data,
        ...getMetricsSummary(data),
        fileName: file,
      });
    } catch {
      // Skip corrupted files
    }
  }
  
  res.json(metrics);
});

metricsRouter.get('/:modelName', (req: Request, res: Response) => {
  const modelName = req.params.modelName;
  const metrics = loadMetrics(modelName);
  
  if (!metrics) {
    res.status(404).json({ error: 'Metrics not found' });
    return;
  }
  
  const summary = getMetricsSummary(metrics);
  res.json({ ...metrics, ...summary });
});

metricsRouter.get('/:modelName/logs', (req: Request, res: Response) => {
  const modelName = req.params.modelName;
  const logs = loadTodayLogs(modelName);
  res.json(logs);
});

metricsRouter.get('/logs/files', (_req: Request, res: Response) => {
  const files = listLogFiles();
  res.json(files);
});

metricsRouter.get('/logs/:fileName', (req: Request, res: Response) => {
  const fileName = req.params.fileName;
  const logsPath = path.join(getLogsDir(), fileName);
  
  if (!fs.existsSync(logsPath)) {
    res.status(404).json({ error: 'Log file not found' });
    return;
  }
  
  try {
    const logs: ChatLogEntry[] = JSON.parse(fs.readFileSync(logsPath, 'utf-8'));
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to read log file: ${err.message}` });
  }
});

metricsRouter.get('/metrics/files', (_req: Request, res: Response) => {
  const files = listMetricsFiles();
  res.json(files);
});