import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Stack, Paper,
} from '@mui/material';
import { AppConfig, ModelEntry } from '../types';

interface GlobalProps {
  mode: 'global';
  config: AppConfig;
  onSave: (config: Partial<AppConfig>) => void;
  onClose: () => void;
}

interface RemoteProps {
  mode: 'remote';
  model: ModelEntry;
  onSave: (data: Partial<ModelEntry>) => void;
  onClose: () => void;
}

type Props = GlobalProps | RemoteProps;

export function SettingsPanel(props: Props) {
  if (props.mode === 'remote') {
    return <RemoteModelSettings model={props.model} onSave={props.onSave} onClose={props.onClose} />;
  }
  return <GlobalSettings config={props.config} onSave={props.onSave} onClose={props.onClose} />;
}

function RemoteModelSettings({ model, onSave, onClose }: { model: ModelEntry; onSave: (data: Partial<ModelEntry>) => void; onClose: () => void }) {
  const [name, setName] = useState(model.name);
  const [host, setHost] = useState(model.host);
  const [port, setPort] = useState(model.port);
  const [notes, setNotes] = useState(model.notes);

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper sx={{ p: 4, width: 500, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ color: 'primary.main', mb: 1 }}>⚙ Remote Model Settings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure connection for "{model.name}"
        </Typography>

        <Stack spacing={2.5}>
          <TextField
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Remote Llama 70B"
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Host"
              value={host}
              onChange={e => setHost(e.target.value)}
              placeholder="192.168.1.100"
              sx={{ flex: 1 }}
            />
            <TextField
              label="Port"
              type="number"
              value={port}
              onChange={e => setPort(Number(e.target.value))}
              sx={{ width: 120 }}
            />
          </Stack>
          <TextField
            label="Description / Notes"
            multiline
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes about this remote server..."
          />
        </Stack>

        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 3 }}>
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!name.trim() || !host.trim() || !port}
            onClick={() => onSave({ name: name.trim(), host: host.trim(), port, notes })}
          >
            Save
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

function GlobalSettings({ config, onSave, onClose }: { config: AppConfig; onSave: (config: Partial<AppConfig>) => void; onClose: () => void }) {
  const [llamaCppPath, setLlamaCppPath] = useState(config.llamaCppPath);
  const [defaultContextSize, setDefaultContextSize] = useState(config.defaultContextSize);
  const [defaultGpuLayers, setDefaultGpuLayers] = useState(config.defaultGpuLayers);
  const [serverPort, setServerPort] = useState(config.serverPort);

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper sx={{ p: 4, width: 500, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ color: 'primary.main', mb: 3 }}>⚙ Settings</Typography>

        <Stack spacing={2.5}>
          <Box>
            <TextField
              label="llama.cpp Server Path"
              value={llamaCppPath}
              onChange={e => setLlamaCppPath(e.target.value)}
              placeholder="/usr/local/bin/llama-server"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Path to llama-server or llama-cli binary
            </Typography>
          </Box>

          <TextField
            label="Default Context Size"
            type="number"
            value={defaultContextSize}
            onChange={e => setDefaultContextSize(Number(e.target.value))}
          />

          <Box>
            <TextField
              label="Default GPU Layers"
              type="number"
              value={defaultGpuLayers}
              onChange={e => setDefaultGpuLayers(Number(e.target.value))}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              0 = CPU only. Increase for GPU offloading.
            </Typography>
          </Box>

          <TextField
            label="Default Model Server Port"
            type="number"
            value={serverPort}
            onChange={e => setServerPort(Number(e.target.value))}
          />
        </Stack>

        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 3 }}>
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => onSave({ llamaCppPath, defaultContextSize, defaultGpuLayers, serverPort })}
          >
            Save
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
