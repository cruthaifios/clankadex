import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack,
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
  const [filePath, setFilePath] = useState('');
  const [format, setFormat] = useState('gguf');
  const [contextSize, setContextSize] = useState(defaultContextSize);
  const [gpuLayers, setGpuLayers] = useState(defaultGpuLayers);
  const [notes, setNotes] = useState('');

  const canSubmit = name.trim() && filePath.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd({ name: name.trim(), filePath: filePath.trim(), format, contextSize, gpuLayers, notes });
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: 'background.paper' } }}>
      <DialogTitle sx={{ color: 'primary.main' }}>Add Model</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name *" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mistral 7B Q4" />
          <TextField label="File Path *" value={filePath} onChange={e => setFilePath(e.target.value)} placeholder="/path/to/model.gguf" />
          <TextField label="Format" value={format} onChange={e => setFormat(e.target.value)} placeholder="gguf" />
          <Stack direction="row" spacing={2}>
            <TextField label="Context Size" type="number" value={contextSize} onChange={e => setContextSize(Number(e.target.value))} />
            <TextField label="GPU Layers" type="number" value={gpuLayers} onChange={e => setGpuLayers(Number(e.target.value))} />
          </Stack>
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
