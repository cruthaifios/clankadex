import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';
import { pluginRegistry } from './registry';
import { PluginAPI } from './types';

const eventBus = new EventEmitter();

function getPluginDataDir(pluginName: string): string {
  const dir = path.join(os.homedir(), '.clankadex', 'plugins', pluginName);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function readPluginState(pluginName: string): Record<string, any> {
  const stateFile = path.join(getPluginDataDir(pluginName), 'state.json');
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  } catch {
    return {};
  }
}

function writePluginState(pluginName: string, state: Record<string, any>): void {
  const stateFile = path.join(getPluginDataDir(pluginName), 'state.json');
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

export function createPluginAPI(pluginName: string): PluginAPI {
  return {
    registerView(id: string, bundlePath: string) {
      pluginRegistry.registerView(pluginName, id, bundlePath);
    },

    registerSidebarItem(id: string, label: string, icon: string | undefined, viewId: string) {
      pluginRegistry.registerSidebarItem(pluginName, id, label, icon, viewId);
    },

    registerRoute(method, routePath, handler) {
      const router = pluginRegistry.getOrCreateRouter(pluginName);
      (router as any)[method](routePath, handler);
    },

    async getState(key: string) {
      return readPluginState(pluginName)[key];
    },

    async setState(key: string, value: any) {
      const state = readPluginState(pluginName);
      state[key] = value;
      writePluginState(pluginName, state);
    },

    on(event: string, handler: (data: any) => void) {
      eventBus.on(event, handler);
    },

    emit(event: string, data: any) {
      eventBus.emit(event, data);
    },
  };
}
