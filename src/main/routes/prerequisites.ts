import { Router, Request, Response } from 'express';
import { execSync } from 'child_process';
import { getConfig } from '../store';

export const prerequisitesRouter = Router();

prerequisitesRouter.get('/check', (_req: Request, res: Response) => {
  const config = getConfig();
  const results: Record<string, { found: boolean; path?: string; version?: string }> = {};

  // Check llama-server / llama.cpp
  if (config.llamaCppPath) {
    try {
      execSync(`"${config.llamaCppPath}" --version`, { timeout: 5000 });
      results.llamaCpp = { found: true, path: config.llamaCppPath };
    } catch {
      results.llamaCpp = { found: false, path: config.llamaCppPath };
    }
  } else {
    // Try common locations
    const tryPaths = ['llama-server', 'llama-cli', '/usr/local/bin/llama-server'];
    let found = false;
    for (const p of tryPaths) {
      try {
        const out = execSync(`which ${p}`, { timeout: 3000 }).toString().trim();
        results.llamaCpp = { found: true, path: out };
        found = true;
        break;
      } catch { /* continue */ }
    }
    if (!found) results.llamaCpp = { found: false };
  }

  res.json(results);
});
