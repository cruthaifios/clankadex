import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createPluginAPI } from './api';
import { pluginRegistry } from './registry';
import { PluginManifest, LoadedPlugin } from './types';

const PLUGINS_DIR = path.join(os.homedir(), '.clankadex', 'plugins');

export const loadedPlugins: LoadedPlugin[] = [];

export async function loadPlugins(): Promise<void> {
  fs.mkdirSync(PLUGINS_DIR, { recursive: true });

  let entries: string[];
  try {
    entries = fs.readdirSync(PLUGINS_DIR);
  } catch {
    return;
  }

  for (const entry of entries) {
    const pluginDir = path.join(PLUGINS_DIR, entry);
    try {
      const stat = fs.statSync(pluginDir);
      if (!stat.isDirectory()) continue;
      await loadPlugin(pluginDir);
    } catch (err) {
      console.error(`[Plugins] Failed to load plugin from "${entry}":`, err);
    }
  }

  console.log(`[Plugins] Loaded ${loadedPlugins.length} plugin(s).`);
}

async function bundleRendererEntry(pluginName: string, rendererEntry: string): Promise<string | undefined> {
  try {
    // esbuild is a devDependency — available in development; skip gracefully if absent
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const esbuild = require('esbuild');
    const safeName = pluginName.replace(/[^a-zA-Z0-9_]/g, '_');
    const outfile = path.join(os.tmpdir(), `clankadex-plugin-${safeName}.js`);

    await esbuild.build({
      entryPoints: [rendererEntry],
      bundle: true,
      outfile,
      format: 'iife',
      // The global variable the bundle is exposed as: window.__clankadexPlugin_<safeName>
      globalName: `__clankadexPlugin_${safeName}`,
      // These are provided by the host app (exposed on window.* in index.tsx)
      external: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled'],
      define: { 'process.env.NODE_ENV': '"production"' },
      platform: 'browser',
    });

    return outfile;
  } catch (err: any) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.warn(`[Plugins] esbuild not available — skipping renderer bundling for "${pluginName}".`);
    } else {
      console.error(`[Plugins] Failed to bundle renderer for "${pluginName}":`, err);
    }
    return undefined;
  }
}

async function loadPlugin(pluginDir: string): Promise<void> {
  let mainFile = path.join(pluginDir, 'index.js');
  let rendererEntry: string | undefined;

  const pkgPath = path.join(pluginDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (pkg.clankadex?.main) {
      mainFile = path.join(pluginDir, pkg.clankadex.main);
    }
    if (pkg.clankadex?.renderer) {
      rendererEntry = path.join(pluginDir, pkg.clankadex.renderer);
    }
  }

  if (!fs.existsSync(mainFile)) {
    console.warn(`[Plugins] No main file found in "${pluginDir}" — skipping.`);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const manifest: PluginManifest = require(mainFile);
  if (!manifest || !manifest.name || typeof manifest.activate !== 'function') {
    console.warn(`[Plugins] Invalid plugin manifest in "${pluginDir}" — missing name or activate().`);
    return;
  }

  const api = createPluginAPI(manifest.name);

  // Bundle and register the renderer view if a renderer entry is specified
  if (rendererEntry && fs.existsSync(rendererEntry)) {
    const bundlePath = await bundleRendererEntry(manifest.name, rendererEntry);
    if (bundlePath) {
      pluginRegistry.registerView(manifest.name, 'default', bundlePath);
    }
  }

  await manifest.activate(api);
  loadedPlugins.push({ manifest, directory: pluginDir, rendererEntry });
  console.log(`[Plugins] Loaded: ${manifest.name} v${manifest.version}`);
}
