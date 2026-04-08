import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { pluginRegistry } from '../plugins/registry';
import { loadedPlugins } from '../plugins/loader';

export const pluginRouter = Router();

// GET /api/plugins — list installed plugins with their sidebar items
pluginRouter.get('/', (_req: Request, res: Response) => {
  const plugins = loadedPlugins.map(p => ({
    name: p.manifest.name,
    version: p.manifest.version,
    description: p.manifest.description || '',
    icon: p.manifest.icon,
    sidebarItems: pluginRegistry.getSidebarItemsByPlugin(p.manifest.name),
    enabled: true,
  }));
  res.json({ plugins });
});

// GET /api/plugins/:name/view/:viewId — serve the plugin's bundled React component
pluginRouter.get('/:name/view/:viewId', (req: Request, res: Response) => {
  const { name, viewId } = req.params;
  const view = pluginRegistry.getView(name, viewId);

  if (!view) {
    res.status(404).json({ error: `No view "${viewId}" registered for plugin "${name}".` });
    return;
  }

  if (!fs.existsSync(view.bundlePath)) {
    res.status(404).json({ error: 'Plugin bundle file not found on disk.' });
    return;
  }

  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(view.bundlePath);
});

// POST /api/plugins/:name/state — get or set plugin-scoped persistent state
pluginRouter.post('/:name/state', (req: Request, res: Response) => {
  const { name } = req.params;
  const { action, key, value } = req.body;

  const stateDir = path.join(os.homedir(), '.clankadex', 'plugins', name);
  const stateFile = path.join(stateDir, 'state.json');

  let state: Record<string, any> = {};
  try {
    state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  } catch { /* state file may not exist yet */ }

  if (action === 'get') {
    res.json({ value: key ? state[key] : state });
  } else if (action === 'set') {
    if (key !== undefined) state[key] = value;
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
    res.json({ ok: true });
  } else {
    res.status(400).json({ error: 'Invalid action. Use "get" or "set".' });
  }
});
