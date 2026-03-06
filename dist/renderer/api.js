const BASE = '';
export async function fetchModels() {
    const res = await fetch(`${BASE}/api/models`);
    return res.json();
}
export async function addModel(data) {
    const res = await fetch(`${BASE}/api/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}
export async function deleteModel(id) {
    await fetch(`${BASE}/api/models/${id}`, { method: 'DELETE' });
}
export async function updateModel(id, data) {
    const res = await fetch(`${BASE}/api/models/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}
export async function startModel(id) {
    const res = await fetch(`${BASE}/api/models/${id}/start`, { method: 'POST' });
    return res.json();
}
export async function stopModel(id) {
    if (id) {
        await fetch(`${BASE}/api/models/${id}/stop`, { method: 'POST' });
    }
    else {
        await fetch(`${BASE}/api/models/stop`, { method: 'POST' });
    }
}
export async function sendChat(prompt, modelId) {
    const res = await fetch(`${BASE}/api/models/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, modelId }),
    });
    return res.json();
}
export async function fetchConfig() {
    const res = await fetch(`${BASE}/api/config`);
    return res.json();
}
export async function updateConfig(data) {
    const res = await fetch(`${BASE}/api/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}
export async function checkPrerequisites() {
    const res = await fetch(`${BASE}/api/prerequisites/check`);
    return res.json();
}
