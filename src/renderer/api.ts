import { ModelEntry, AppConfig } from './types';

const BASE = '';

export async function fetchModels(): Promise<{ models: ModelEntry[]; runningModelId: string | null; runningModelIds: string[] }> {
  const res = await fetch(`${BASE}/api/models`);
  return res.json();
}

export async function addModel(data: Partial<ModelEntry>): Promise<ModelEntry> {
  const res = await fetch(`${BASE}/api/models`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteModel(id: string): Promise<void> {
  await fetch(`${BASE}/api/models/${id}`, { method: 'DELETE' });
}

export async function updateModel(id: string, data: Partial<ModelEntry>): Promise<void> {
  const res = await fetch(`${BASE}/api/models/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function startModel(id: string): Promise<any> {
  const res = await fetch(`${BASE}/api/models/${id}/start`, { method: 'POST' });
  return res.json();
}

export async function stopModel(id?: string): Promise<void> {
  if (id) {
    await fetch(`${BASE}/api/models/${id}/stop`, { method: 'POST' });
  } else {
    await fetch(`${BASE}/api/models/stop`, { method: 'POST' });
  }
}

export async function sendChat(prompt: string, modelId?: string): Promise<any> {
  const res = await fetch(`${BASE}/api/models/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, modelId }),
  });
  return res.json();
}

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch(`${BASE}/api/config`);
  return res.json();
}

export async function updateConfig(data: Partial<AppConfig>): Promise<AppConfig> {
  const res = await fetch(`${BASE}/api/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function checkPrerequisites(): Promise<Record<string, any>> {
  const res = await fetch(`${BASE}/api/prerequisites/check`);
  return res.json();
}
