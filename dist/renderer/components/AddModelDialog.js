import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack, } from '@mui/material';
export function AddModelDialog({ defaultContextSize, defaultGpuLayers, onAdd, onClose }) {
    const [name, setName] = useState('');
    const [filePath, setFilePath] = useState('');
    const [format, setFormat] = useState('gguf');
    const [contextSize, setContextSize] = useState(defaultContextSize);
    const [gpuLayers, setGpuLayers] = useState(defaultGpuLayers);
    const [notes, setNotes] = useState('');
    const canSubmit = name.trim() && filePath.trim();
    const handleSubmit = () => {
        if (!canSubmit)
            return;
        onAdd({ name: name.trim(), filePath: filePath.trim(), format, contextSize, gpuLayers, notes });
    };
    return (_jsxs(Dialog, { open: true, onClose: onClose, maxWidth: "sm", fullWidth: true, PaperProps: { sx: { bgcolor: 'background.paper' } }, children: [_jsx(DialogTitle, { sx: { color: 'primary.main' }, children: "Add Model" }), _jsx(DialogContent, { children: _jsxs(Stack, { spacing: 2, sx: { mt: 1 }, children: [_jsx(TextField, { label: "Name *", value: name, onChange: e => setName(e.target.value), placeholder: "e.g. Mistral 7B Q4" }), _jsx(TextField, { label: "File Path *", value: filePath, onChange: e => setFilePath(e.target.value), placeholder: "/path/to/model.gguf" }), _jsx(TextField, { label: "Format", value: format, onChange: e => setFormat(e.target.value), placeholder: "gguf" }), _jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(TextField, { label: "Context Size", type: "number", value: contextSize, onChange: e => setContextSize(Number(e.target.value)) }), _jsx(TextField, { label: "GPU Layers", type: "number", value: gpuLayers, onChange: e => setGpuLayers(Number(e.target.value)) })] }), _jsx(TextField, { label: "Notes", multiline: true, rows: 2, value: notes, onChange: e => setNotes(e.target.value), placeholder: "Optional notes about this model..." })] }) }), _jsxs(DialogActions, { sx: { px: 3, pb: 2 }, children: [_jsx(Button, { onClick: onClose, sx: { color: 'text.secondary' }, children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: handleSubmit, disabled: !canSubmit, children: "Add Model" })] })] }));
}
