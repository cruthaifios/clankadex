import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Stack, Paper,
} from '@mui/material';
import { ModelEntry } from '../types';

interface Props {
  modelId: string;
  model: ModelEntry;
  defaultContextSize: number;
  defaultGpuLayers: number;
  onSave: (settings: Partial<ModelEntry>) => void;
  onClose: () => void;
}

export function ModelSettingsDialog({ modelId, model, defaultContextSize, defaultGpuLayers, onSave, onClose }: Props) {
  const [contextSize, setContextSize] = useState(defaultContextSize);
  const [gpuLayers, setGpuLayers] = useState(defaultGpuLayers);
  const [name, setName] = useState(model.name);
  const [host, setHost] = useState(model.host);
  const [port, setPort] = useState(model.port);
  const [notes, setNotes] = useState(model.notes);
  const [filePath, setFilePath] = useState(model.filePath);

  useEffect(() => {
    setContextSize(model.contextSize || defaultContextSize);
    setGpuLayers(model.gpuLayers || defaultGpuLayers);
  }, [modelId, defaultContextSize, defaultGpuLayers]);

  const handleSubmit = async () => {
    onSave({ ...model, contextSize, gpuLayers, name, host, port, notes });
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper sx={{ p: 4, width: 450, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ color: 'primary.main', mb: 3 }}>
          ⚙ Model Settings
        </Typography>

        <Stack spacing={2.5}>
          <TextField
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Remote Llama 70B"
          />
          <TextField
            label="File Path *"
            value={filePath}
            onChange={e => setFilePath(e.target.value)}
            placeholder="/path/to/model.gguf"
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

        {!model.remote && (
          <Stack spacing={2.5}>
            <TextField
              label="Context Size"
              type="number"
              value={contextSize}
              onChange={e => setContextSize(Number(e.target.value))}
            />

            <Box>
              <TextField
                label="GPU Layers"
                type="number"
                value={gpuLayers}
                onChange={e => setGpuLayers(Number(e.target.value))}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                0 = CPU only. Increase for GPU offloading.
              </Typography>
            </Box>
          </Stack>
        )}

        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 3 }}>
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
          >
            Save
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}