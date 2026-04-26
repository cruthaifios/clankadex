import * as http from 'http';
import { createProxy, stopProxy, ProxyConfig } from './proxy';

function createTestServer(port: number, responseBody: string): http.Server {
  return http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(responseBody);
  });
}

function makeRequest(port: number, path: string, body?: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res!.on('data', (chunk) => (data += chunk));
      res!.on('end', () => {
        resolve({ statusCode: res!.statusCode || 0, body: data });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Proxy', () => {
  let targetServer: http.Server;
  const targetPort = 19999;

  beforeAll((done) => {
    targetServer = createTestServer(
      targetPort,
      JSON.stringify({
        choices: [{ message: { content: 'Hello from target server' } }],
        usage: { completion_tokens: 5 },
      })
    );
    targetServer.listen(targetPort, '127.0.0.1', done);
  });

  afterAll((done) => {
    targetServer.close(() => done());
  });

  afterEach(async () => {
    await sleep(100);
  });

  test('forwards POST request to target server and returns response', async () => {
    const proxyPort = 19001;
    const modelId = 'test-model-post';
    const config: ProxyConfig = {
      proxyPort,
      targetHost: '127.0.0.1',
      targetPort,
    };

    const proxyServer = createProxy(config, modelId);

    await new Promise<void>((resolve, reject) => {
      proxyServer.on('listening', resolve);
      proxyServer.on('error', reject);
      proxyServer.listen(proxyPort, '127.0.0.1');
    });

    const requestBody = JSON.stringify({
      messages: [{ role: 'user', content: 'Hello' }],
    });

    const response = await makeRequest(proxyPort, '/v1/chat/completions', requestBody);

    expect(response.statusCode).toBe(200);
    const responseJson = JSON.parse(response.body);
    expect(responseJson.choices[0].message.content).toBe('Hello from target server');

    stopProxy(modelId);
    await sleep(100);
  }, 10000);

  test('forwards GET request to target server', async () => {
    const proxyPort = 19002;
    const modelId = 'test-model-get';
    const config: ProxyConfig = {
      proxyPort,
      targetHost: '127.0.0.1',
      targetPort,
    };

    const proxyServer = createProxy(config, modelId);

    await new Promise<void>((resolve, reject) => {
      proxyServer.on('listening', resolve);
      proxyServer.on('error', reject);
      proxyServer.listen(proxyPort, '127.0.0.1');
    });

    const response = await makeRequest(proxyPort, '/v1/models');

    expect(response.statusCode).toBe(200);

    stopProxy(modelId);
    await sleep(100);
  }, 10000);

  test('returns 502 when target server is not available', async () => {
    const proxyPort = 19003;
    const modelId = 'test-model-error';
    const config: ProxyConfig = {
      proxyPort,
      targetHost: '127.0.0.1',
      targetPort: 59999,
    };

    const proxyServer = createProxy(config, modelId);

    await new Promise<void>((resolve, reject) => {
      proxyServer.on('listening', resolve);
      proxyServer.on('error', reject);
      proxyServer.listen(proxyPort, '127.0.0.1');
    });

    const requestBody = JSON.stringify({
      messages: [{ role: 'user', content: 'Hello' }],
    });

    const response = await makeRequest(proxyPort, '/v1/chat/completions', requestBody);

    expect(response.statusCode).toBe(502);
    const responseJson = JSON.parse(response.body);
    expect(responseJson.error).toBe('Proxy error');

    stopProxy(modelId);
    await sleep(100);
  }, 10000);
});