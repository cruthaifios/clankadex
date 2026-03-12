import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Stack, Paper,
} from '@mui/material';
import { AppConfig, ModelEntry } from '../types';
import { BrowseField } from './BrowseField';

interface Props {
  config: AppConfig;
  onSave: (config: Partial<AppConfig>) => void;
  onClose: () => void;
}

export function SettingsPanel({ config, onSave, onClose }: Props) {
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
            <BrowseField
              label="llama.cpp Server Path"
              placeholder="/usr/local/bin/llama-server"
              value={llamaCppPath}
              onChange={value => setLlamaCppPath(value)}
              browseType={"file"}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Path to llama-server
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
