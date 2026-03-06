import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Stack, Paper, } from '@mui/material';
export function ModelSettingsDialog({ modelId, model, defaultContextSize, defaultGpuLayers, onSave, onClose }) {
    const [contextSize, setContextSize] = useState(defaultContextSize);
    const [gpuLayers, setGpuLayers] = useState(defaultGpuLayers);
    useEffect(() => {
        setContextSize(model.contextSize || defaultContextSize);
        setGpuLayers(model.gpuLayers || defaultGpuLayers);
    }, [modelId, defaultContextSize, defaultGpuLayers]);
    const handleSubmit = async () => {
        onSave({ ...model, contextSize, gpuLayers });
    };
    return (_jsx(Box, { sx: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsxs(Paper, { sx: { p: 4, width: 450, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }, children: [_jsx(Typography, { variant: "h6", sx: { color: 'primary.main', mb: 3 }, children: "\u2699 Model Settings" }), _jsxs(Stack, { spacing: 2.5, children: [_jsx(TextField, { label: "Context Size", type: "number", value: contextSize, onChange: e => setContextSize(Number(e.target.value)) }), _jsxs(Box, { children: [_jsx(TextField, { label: "GPU Layers", type: "number", value: gpuLayers, onChange: e => setGpuLayers(Number(e.target.value)) }), _jsx(Typography, { variant: "caption", color: "text.secondary", sx: { mt: 0.5, display: 'block' }, children: "0 = CPU only. Increase for GPU offloading." })] })] }), _jsxs(Stack, { direction: "row", justifyContent: "flex-end", spacing: 1, sx: { mt: 3 }, children: [_jsx(Button, { onClick: onClose, sx: { color: 'text.secondary' }, children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: handleSubmit, children: "Save" })] })] }) }));
}
