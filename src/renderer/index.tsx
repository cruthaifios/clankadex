import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import { App } from './components/App';

// Expose React globals so plugin view bundles can use them as externals
(window as any).React = React;
(window as any).ReactDOM = { createRoot };

const root = createRoot(document.getElementById('root')!);
root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);
