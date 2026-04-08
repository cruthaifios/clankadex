import { Router } from 'express';

export interface RegistryViewEntry {
  pluginName: string;
  viewId: string;
  bundlePath: string;
}

export interface RegistrySidebarItem {
  pluginName: string;
  id: string;
  label: string;
  icon?: string;
  viewId: string;
}

class PluginRegistry {
  private views = new Map<string, RegistryViewEntry>();
  private sidebarItems: RegistrySidebarItem[] = [];
  private pluginRouters = new Map<string, Router>();

  registerView(pluginName: string, viewId: string, bundlePath: string): void {
    this.views.set(`${pluginName}:${viewId}`, { pluginName, viewId, bundlePath });
  }

  registerSidebarItem(pluginName: string, id: string, label: string, icon: string | undefined, viewId: string): void {
    this.sidebarItems.push({ pluginName, id, label, icon, viewId });
  }

  getOrCreateRouter(pluginName: string): Router {
    if (!this.pluginRouters.has(pluginName)) {
      this.pluginRouters.set(pluginName, Router());
    }
    return this.pluginRouters.get(pluginName)!;
  }

  getView(pluginName: string, viewId: string): RegistryViewEntry | undefined {
    return this.views.get(`${pluginName}:${viewId}`);
  }

  getSidebarItems(): RegistrySidebarItem[] {
    return [...this.sidebarItems];
  }

  getSidebarItemsByPlugin(pluginName: string): RegistrySidebarItem[] {
    return this.sidebarItems.filter(item => item.pluginName === pluginName);
  }

  getPluginRouters(): Map<string, Router> {
    return this.pluginRouters;
  }
}

export const pluginRegistry = new PluginRegistry();
