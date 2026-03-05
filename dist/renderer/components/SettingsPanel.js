import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, TextField, Button, Stack, Paper, } from '@mui/material';
export function SettingsPanel(props) {
    if (props.mode === 'remote') {
        return _jsx(RemoteModelSettings, { model: props.model, onSave: props.onSave, onClose: props.onClose });
    }
    return _jsx(GlobalSettings, { config: props.config, onSave: props.onSave, onClose: props.onClose });
}
function RemoteModelSettings({ model, onSave, onClose }) {
    const [name, setName] = useState(model.name);
    const [host, setHost] = useState(model.host);
    const [port, setPort] = useState(model.port);
    const [notes, setNotes] = useState(model.notes);
    return (_jsx(Box, { sx: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsxs(Paper, { sx: { p: 4, width: 500, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }, children: [_jsx(Typography, { variant: "h5", sx: { color: 'primary.main', mb: 1 }, children: "\u2699 Remote Model Settings" }), _jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: ["Configure connection for \"", model.name, "\""] }), _jsxs(Stack, { spacing: 2.5, children: [_jsx(TextField, { label: "Name", value: name, onChange: e => setName(e.target.value), placeholder: "e.g. Remote Llama 70B" }), _jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(TextField, { label: "Host", value: host, onChange: e => setHost(e.target.value), placeholder: "192.168.1.100", sx: { flex: 1 } }), _jsx(TextField, { label: "Port", type: "number", value: port, onChange: e => setPort(Number(e.target.value)), sx: { width: 120 } })] }), _jsx(TextField, { label: "Description / Notes", multiline: true, rows: 3, value: notes, onChange: e => setNotes(e.target.value), placeholder: "Optional notes about this remote server..." })] }), _jsxs(Stack, { direction: "row", justifyContent: "flex-end", spacing: 1, sx: { mt: 3 }, children: [_jsx(Button, { onClick: onClose, sx: { color: 'text.secondary' }, children: "Cancel" }), _jsx(Button, { variant: "contained", disabled: !name.trim() || !host.trim() || !port, onClick: () => onSave({ name: name.trim(), host: host.trim(), port, notes }), children: "Save" })] })] }) }));
}
function GlobalSettings({ config, onSave, onClose }) {
    const [llamaCppPath, setLlamaCppPath] = useState(config.llamaCppPath);
    const [defaultContextSize, setDefaultContextSize] = useState(config.defaultContextSize);
    const [defaultGpuLayers, setDefaultGpuLayers] = useState(config.defaultGpuLayers);
    const [serverPort, setServerPort] = useState(config.serverPort);
    return (_jsx(Box, { sx: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsxs(Paper, { sx: { p: 4, width: 500, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }, children: [_jsx(Typography, { variant: "h5", sx: { color: 'primary.main', mb: 3 }, children: "\u2699 Settings" }), _jsxs(Stack, { spacing: 2.5, children: [_jsxs(Box, { children: [_jsx(TextField, { label: "llama.cpp Server Path", value: llamaCppPath, onChange: e => setLlamaCppPath(e.target.value), placeholder: "/usr/local/bin/llama-server" }), _jsx(Typography, { variant: "caption", color: "text.secondary", sx: { mt: 0.5, display: 'block' }, children: "Path to llama-server or llama-cli binary" })] }), _jsx(TextField, { label: "Default Context Size", type: "number", value: defaultContextSize, onChange: e => setDefaultContextSize(Number(e.target.value)) }), _jsxs(Box, { children: [_jsx(TextField, { label: "Default GPU Layers", type: "number", value: defaultGpuLayers, onChange: e => setDefaultGpuLayers(Number(e.target.value)) }), _jsx(Typography, { variant: "caption", color: "text.secondary", sx: { mt: 0.5, display: 'block' }, children: "0 = CPU only. Increase for GPU offloading." })] }), _jsx(TextField, { label: "Default Model Server Port", type: "number", value: serverPort, onChange: e => setServerPort(Number(e.target.value)) })] }), _jsxs(Stack, { direction: "row", justifyContent: "flex-end", spacing: 1, sx: { mt: 3 }, children: [_jsx(Button, { onClick: onClose, sx: { color: 'text.secondary' }, children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: () => onSave({ llamaCppPath, defaultContextSize, defaultGpuLayers, serverPort }), children: "Save" })] })] }) }));
}
