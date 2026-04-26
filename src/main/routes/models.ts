import { Router, Request, Response } from 'express';
import { ChildProcess, spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { getModels, saveModels, getConfig, ModelEntry } from '../store';
import { appendChatLog, updateMetrics } from '../logging';
import { createProxy, stopProxy, ProxyConfig } from '../proxy';

export const modelRouter = Router();

interface RunningModel {
  modelId: string;
  process: ChildProcess | null;  // null for remote models
  proxyServer: any | null;  // null for remote models
  outputBuffer: string;
  host: string;
  port: number;
  proxyHost: string;
  proxyPort: number;
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
  const { name, filePath, format, contextSize, gpuLayers, notes, remote, host, port, proxyPort } = req.body;
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
    proxyPort: proxyPort || 8081,
  };
  models.push(entry);
  saveModels(models);
  res.json(entry);
});

// Delete model
modelRouter.delete('/:id', (req: Request, res: Response) => {
  // Stop if running
  const running = runningModels.get(req.params.id);
  if (running) {
    if (running.process) running.process.kill('SIGTERM');
    if (running.proxyServer) {
      try {
        stopProxy(running.modelId);
      } catch (e) {
        console.error('Error stopping proxy:', e);
      }
    }
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
  const { name, filePath, format, contextSize, gpuLayers, notes, remote, host, port, proxyPort } = req.body;
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
    if (running.proxyServer) {
      try {
        stopProxy(running.modelId);
      } catch (e) {
        console.error('Error stopping proxy:', e);
      }
    }
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
    proxyPort: proxyPort || 8081,
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
    const rm: RunningModel = { modelId: model.id, process: null, proxyServer: null, outputBuffer: `[Connected to remote server at ${host}:${port}]`, host, port, proxyHost: '', proxyPort: model.proxyPort || 8081, remote: true };
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
  const proxyPort = model.proxyPort || 8081;
  
  // Start llama-server on the model's native port (serverPort)
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
    if (runningModels.get(model.id)?.proxyServer) {
      try {
        stopProxy(runningModels.get(model.id)!.modelId);
      } catch (e) {
        console.error('Error stopping proxy on exit:', e);
      }
    }
    runningModels.delete(model.id);
  });

  // Create proxy server that listens on proxyPort and forwards to serverPort
  const proxyConfig: ProxyConfig = {
    proxyPort,
    targetHost: model.host || '127.0.0.1',
    targetPort: serverPort,
  };
  
  const proxyServer = createProxy(proxyConfig, model.id);
  // proxyServer.listen(proxyPort, model.host || '127.0.0.1', () => {
  //   console.log(`Proxy for ${model.name} listening on ${proxyPort}, forwarding to ${model.host}:${serverPort}`);
  // });

  await new Promise<void>((resolve, reject) => {
    proxyServer.on('listening', resolve);
    proxyServer.on('error', reject);
    proxyServer.listen(proxyPort, model.host || '127.0.0.1', () => {
      console.log(`Proxy for ${model.name} listening on ${proxyPort}, forwarding to ${model.host}:${serverPort}`);
    });
  });

  runningModels.set(model.id, { 
    modelId: model.id, 
    process: proc, 
    proxyServer, 
    outputBuffer, 
    host: model.host || '127.0.0.1', 
    port: serverPort,
    proxyHost: model.host || '127.0.0.1',
    proxyPort,
    remote: false 
  });

  broadcast({ type: 'status', status: 'running', modelId: model.id });
  res.json({ ok: true, port: serverPort });
});

// Stop model (by id or stop first running)
modelRouter.post('/stop', (_req: Request, res: Response) => {
  if (runningModels.size === 0) { res.status(404).json({ error: 'No model running' }); return; }
  // Stop first running model
  const [id, rm] = runningModels.entries().next().value!;
  if (rm.process) rm.process.kill('SIGTERM');
  if (rm.proxyServer) {
    try {
      stopProxy(rm.modelId);
    } catch (e) {
      console.error('Error stopping proxy:', e);
    }
  }
  runningModels.delete(id);
  broadcast({ type: 'status', status: 'stopped', modelId: id });
  res.json({ ok: true });
});

// Stop specific model
modelRouter.post('/:id/stop', (req: Request, res: Response) => {
  const rm = runningModels.get(req.params.id);
  if (!rm) { res.status(404).json({ error: 'Model not running' }); return; }
  if (rm.process) rm.process.kill('SIGTERM');
  if (rm.proxyServer) {
    try {
      stopProxy(rm.modelId);
    } catch (e) {
      console.error('Error stopping proxy:', e);
    }
  }
  runningModels.delete(req.params.id);
  broadcast({ type: 'status', status: 'stopped', modelId: req.params.id });
  res.json({ ok: true });
});

// Chat (use proxy to capture metrics)
modelRouter.post('/chat', async (req: Request, res: Response) => {
  console.log("SAM hit chat endpoint")
  // Find the target model — prefer modelId from body, else first running
  const targetId = req.body.modelId;
  let rm: RunningModel | undefined;
  if (targetId) {
    rm = runningModels.get(targetId);
  } else {
    rm = runningModels.values().next().value;
  }
  if (!rm) { res.status(400).json({ error: 'No model running' }); return; }

  const models = getModels();
  const model = models.find(m => m.id === rm.modelId);
  const modelName = model?.name || 'unknown';
  const config = getConfig();
  const loggingEnabled = config.loggingEnabled;

  const startTime = Date.now();
  const prompt = req.body.prompt;

  try {
    // Use proxy instead of direct model connection
    const proxyHost = rm.proxyHost || rm.host;
    const proxyPort = rm.proxyPort || 8081;
    
    const response = await fetch(`http://${proxyHost}:${proxyPort}/completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, n_predict: req.body.n_predict || 256 }),
    });
    const data = await response.json();
    const durationMs = Date.now() - startTime;

if (loggingEnabled) {
      const dataContent = (data as any).content || '';
      const dataEvalTokens = (data as any).eval_tokens;
      const dataTokensEvaluated = (data as any).tokens_evaluated;

      const promptTokens = prompt.split(/\s+/).filter(Boolean).length;
      const responseTokens = dataTokensEvaluated || dataContent.split(/\s+/).filter(Boolean).length;

      // Log the PROMPT
      const promptLogEntry = {
        timestamp: new Date().toISOString(),
        modelId: rm.modelId,
        message: prompt,
        type: 'PROMPT' as const,
        tokens: dataEvalTokens || promptTokens,
      };
      appendChatLog(promptLogEntry);

      // Log the RESPONSE
      const responseLogEntry = {
        timestamp: new Date().toISOString(),
        modelId: rm.modelId,
        message: dataContent,
        type: 'RESPONSE' as const,
        tokens: responseTokens,
        durationMs,
      };
      appendChatLog(responseLogEntry);

      updateMetrics(
        rm.modelId,
        modelName,
        promptLogEntry.tokens || 0,
        responseLogEntry.tokens || 0,
        durationMs
      );
    }

    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: `Failed to reach proxy at ${rm.proxyHost}:${rm.proxyPort}: ${err.message}` });
  }
});
