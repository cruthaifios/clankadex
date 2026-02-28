import React from 'react';
import {
  Box, Typography, List, ListItemButton, ListItemText, ListItemIcon, IconButton,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CircleIcon from '@mui/icons-material/Circle';
import { ModelEntry } from '../types';

interface Props {
  models: ModelEntry[];
  selectedId: string | null;
  runningModelId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function Sidebar({ models, selectedId, runningModelId, onSelect, onDelete }: Props) {
  return (
    <Box sx={{
      width: 280, bgcolor: '#16162a', borderRight: '1px solid', borderColor: 'divider',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5 }}>
          Models
        </Typography>
      </Box>

      <List sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
        {models.length === 0 ? (
          <Box sx={{ p: 2.5, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No models yet.<br />Click "+ Add Model" to get started.
            </Typography>
          </Box>
        ) : (
          models.map(m => (
            <ListItemButton
              key={m.id}
              selected={m.id === selectedId}
              onClick={() => onSelect(m.id)}
              sx={{
                borderRadius: 1.5, mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: '#2a2a4a',
                  border: '1px solid',
                  borderColor: 'primary.main',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CircleIcon sx={{
                  fontSize: 10,
                  color: m.id === runningModelId ? 'primary.main' : 'grey.700',
                }} />
              </ListItemIcon>
              <ListItemText
                primary={m.name}
                secondary={m.format.toUpperCase()}
                primaryTypographyProps={{ fontSize: 14 }}
                secondaryTypographyProps={{ fontSize: 11 }}
              />
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onDelete(m.id); }}
                sx={{ color: 'grey.600', '&:hover': { color: 'secondary.main' } }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </ListItemButton>
          ))
        )}
      </List>
    </Box>
  );
}
