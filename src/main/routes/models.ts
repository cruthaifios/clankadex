import { Router, Request, Response } from 'express';
import { ChildProcess, spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { getModels, saveModels, getConfig, ModelEntry } from '../store';

export const modelRouter = Router();

interface RunningModel {
  modelId: string;
  process: ChildProcess;
  outputBuffer: string;
  serverPort: number;
}

let runningModel: RunningModel | null = null;

export function getRunningProcess(): RunningModel | null {
  return runningModel;
}

function broadcast(msg: object) {
  if ((global as any).__wsBroadcast) (global as any).__wsBroadcast(msg);
}

// List models
modelRouter.get('/', (_req: Request, res: Response) => {
  const models = getModels();
  const running = runningModel?.modelId || null;
  res.json({ models, runningModelId: running });
});

// Add model
modelRouter.post('/', (req: Request, res: Response) => {
  const { name, filePath, format, contextSize, gpuLayers, notes } = req.body;
  if (!name || !filePath) {
    res.status(400).json({ error: 'name and filePath are required' });
    return;
  }
  const models = getModels();
  const entry: ModelEntry = {
    id: randomUUID(),
    name,
    filePath,
    format: format || 'gguf',
    sizeBytes: null,
    contextSize: contextSize || 2048,
    gpuLayers: gpuLayers || 0,
    notes: notes || '',
    addedAt: new Date().toISOString(),
  };
  models.push(entry);
  saveModels(models);
  res.json(entry);
});

// Delete model
modelRouter.delete('/:id', (req: Request, res: Response) => {
  let models = getModels();
  models = models.filter(m => m.id !== req.params.id);
  saveModels(models);
  res.json({ ok: true });
});

// Start model
modelRouter.post('/:id/start', (req: Request, res: Response) => {
  if (runningModel) {
    res.status(409).json({ error: 'A model is already running. Stop it first.' });
    return;
  }
  const models = getModels();
  const model = models.find(m => m.id === req.params.id);
  if (!model) { res.status(404).json({ error: 'Model not found' }); return; }

  const config = getConfig();
  if (!config.llamaCppPath) {
    res.status(400).json({ error: 'llama.cpp path not configured. Go to Settings.' });
    return;
  }

  const serverPort = config.serverPort || 8080;
  const args = [
    '--model', model.filePath,
    '--ctx-size', String(model.contextSize),
    '--n-gpu-layers', String(model.gpuLayers),
    '--port', String(serverPort),
    '--host', '127.0.0.1',
  ];

  const proc = spawn(config.llamaCppPath, args, { stdio: ['pipe', 'pipe', 'pipe'] });
  let outputBuffer = '';

  const appendOutput = (chunk: Buffer) => {
    const text = chunk.toString();
    outputBuffer += text;
    // Keep buffer from growing unbounded
    if (outputBuffer.length > 100000) outputBuffer = outputBuffer.slice(-80000);
    broadcast({ type: 'output', data: text });
  };

  proc.stdout?.on('data', appendOutput);
  proc.stderr?.on('data', appendOutput);
  proc.on('exit', (code) => {
    broadcast({ type: 'status', status: 'stopped', code });
    runningModel = null;
  });

  runningModel = { modelId: model.id, process: proc, outputBuffer, serverPort };
  // Keep outputBuffer reference updated
  proc.stdout?.on('data', () => { if (runningModel) runningModel.outputBuffer = outputBuffer; });
  proc.stderr?.on('data', () => { if (runningModel) runningModel.outputBuffer = outputBuffer; });

  broadcast({ type: 'status', status: 'running', modelId: model.id });
  res.json({ ok: true, port: serverPort });
});

// Stop model
modelRouter.post('/stop', (_req: Request, res: Response) => {
  if (!runningModel) { res.status(404).json({ error: 'No model running' }); return; }
  runningModel.process.kill('SIGTERM');
  runningModel = null;
  broadcast({ type: 'status', status: 'stopped' });
  res.json({ ok: true });
});

// Chat (proxy to llama-server)
modelRouter.post('/chat', async (req: Request, res: Response) => {
  if (!runningModel) { res.status(400).json({ error: 'No model running' }); return; }
  try {
    const port = runningModel.serverPort;
    const response = await fetch(`http://127.0.0.1:${port}/completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: req.body.prompt, n_predict: req.body.n_predict || 256 }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to reach model server: ' + err.message });
  }
});
