import * as http from 'http';
import { appendLogs } from './store';
import { ModelMetrics } from './types';

export interface ProxyConfig {
  proxyPort: number;
  targetHost: string;
  targetPort: number;
}

export interface CapturedRequest {
  prompt: string;
  n_predict?: number;
  method?: string;
  path: string;
  timestamp: string;
}

export interface CapturedResponse {
  content: string;
  eval_tokens?: number;
  tokens_evaluated?: number;
  durationMs: number;
}

let proxyServers: Map<string, { server: http.Server; modelId: string }> = new Map();

// Helper to get model ID from proxy port
function getModelIdFromProxyPort(proxyPort: number): string | null {
  for (const [modelId, data] of proxyServers.entries()) {
    if (data.server && data.server.listening) {
      // Node.js http.Server doesn't expose listeningPort directly
      // We'll track it manually
    }
  }
  return null;
}

// Helper to get proxy server from model ID
function getProxyServerFromModelId(modelId: string): http.Server | null {
  const data = proxyServers.get(modelId);
  return data ? data.server : null;
}

// Create proxy server
export function createProxy(config: ProxyConfig, modelId: string): http.Server {
  const server = http.createServer((req, res) => {
    const startTime = Date.now();
    
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk; });
    req.on('end', () => {
      const capturedRequest: CapturedRequest = {
        prompt: req.method === 'POST' ? JSON.parse(body || '{}').prompt || '' : '',
        n_predict: req.method === 'POST' ? JSON.parse(body || '{}').n_predict : undefined,
        method: req.method,
        path: (req.url || '/') as string,
        timestamp: new Date().toISOString(),
      };

      const targetUrl = `http://${config.targetHost}:${config.targetPort}${req.url}`;
      
      const targetReq = http.request(targetUrl, (targetRes) => {
        let responseBody = '';
        
        targetRes.on('data', (chunk: Buffer) => {
          responseBody += chunk;
        });
        
        targetRes.on('end', () => {
          try {
            const parsedBody = JSON.parse(responseBody);
            const capturedResponse: CapturedResponse = {
              content: parsedBody.content || '',
              eval_tokens: parsedBody.eval_tokens,
              tokens_evaluated: parsedBody.tokens_evaluated,
              durationMs: Date.now() - startTime,
            };
            
            // Save captured request/response for logging and metrics
            saveCapturedData(modelId, capturedRequest, capturedResponse);
          } catch (e) {
            // Non-JSON response, skip detailed logging
          }
        });
      });
      
      targetReq.on('error', (err: any) => {
        console.error(`Proxy error for ${modelId}:`, err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
      });
      
      targetReq.end();
    });
    
    // Write response
    res.writeHead(200, { 'Content-Type': 'application/json' });
  });
  
  server.on('error', (err: any) => {
    console.error(`Proxy server error for ${modelId}:`, err.message);
  });
  
  proxyServers.set(modelId, { server, modelId });
  
  return server;
}

// Stop proxy server
export function stopProxy(modelId: string): boolean {
  const data = proxyServers.get(modelId);
  if (data) {
    data.server.close(() => {
      proxyServers.delete(modelId);
    });
    return true;
  }
  return false;
}

// Stop all proxy servers
export function stopAllProxies(): void {
  for (const [modelId, data] of proxyServers.entries()) {
    data.server.close(() => {
      proxyServers.delete(modelId);
    });
  }
}

// Save captured request/response data
export function saveCapturedData(modelId: string, request: CapturedRequest, response: CapturedResponse): void {
  try {
    // Update metrics
    const updatedMetrics = require('./store').updateMetrics(
      modelId,
      modelId, // modelName
      request.prompt.split(' ').length, // prompt tokens (approximate)
      response.content.split(' ').length, // response tokens (approximate)
      response.durationMs
    );
    
    // Save log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      modelId,
      modelName: modelId,
      prompt: request.prompt,
      response: response.content,
      requestTokens: request.prompt.split(' ').length,
      responseTokens: response.content.split(' ').length,
      durationMs: response.durationMs,
    };
    
    appendLogs(logEntry, `log_${modelId}.json`);
  } catch (e) {
    console.error('Error saving captured data:', e);
  }
}

// Get captured data files
export function listCapturedDataFiles(): string[] {
  try {
    const metricsDir = require('./store').getMetricsDir();
    const fs = require('fs');
    
    if (!fs.existsSync(metricsDir)) {
      return [];
    }
    
    return fs.readdirSync(metricsDir).filter((f: string) => f.startsWith('metrics_') && f.endsWith('.json'));
  } catch (e) {
    return [];
  }
}
