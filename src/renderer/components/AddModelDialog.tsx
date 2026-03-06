import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack,
  FormControlLabel, Checkbox,
} from '@mui/material';
import { ModelEntry } from '../types';

interface Props {
  defaultContextSize: number;
  defaultGpuLayers: number;
  onAdd: (data: Partial<ModelEntry>) => void;
  onClose: () => void;
}

export function AddModelDialog({ defaultContextSize, defaultGpuLayers, onAdd, onClose }: Props) {
  const [name, setName] = useState('');
  const [remote, setRemote] = useState(false);
  const [filePath, setFilePath] = useState('');
  const [format, setFormat] = useState('gguf');
  const [contextSize, setContextSize] = useState(defaultContextSize);
  const [gpuLayers, setGpuLayers] = useState(defaultGpuLayers);
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState(8080);
  const [notes, setNotes] = useState('');

  const canSubmit = remote
    ? name.trim() && host.trim() && port > 0
    : name.trim() && filePath.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (remote) {
      onAdd({ name: name.trim(), remote: true, host: host.trim(), port, notes, filePath: '', format: '', contextSize: 0, gpuLayers: 0 });
    } else {
      onAdd({ name: name.trim(), remote: false, filePath: filePath.trim(), format, contextSize, gpuLayers, port, host: '127.0.0.1', notes });
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: 'background.paper' } }}>
      <DialogTitle sx={{ color: 'primary.main' }}>Add Model</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name *" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mistral 7B Q4" />
          <FormControlLabel
            control={<Checkbox checked={remote} onChange={e => setRemote(e.target.checked)} />}
            label="Remote Model"
          />
          {remote ? (
            <Stack direction="row" spacing={2}>
              <TextField label="Host *" value={host} onChange={e => setHost(e.target.value)} placeholder="192.168.1.100" sx={{ flex: 1 }} />
              <TextField label="Port *" type="number" value={port} onChange={e => setPort(Number(e.target.value))} sx={{ width: 120 }} />
            </Stack>
          ) : (
            <>
              <TextField label="File Path *" value={filePath} onChange={e => setFilePath(e.target.value)} placeholder="/path/to/model.gguf" />
              <TextField label="Format" value={format} onChange={e => setFormat(e.target.value)} placeholder="gguf" />
              <TextField label="Port" type="number" value={port} onChange={e => setPort(Number(e.target.value))} helperText="llama-server port for this model (default 8080)" sx={{ width: 160 }} />
            </>
          )}
          <TextField
            label="Notes"
            multiline rows={2}
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes about this model..."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>Add Model</Button>
      </DialogActions>
    </Dialog>
  );
}
