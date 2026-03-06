import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, TextField, Stack, Paper, Chip, } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import * as api from '../api';
import { Sidebar } from './Sidebar';
import { AddModelDialog } from './AddModelDialog';
import { SettingsPanel } from './SettingsPanel';
import { ModelSettingsDialog } from './ModelSettingsDialog';
export function App() {
    const [models, setModels] = useState([]);
    const [runningModelIds, setRunningModelIds] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [terminalOutput, setTerminalOutput] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showModelSettingsDialog, setShowModelSettingsDialog] = useState(null);
    const [config, setConfig] = useState(null);
    const terminalRef = useRef(null);
    const wsRef = useRef(null);
    const loadModels = useCallback(async () => {
        const data = await api.fetchModels();
        setModels(data.models);
        setRunningModelIds(data.runningModelIds || []);
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
            }
            else if (msg.type === 'status') {
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
        if (terminalRef.current)
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }, [terminalOutput]);
    const selectedModel = models.find(m => m.id === selectedId) || null;
    const isRunning = selectedModel ? runningModelIds.includes(selectedModel.id) : false;
    const handleStart = async () => {
        if (!selectedModel)
            return;
        setTerminalOutput('');
        const result = await api.startModel(selectedModel.id);
        if (result.error)
            setTerminalOutput(`Error: ${result.error}\n`);
        else
            loadModels();
    };
    const handleStop = async () => {
        if (selectedModel)
            await api.stopModel(selectedModel.id);
        else
            await api.stopModel();
        loadModels();
    };
    const handleChat = async () => {
        if (!chatInput.trim())
            return;
        const prompt = chatInput.trim();
        setChatInput('');
        setTerminalOutput(prev => prev + `\n> ${prompt}\n`);
        try {
            const result = await api.sendChat(prompt, selectedModel?.id);
            if (result.content)
                setTerminalOutput(prev => prev + result.content + '\n');
            else if (result.error)
                setTerminalOutput(prev => prev + `[Error: ${result.error}]\n`);
        }
        catch (err) {
            setTerminalOutput(prev => prev + `[Error: ${err.message}]\n`);
        }
    };
    const handleAddModel = async (data) => {
        await api.addModel(data);
        setShowAddDialog(false);
        loadModels();
    };
    const handleDeleteModel = async (id) => {
        await api.deleteModel(id);
        if (selectedId === id)
            setSelectedId(null);
        loadModels();
    };
    const handleEditModelSettings = (id) => {
        setShowModelSettingsDialog(id);
    };
    const handleSaveModelSettings = async (settings) => {
        if (!selectedModel) {
            return;
        }
        // Update the specific model with settings
        const updatedModel = { ...selectedModel, contextSize: settings.contextSize, gpuLayers: settings.gpuLayers };
        const updatedModels = models.map((m) => m.id === showModelSettingsDialog ? updatedModel : m);
        // Save updated models back to JSON file
        api.updateModel(updatedModel.id, updatedModel);
        // Update local state
        setModels(updatedModels);
        setShowModelSettingsDialog(null);
    };
    if (showSettings && config) {
        return (_jsx(SettingsPanel, { config: config, onSave: async (c) => {
                const updated = await api.updateConfig(c);
                setConfig(updated);
                setShowSettings(false);
            }, onClose: () => setShowSettings(false) }));
    }
    return (_jsxs(Box, { sx: { display: 'flex', height: '100vh' }, children: [_jsx(Sidebar, { models: models, selectedId: selectedId, runningModelIds: runningModelIds, onSelect: setSelectedId, onDelete: handleDeleteModel, onEditModelSettings: handleEditModelSettings }), _jsxs(Box, { sx: { flex: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mb: 1.5 }, children: [_jsxs(Stack, { direction: "row", children: [_jsx("img", { src: "/img/Clankadex-small.png", style: { height: 32, marginRight: 8 } }), _jsx(Typography, { variant: "h5", sx: { fontWeight: 'bold', color: 'primary.main' }, children: "Clankadex" })] }), _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => setShowAddDialog(true), children: "Add Model" }), _jsx(Button, { variant: "outlined", startIcon: _jsx(SettingsIcon, {}), onClick: () => setShowSettings(true), sx: { borderColor: '#555', color: 'text.primary', '&:hover': { borderColor: '#888' } }, children: "Settings" })] })] }), !selectedModel ? (_jsx(Box, { sx: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(Typography, { color: "text.secondary", variant: "h6", children: "\u2190 Select a model from the sidebar" }) })) : (_jsxs(_Fragment, { children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mb: 1 }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(Box, { sx: {
                                                    width: 12, height: 12, borderRadius: '50%',
                                                    bgcolor: isRunning ? 'primary.main' : 'grey.700',
                                                } }), _jsx(Typography, { variant: "h6", sx: { fontWeight: 'bold', color: '#fff' }, children: selectedModel.name })] }), _jsx(Box, { children: !isRunning ? (_jsx(Button, { variant: "contained", startIcon: _jsx(PlayArrowIcon, {}), onClick: handleStart, children: "Start" })) : (_jsx(Button, { variant: "contained", color: "secondary", startIcon: _jsx(StopIcon, {}), onClick: handleStop, children: "Stop" })) })] }), _jsx(Stack, { direction: "row", spacing: 1, sx: { mb: 1.5, flexWrap: 'wrap' }, children: selectedModel.remote ? (_jsxs(_Fragment, { children: [_jsx(Chip, { label: "REMOTE", size: "small", color: "info", variant: "outlined" }), _jsx(Chip, { label: `${selectedModel.host}:${selectedModel.port}`, size: "small", variant: "outlined" })] })) : (_jsxs(_Fragment, { children: [_jsx(Chip, { label: selectedModel.format.toUpperCase(), size: "small", variant: "outlined" }), _jsx(Chip, { label: `ctx: ${selectedModel.contextSize}`, size: "small", variant: "outlined" }), _jsx(Chip, { label: `GPU layers: ${selectedModel.gpuLayers}`, size: "small", variant: "outlined" }), _jsx(Chip, { label: `port: ${selectedModel.port}`, size: "small", variant: "outlined" }), _jsx(Typography, { variant: "caption", color: "text.secondary", sx: { alignSelf: 'center' }, children: selectedModel.filePath })] })) }), _jsx(Paper, { ref: terminalRef, elevation: 0, sx: {
                                    flex: 1, bgcolor: '#0d0d1a', borderRadius: 2, p: 1.5,
                                    fontFamily: '"Fira Code", "Consolas", monospace', fontSize: 13, color: 'primary.main',
                                    overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', mb: 1.5,
                                    border: '1px solid', borderColor: 'divider', minHeight: 200,
                                }, children: terminalOutput || (isRunning ? 'Waiting for output...' : 'Model not running. Click Start to begin.') }), _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(TextField, { placeholder: isRunning ? 'Type a message...' : 'Start the model to chat', value: chatInput, onChange: e => setChatInput(e.target.value), onKeyDown: e => e.key === 'Enter' && handleChat(), disabled: !isRunning, sx: { flex: 1 } }), _jsx(Button, { variant: "contained", onClick: handleChat, disabled: !isRunning, children: "Send" })] })] }))] }), showAddDialog && (_jsx(AddModelDialog, { defaultContextSize: config?.defaultContextSize || 2048, defaultGpuLayers: config?.defaultGpuLayers || 0, onAdd: handleAddModel, onClose: () => setShowAddDialog(false) })), showModelSettingsDialog && selectedModel && (_jsx(ModelSettingsDialog, { modelId: showModelSettingsDialog, model: selectedModel, defaultContextSize: config?.defaultContextSize || 2048, defaultGpuLayers: config?.defaultGpuLayers || 0, onSave: handleSaveModelSettings, onClose: () => setShowModelSettingsDialog(null) }))] }));
}
