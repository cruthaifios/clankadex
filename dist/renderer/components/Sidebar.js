import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography, List, ListItemButton, ListItemText, ListItemIcon, IconButton, } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CircleIcon from '@mui/icons-material/Circle';
export function Sidebar({ models, selectedId, runningModelId, onSelect, onDelete }) {
    return (_jsxs(Box, { sx: {
            width: 280, bgcolor: '#16162a', borderRight: '1px solid', borderColor: 'divider',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }, children: [_jsx(Box, { sx: { px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }, children: _jsx(Typography, { variant: "overline", color: "text.secondary", sx: { letterSpacing: 1.5 }, children: "Models" }) }), _jsx(List, { sx: { flex: 1, overflowY: 'auto', px: 1 }, children: models.length === 0 ? (_jsx(Box, { sx: { p: 2.5, textAlign: 'center' }, children: _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["No models yet.", _jsx("br", {}), "Click \"+ Add Model\" to get started."] }) })) : (models.map(m => (_jsxs(ListItemButton, { selected: m.id === selectedId, onClick: () => onSelect(m.id), sx: {
                        borderRadius: 1.5, mb: 0.5,
                        '&.Mui-selected': {
                            bgcolor: '#2a2a4a',
                            border: '1px solid',
                            borderColor: 'primary.main',
                        },
                    }, children: [_jsx(ListItemIcon, { sx: { minWidth: 28 }, children: _jsx(CircleIcon, { sx: {
                                    fontSize: 10,
                                    color: m.id === runningModelId ? 'primary.main' : 'grey.700',
                                } }) }), _jsx(ListItemText, { primary: m.name, secondary: m.format.toUpperCase(), primaryTypographyProps: { fontSize: 14 }, secondaryTypographyProps: { fontSize: 11 } }), _jsx(IconButton, { size: "small", onClick: (e) => { e.stopPropagation(); onDelete(m.id); }, sx: { color: 'grey.600', '&:hover': { color: 'secondary.main' } }, children: _jsx(DeleteOutlineIcon, { fontSize: "small" }) })] }, m.id)))) })] }));
}
