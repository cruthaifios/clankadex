import express from 'express';
import * as path from 'path';
import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { modelRouter, getRunningProcess } from './routes/models';
import { configRouter } from './routes/config';
import { prerequisitesRouter } from './routes/prerequisites';

export async function startServer(port: number): Promise<http.Server> {
  const app = express();
  app.use(express.json());

  // Serve renderer
  app.use(express.static(path.join(__dirname, '..', 'renderer')));

  // API routes
  app.use('/api/models', modelRouter);
  app.use('/api/config', configRouter);
  app.use('/api/prerequisites', prerequisitesRouter);

  // SPA fallback
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  });

  const server = http.createServer(app);

  // WebSocket for terminal output streaming
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws: WebSocket) => {
    // Send current output buffer if a process is running
    const proc = getRunningProcess();
    if (proc) {
      ws.send(JSON.stringify({ type: 'output', data: proc.outputBuffer }));
    }
  });

  // Export broadcast function for use by model routes
  (global as any).__wsBroadcast = (msg: object) => {
    const data = JSON.stringify(msg);
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    });
  };

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Clankadex server running on port ${port}`);
      resolve(server);
    });
  });
}
