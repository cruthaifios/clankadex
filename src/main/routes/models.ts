import { Router, Request, Response } from 'express';
import { ChildProcess, spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { getModels, saveModels, getConfig, ModelEntry } from '../store';

export const modelRouter = Router();

interface RunningModel {
  modelId: string;
  process: ChildProcess | null;  // null for remote models
  outputBuffer: string;
  host: string;
  port: number;
  remote: boolean;
}

let runningModels: Map<string, RunningModel> = new Map();

export function getRunningProcess(): RunningModel | null {
  // Return first running model for WS buffer compat
  const first = runningModels.values().next();
  return first.done ? null : first.value;
}

function broadcast(msg: object) {
  if ((global as any).__wsBroadcast) (global as any).__wsBroadcast(msg);
}

// List models
modelRouter.get('/', (_req: Request, res: Response) => {
  const models = getModels();
  const runningModelIds = Array.from(runningModels.keys());
  res.json({ models, runningModelId: runningModelIds[0] || null, runningModelIds });
});

// Add model
modelRouter.post('/', (req: Request, res: Response) => {
  const { name, filePath, format, contextSize, gpuLayers, notes, remote, host, port } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  if (!remote && !filePath) {
    res.status(400).json({ error: 'filePath is required for local models' });
    return;
  }
  if (remote && (!host || !port)) {
    res.status(400).json({ error: 'host and port are required for remote models' });
    return;
  }
  const models = getModels();
  const entry: ModelEntry = {
    id: randomUUID(),
    name,
    filePath: filePath || '',
    format: format || 'gguf',
    sizeBytes: null,
    contextSize: contextSize || 2048,
    gpuLayers: gpuLayers || 0,
    notes: notes || '',
    addedAt: new Date().toISOString(),
    remote: !!remote,
    host: host || '127.0.0.1',
    port: port || 8080,
  };
  models.push(entry);
  saveModels(models);
  res.json(entry);
});

// Update model
modelRouter.put('/:id', (req: Request, res: Response) => {
  const models = getModels();
  const idx = models.findIndex(m => m.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Model not found' }); return; }
  const allowed = ['name', 'filePath', 'format', 'contextSize', 'gpuLayers', 'notes', 'host', 'port'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) (models[idx] as any)[key] = req.body[key];
  }
  saveModels(models);
  res.json(models[idx]);
});

// Delete model
modelRouter.delete('/:id', (req: Request, res: Response) => {
  // Stop if running
  const running = runningModels.get(req.params.id);
  if (running) {
    if (running.process) running.process.kill('SIGTERM');
    runningModels.delete(req.params.id);
    broadcast({ type: 'status', status: 'stopped', modelId: req.params.id });
  }
  let models = getModels();
  models = models.filter(m => m.id !== req.params.id);
  saveModels(models);
  res.json({ ok: true });
});

// Update model
modelRouter.put('/:id', (req: Request, res: Response) => {
  const { name, filePath, format, contextSize, gpuLayers, notes, remote, host, port } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  if (!remote && !filePath) {
    res.status(400).json({ error: 'filePath is required for local models' });
    return;
  }
  if (remote && (!host || !port)) {
    res.status(400).json({ error: 'host and port are required for remote models' });
    return;
  }
  // Stop if running
  const running = runningModels.get(req.params.id);
  if (running) {
    if (running.process) running.process.kill('SIGTERM');
    runningModels.delete(req.params.id);
    broadcast({ type: 'status', status: 'stopped', modelId: req.params.id });
  }
  let models = getModels();
  const entry: ModelEntry = {
    id: req.params.id,
    name,
    filePath: filePath || '',
    format: format || 'gguf',
    sizeBytes: null,
    contextSize: contextSize || 2048,
    gpuLayers: gpuLayers || 0,
    notes: notes || '',
    addedAt: new Date().toISOString(),
    remote: !!remote,
    host: host || '127.0.0.1',
    port: port || 8080,
  };
  models = models.map(m => m.id == req.params.id ? entry : m);
  saveModels(models);
  res.json({ ok: true });
});

// Start model
modelRouter.post('/:id/start', async (req: Request, res: Response) => {
  const models = getModels();
  const model = models.find(m => m.id === req.params.id);
  if (!model) { res.status(404).json({ error: 'Model not found' }); return; }

  if (runningModels.has(model.id)) {
    res.status(409).json({ error: 'This model is already running.' });
    return;
  }

  if (model.remote) {
    // For remote models, just verify connectivity
    const host = model.host || '127.0.0.1';
    const port = model.port || 8080;
    try {
      const resp = await fetch(`http://${host}:${port}/health`);
      // Accept any response as "reachable"; some servers don't have /health
    } catch (_err) {
      // Still register it — user may want to connect even if health check fails
    }
    const rm: RunningModel = { modelId: model.id, process: null, outputBuffer: `[Connected to remote server at ${host}:${port}]\n`, host, port, remote: true };
    runningModels.set(model.id, rm);
    broadcast({ type: 'output', data: rm.outputBuffer });
    broadcast({ type: 'status', status: 'running', modelId: model.id });
    res.json({ ok: true, host, port });
    return;
  }

  // Local model
  const config = getConfig();
  if (!config.llamaCppPath) {
    res.status(400).json({ error: 'llama.cpp path not configured. Go to Settings.' });
    return;
  }

  const serverPort = model.port || config.serverPort || 8080;
  const args = [
    '--model', model.filePath,
    '--ctx-size', String(model.contextSize),
    '--n-gpu-layers', String(model.gpuLayers),
    '--port', String(serverPort),
    '--host', model.host || '127.0.0.1',
  ];

  const proc = spawn(config.llamaCppPath, args, { stdio: ['pipe', 'pipe', 'pipe'] });
  let outputBuffer = '';

  const appendOutput = (chunk: Buffer) => {
    const text = chunk.toString();
    outputBuffer += text;
    if (outputBuffer.length > 100000) outputBuffer = outputBuffer.slice(-80000);
    const rm = runningModels.get(model.id);
    if (rm) rm.outputBuffer = outputBuffer;
    broadcast({ type: 'output', data: text });
  };

  proc.stdout?.on('data', appendOutput);
  proc.stderr?.on('data', appendOutput);
  proc.on('exit', (code) => {
    broadcast({ type: 'status', status: 'stopped', modelId: model.id, code });
    runningModels.delete(model.id);
  });

  runningModels.set(model.id, { modelId: model.id, process: proc, outputBuffer, host: '127.0.0.1', port: serverPort, remote: false });

  broadcast({ type: 'status', status: 'running', modelId: model.id });
  res.json({ ok: true, port: serverPort });
});

// Stop model (by id or stop first running)
modelRouter.post('/stop', (_req: Request, res: Response) => {
  if (runningModels.size === 0) { res.status(404).json({ error: 'No model running' }); return; }
  // Stop first running model
  const [id, rm] = runningModels.entries().next().value!;
  if (rm.process) rm.process.kill('SIGTERM');
  runningModels.delete(id);
  broadcast({ type: 'status', status: 'stopped', modelId: id });
  res.json({ ok: true });
});

// Stop specific model
modelRouter.post('/:id/stop', (req: Request, res: Response) => {
  const rm = runningModels.get(req.params.id);
  if (!rm) { res.status(404).json({ error: 'Model not running' }); return; }
  if (rm.process) rm.process.kill('SIGTERM');
  runningModels.delete(req.params.id);
  broadcast({ type: 'status', status: 'stopped', modelId: req.params.id });
  res.json({ ok: true });
});

// Chat (proxy to the model's own server)
modelRouter.post('/chat', async (req: Request, res: Response) => {
  // Find the target model — prefer modelId from body, else first running
  const targetId = req.body.modelId;
  let rm: RunningModel | undefined;
  if (targetId) {
    rm = runningModels.get(targetId);
  } else {
    rm = runningModels.values().next().value;
  }
  if (!rm) { res.status(400).json({ error: 'No model running' }); return; }

  try {
    const response = await fetch(`http://${rm.host}:${rm.port}/completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: req.body.prompt, n_predict: req.body.n_predict || 256 }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: `Failed to reach model server at ${rm.host}:${rm.port}: ${err.message}` });
  }
});
