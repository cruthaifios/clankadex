/**
 * Shared plugin types for Clankadex plugin authors.
 *
 * Plugin package.json example:
 * {
 *   "name": "my-plugin",
 *   "version": "1.0.0",
 *   "clankadex": {
 *     "main": "index.js",
 *     "renderer": "renderer/index.jsx"
 *   }
 * }
 *
 * Plugin index.js example:
 * module.exports = {
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   description: 'A sample plugin',
 *   activate(api) {
 *     api.registerSidebarItem('main', 'My Plugin', undefined, 'main');
 *   },
 *   deactivate() {},
 * };
 *
 * Plugin renderer/index.jsx example (bundled by Clankadex on load):
 * export default function MyPluginView() {
 *   return React.createElement('div', null, 'Hello from plugin!');
 * }
 */

export interface PluginAPI {
  /** Register a view bundle (bundled by the server if using clankadex.renderer in package.json) */
  registerView(id: string, bundlePath: string): void;
  /** Add an item to the sidebar Plugins section */
  registerSidebarItem(id: string, label: string, icon: string | undefined, viewId: string): void;
  /** Register a custom Express route at /api/plugins/:name/* */
  registerRoute(
    method: 'get' | 'post' | 'put' | 'delete',
    routePath: string,
    handler: (req: any, res: any, next: any) => void
  ): void;
  /** Get a plugin-scoped persistent value from ~/.clankadex/plugins/<name>/state.json */
  getState(key: string): Promise<any>;
  /** Set a plugin-scoped persistent value */
  setState(key: string, value: any): Promise<void>;
  /** Subscribe to an event on the plugin event bus */
  on(event: string, handler: (data: any) => void): void;
  /** Emit an event on the plugin event bus */
  emit(event: string, data: any): void;
}

export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  icon?: string;
  activate(api: PluginAPI): void | Promise<void>;
  deactivate(): void | Promise<void>;
}

export interface PluginSidebarItem {
  pluginName: string;
  id: string;
  label: string;
  icon?: string;
  viewId: string;
}

export interface PluginInfo {
  name: string;
  version: string;
  description?: string;
  icon?: string;
  sidebarItems: PluginSidebarItem[];
  enabled: boolean;
}
