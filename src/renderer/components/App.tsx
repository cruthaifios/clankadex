import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Stack, Paper, IconButton, Chip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import { ModelEntry, AppConfig } from '../types';
import * as api from '../api';
import { Sidebar } from './Sidebar';
import { AddModelDialog } from './AddModelDialog';
import { SettingsPanel } from './SettingsPanel';

export function App() {
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [runningModelId, setRunningModelId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const loadModels = useCallback(async () => {
    const data = await api.fetchModels();
    setModels(data.models);
    setRunningModelId(data.runningModelId);
  }, []);

  useEffect(() => { loadModels(); }, [loadModels]);
  useEffect(() => { api.fetchConfig().then(setConfig); }, []);

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'output') {
        setTerminalOutput(prev => prev + msg.data);
      } else if (msg.type === 'status') {
        loadModels();
        if (msg.status === 'stopped') {
          setTerminalOutput(prev => prev + '\n[Process exited]\n');
        }
      }
    };
    wsRef.current = ws;
    return () => ws.close();
  }, [loadModels]);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalOutput]);

  const selectedModel = models.find(m => m.id === selectedId) || null;
  const isRunning = selectedModel?.id === runningModelId;

  const handleStart = async () => {
    if (!selectedModel) return;
    setTerminalOutput('');
    const result = await api.startModel(selectedModel.id);
    if (result.error) setTerminalOutput(`Error: ${result.error}\n`);
    else loadModels();
  };

  const handleStop = async () => {
    await api.stopModel();
    loadModels();
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const prompt = chatInput.trim();
    setChatInput('');
    setTerminalOutput(prev => prev + `\n> ${prompt}\n`);
    try {
      const result = await api.sendChat(prompt);
      if (result.content) setTerminalOutput(prev => prev + result.content + '\n');
      else if (result.error) setTerminalOutput(prev => prev + `[Error: ${result.error}]\n`);
    } catch (err: any) {
      setTerminalOutput(prev => prev + `[Error: ${err.message}]\n`);
    }
  };

  const handleAddModel = async (data: Partial<ModelEntry>) => {
    await api.addModel(data);
    setShowAddDialog(false);
    loadModels();
  };

  const handleDeleteModel = async (id: string) => {
    await api.deleteModel(id);
    if (selectedId === id) setSelectedId(null);
    loadModels();
  };

  if (showSettings && config) {
    return (
      <SettingsPanel
        config={config}
        onSave={async (c: Partial<AppConfig>) => {
          const updated = await api.updateConfig(c);
          setConfig(updated);
          setShowSettings(false);
        }}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        models={models}
        selectedId={selectedId}
        runningModelId={runningModelId}
        onSelect={setSelectedId}
        onDelete={handleDeleteModel}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Stack direction="row">
            <img src="Clankadex-small" />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Clankadex
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddDialog(true)}>
              Add Model
            </Button>
            <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => setShowSettings(true)}
              sx={{ borderColor: '#555', color: 'text.primary', '&:hover': { borderColor: '#888' } }}>
              Settings
            </Button>
          </Stack>
        </Stack>

        {/* Main content */}
        {!selectedModel ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary" variant="h6">← Select a model from the sidebar</Typography>
          </Box>
        ) : (
          <>
            {/* Model detail header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{
                  width: 12, height: 12, borderRadius: '50%',
                  bgcolor: isRunning ? 'primary.main' : 'grey.700',
                }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>
                  {selectedModel.name}
                </Typography>
              </Stack>
              <Box>
                {!isRunning ? (
                  <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={handleStart}>
                    Start
                  </Button>
                ) : (
                  <Button variant="contained" color="secondary" startIcon={<StopIcon />} onClick={handleStop}>
                    Stop
                  </Button>
                )}
              </Box>
            </Stack>

            {/* Model metadata chips */}
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
              <Chip label={selectedModel.format.toUpperCase()} size="small" variant="outlined" />
              <Chip label={`ctx: ${selectedModel.contextSize}`} size="small" variant="outlined" />
              <Chip label={`GPU layers: ${selectedModel.gpuLayers}`} size="small" variant="outlined" />
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                {selectedModel.filePath}
              </Typography>
            </Stack>

            {/* Terminal output */}
            <Paper
              ref={terminalRef}
              elevation={0}
              sx={{
                flex: 1, bgcolor: '#0d0d1a', borderRadius: 2, p: 1.5,
                fontFamily: '"Fira Code", "Consolas", monospace', fontSize: 13, color: 'primary.main',
                overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', mb: 1.5,
                border: '1px solid', borderColor: 'divider', minHeight: 200,
              }}
            >
              {terminalOutput || (isRunning ? 'Waiting for output...' : 'Model not running. Click Start to begin.')}
            </Paper>

            {/* Chat input */}
            <Stack direction="row" spacing={1}>
              <TextField
                placeholder={isRunning ? 'Type a message...' : 'Start the model to chat'}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChat()}
                disabled={!isRunning}
                sx={{ flex: 1 }}
              />
              <Button variant="contained" onClick={handleChat} disabled={!isRunning}>
                Send
              </Button>
            </Stack>
          </>
        )}
      </Box>

      {showAddDialog && (
        <AddModelDialog
          defaultContextSize={config?.defaultContextSize || 2048}
          defaultGpuLayers={config?.defaultGpuLayers || 0}
          onAdd={handleAddModel}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </Box>
  );
}
