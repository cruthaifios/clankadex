import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Stack, Paper, Divider, Chip,
} from '@mui/material';
import ExtensionIcon from '@mui/icons-material/Extension';
import { AppConfig, PluginInfo } from '../types';
import { BrowseField } from './BrowseField';

interface Props {
  config: AppConfig;
  plugins?: PluginInfo[];
  onSave: (config: Partial<AppConfig>) => void;
  onClose: () => void;
}

export function SettingsPanel({ config, plugins = [], onSave, onClose }: Props) {
  const [llamaCppPath, setLlamaCppPath] = useState(config.llamaCppPath);
  const [defaultContextSize, setDefaultContextSize] = useState(config.defaultContextSize);
  const [defaultGpuLayers, setDefaultGpuLayers] = useState(config.defaultGpuLayers);
  const [serverPort, setServerPort] = useState(config.serverPort);

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', py: 4 }}>
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

        {/* Plugins section */}
        <Divider sx={{ my: 3 }} />
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <ExtensionIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5 }}>
            Installed Plugins
          </Typography>
        </Stack>

        {plugins.length === 0 ? (
          <Box sx={{ p: 2, bgcolor: '#0d0d1a', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              No plugins installed. Drop a plugin folder into{' '}
              <code style={{ color: '#ECDC51' }}>~/.clankadex/plugins/</code> and restart.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {plugins.map(plugin => (
              <Box
                key={plugin.name}
                sx={{
                  p: 1.5, bgcolor: '#0d0d1a', borderRadius: 1,
                  border: '1px solid', borderColor: 'divider',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#fff' }}>
                      {plugin.name}
                    </Typography>
                    <Chip label={`v${plugin.version}`} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                  </Stack>
                  <Chip
                    label={plugin.enabled ? 'active' : 'disabled'}
                    size="small"
                    color={plugin.enabled ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ height: 18, fontSize: 10 }}
                  />
                </Stack>
                {plugin.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {plugin.description}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}

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
