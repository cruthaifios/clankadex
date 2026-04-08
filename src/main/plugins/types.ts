import { Request, Response, NextFunction } from 'express';

export interface PluginAPI {
  registerView(id: string, bundlePath: string): void;
  registerSidebarItem(id: string, label: string, icon: string | undefined, viewId: string): void;
  registerRoute(
    method: 'get' | 'post' | 'put' | 'delete',
    routePath: string,
    handler: (req: Request, res: Response, next: NextFunction) => void
  ): void;
  getState(key: string): Promise<any>;
  setState(key: string, value: any): Promise<void>;
  on(event: string, handler: (data: any) => void): void;
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

export interface LoadedPlugin {
  manifest: PluginManifest;
  directory: string;
  rendererEntry?: string;
}
