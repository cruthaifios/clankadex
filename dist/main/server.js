"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const path = __importStar(require("path"));
const http = __importStar(require("http"));
const ws_1 = require("ws");
const models_1 = require("./routes/models");
const config_1 = require("./routes/config");
const prerequisites_1 = require("./routes/prerequisites");
async function startServer(port) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    // Serve renderer
    app.use(express_1.default.static(path.join(__dirname, '..', 'renderer')));
    // Serve images
    app.use('/img', express_1.default.static(path.join(__dirname, '..', '..', 'img')));
    // API routes
    app.use('/api/models', models_1.modelRouter);
    app.use('/api/config', config_1.configRouter);
    app.use('/api/prerequisites', prerequisites_1.prerequisitesRouter);
    // SPA fallback
    app.get('*', (_req, res) => {
        res.sendFile(path.join(__dirname, '..', 'renderer', 'index.html'));
    });
    const server = http.createServer(app);
    // WebSocket for terminal output streaming
    const wss = new ws_1.WebSocketServer({ server, path: '/ws' });
    wss.on('connection', (ws) => {
        // Send current output buffer if a process is running
        const proc = (0, models_1.getRunningProcess)();
        if (proc) {
            ws.send(JSON.stringify({ type: 'output', data: proc.outputBuffer }));
        }
    });
    // Export broadcast function for use by model routes
    global.__wsBroadcast = (msg) => {
        const data = JSON.stringify(msg);
        wss.clients.forEach(client => {
            if (client.readyState === ws_1.WebSocket.OPEN)
                client.send(data);
        });
    };
    return new Promise((resolve) => {
        server.listen(port, () => {
            console.log(`Clankadex server running on port ${port}`);
            resolve(server);
        });
    });
}
