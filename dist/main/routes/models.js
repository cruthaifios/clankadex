"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelRouter = void 0;
exports.getRunningProcess = getRunningProcess;
const express_1 = require("express");
const child_process_1 = require("child_process");
const crypto_1 = require("crypto");
const store_1 = require("../store");
exports.modelRouter = (0, express_1.Router)();
let runningModel = null;
function getRunningProcess() {
    return runningModel;
}
function broadcast(msg) {
    if (global.__wsBroadcast)
        global.__wsBroadcast(msg);
}
// List models
exports.modelRouter.get('/', (_req, res) => {
    const models = (0, store_1.getModels)();
    const running = runningModel?.modelId || null;
    res.json({ models, runningModelId: running });
});
// Add model
exports.modelRouter.post('/', (req, res) => {
    const { name, filePath, format, contextSize, gpuLayers, notes } = req.body;
    if (!name || !filePath) {
        res.status(400).json({ error: 'name and filePath are required' });
        return;
    }
    const models = (0, store_1.getModels)();
    const entry = {
        id: (0, crypto_1.randomUUID)(),
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
    (0, store_1.saveModels)(models);
    res.json(entry);
});
// Delete model
exports.modelRouter.delete('/:id', (req, res) => {
    let models = (0, store_1.getModels)();
    models = models.filter(m => m.id !== req.params.id);
    (0, store_1.saveModels)(models);
    res.json({ ok: true });
});
// Start model
exports.modelRouter.post('/:id/start', (req, res) => {
    if (runningModel) {
        res.status(409).json({ error: 'A model is already running. Stop it first.' });
        return;
    }
    const models = (0, store_1.getModels)();
    const model = models.find(m => m.id === req.params.id);
    if (!model) {
        res.status(404).json({ error: 'Model not found' });
        return;
    }
    const config = (0, store_1.getConfig)();
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
    const proc = (0, child_process_1.spawn)(config.llamaCppPath, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let outputBuffer = '';
    const appendOutput = (chunk) => {
        const text = chunk.toString();
        outputBuffer += text;
        // Keep buffer from growing unbounded
        if (outputBuffer.length > 100000)
            outputBuffer = outputBuffer.slice(-80000);
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
    proc.stdout?.on('data', () => { if (runningModel)
        runningModel.outputBuffer = outputBuffer; });
    proc.stderr?.on('data', () => { if (runningModel)
        runningModel.outputBuffer = outputBuffer; });
    broadcast({ type: 'status', status: 'running', modelId: model.id });
    res.json({ ok: true, port: serverPort });
});
// Stop model
exports.modelRouter.post('/stop', (_req, res) => {
    if (!runningModel) {
        res.status(404).json({ error: 'No model running' });
        return;
    }
    runningModel.process.kill('SIGTERM');
    runningModel = null;
    broadcast({ type: 'status', status: 'stopped' });
    res.json({ ok: true });
});
// Chat (proxy to llama-server)
exports.modelRouter.post('/chat', async (req, res) => {
    if (!runningModel) {
        res.status(400).json({ error: 'No model running' });
        return;
    }
    try {
        const port = runningModel.serverPort;
        const response = await fetch(`http://127.0.0.1:${port}/completion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: req.body.prompt, n_predict: req.body.n_predict || 256 }),
        });
        const data = await response.json();
        res.json(data);
    }
    catch (err) {
        res.status(502).json({ error: 'Failed to reach model server: ' + err.message });
    }
});
