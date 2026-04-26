import * as http from 'http';
import { createProxyServer } from 'http-proxy';
import { ChatLogEntry, ModelMetrics } from './types';
import { appendChatLog, updateMetrics } from './logging';

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

// Helper to extract prompt from request body
function extractPrompt(body: string): string {
  try {
    const json = JSON.parse(body);
    // Handle /v1/chat/completions format with messages
    if (json.messages && Array.isArray(json.messages)) {
      // Get the last user message as the prompt
      const lastUserMsg = [...json.messages].reverse().find((m: any) => m.role === 'user');
      return lastUserMsg?.content || '';
    }
    // Handle /v1/completions format with prompt
    if (json.prompt) {
      return Array.isArray(json.prompt) ? json.prompt.join('') : json.prompt;
    }
    return body;
  } catch {
    return body;
  }
}

// Helper to extract content from response
function extractResponseContent(data: string, isStreaming: boolean): { content: string; tokens?: number } {
  try {
    if (isStreaming) {
      // Handle SSE streaming format (e.g., "data: {...}")
      const lines = data.split('\n').filter(l => l.startsWith('data: '));
      let fullContent = '';
      let lastTokens: number | undefined;
      
      for (const line of lines) {
        try {
          const json = JSON.parse(line.slice(6)); // Remove "data: " prefix
          if (json.choices && json.choices[0]?.delta?.content) {
            fullContent += json.choices[0].delta.content;
          }
          if (json.usage?.completion_tokens) {
            lastTokens = json.usage.completion_tokens;
          }
        } catch { /* skip invalid JSON lines */ }
      }
      return { content: fullContent, tokens: lastTokens };
    } else {
      // Non-streaming response
      const json = JSON.parse(data);
      const content = json.choices?.[0]?.message?.content || json.choices?.[0]?.text || '';
      const tokens = json.usage?.completion_tokens;
      return { content, tokens };
    }
  } catch {
    return { content: data };
  }
}

// Create proxy server
export function createProxy(config: ProxyConfig, modelId: string): http.Server {
  const targetUrl = new URL(`http://${config.targetHost}:${config.targetPort}`);
  console.log(`[PROXY] Creating proxy for model ${modelId} -> ${targetUrl}`);

  const proxy = createProxyServer({
    target: targetUrl,
    changeOrigin: true,
  });

  proxy.on('proxyReq', (proxyReq, req) => {
    console.log(`[PROXY REQUEST] ${req.method} ${req.url} -> ${targetUrl}`);
    console.log(`[PROXY HEADERS] Host: ${proxyReq.getHeader('host')}`);
  });

  proxy.on('proxyRes', (proxyRes: any, req: any) => {
    console.log(`[PROXY RESPONSE] ${req.url} <- Status: ${proxyRes.statusCode}`);
  });

  proxy.on('error', (err, req, res) => {
    console.error(`[PROXY ERROR] Failed to proxy ${req.url}:`, err.message);
    if (res && 'headersSent' in res && !res.headersSent) {
      (res as http.ServerResponse).writeHead(502, { 'Content-Type': 'application/json' });
      (res as http.ServerResponse).end(JSON.stringify({ error: 'Proxy error', message: err.message }));
    }
  });

  const server = http.createServer((req, res) => {
    console.log(`[PROXY INCOMING] ${req.method} ${req.url}`);
    proxy.web(req, res);
  });

  server.on('error', (err) => {
    console.error(`[PROXY SERVER ERROR]`, err.message);
  });

  proxyServers.set(modelId, { server, modelId });
  console.log(`[PROXY] Server registered for model ${modelId}`);

  return server;
}

// Stop proxy server
export function stopProxy(modelId: string): boolean {
  const data = proxyServers.get(modelId);
  if (data) {
    console.log(`[PROXY] Stopping proxy for model ${modelId}`);
    data.server.close((err) => {
      if (err) {
        console.error(`[PROXY] Error closing proxy for ${modelId}:`, err.message);
      } else {
        console.log(`[PROXY] Proxy for model ${modelId} stopped`);
      }
      proxyServers.delete(modelId);
    });
    return true;
  }
  console.warn(`[PROXY] No proxy found for model ${modelId}`);
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
    const promptTokens = request.prompt.split(/\s+/).filter(Boolean).length;
    const responseTokens = response.content.split(/\s+/).filter(Boolean).length;

    // Update metrics
    updateMetrics(
      modelId,
      modelId,
      promptTokens,
      responseTokens,
      response.durationMs
    );

    // Log PROMPT entry
    const promptLogEntry: ChatLogEntry = {
      timestamp: new Date().toISOString(),
      modelId,
      message: request.prompt,
      type: 'PROMPT',
      tokens: promptTokens,
    };
    appendChatLog(promptLogEntry);

    // Log RESPONSE entry
    const responseLogEntry: ChatLogEntry = {
      timestamp: new Date().toISOString(),
      modelId,
      message: response.content,
      type: 'RESPONSE',
      tokens: responseTokens,
      durationMs: response.durationMs,
    };
    appendChatLog(responseLogEntry);
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
