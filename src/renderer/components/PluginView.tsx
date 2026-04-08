import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { createRoot, Root } from 'react-dom/client';

interface Props {
  pluginName: string;
  viewId: string;
}

export function PluginView({ pluginName, viewId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactRootRef = useRef<Root | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Remove any stale script tag for this view
    const scriptId = `plugin-script-${pluginName}-${viewId}`;
    document.getElementById(scriptId)?.remove();

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `/api/plugins/${encodeURIComponent(pluginName)}/view/${encodeURIComponent(viewId)}`;

    script.onload = () => {
      try {
        const safeName = pluginName.replace(/[^a-zA-Z0-9_]/g, '_');
        const bundle = (window as any)[`__clankadexPlugin_${safeName}`];
        const Component = bundle?.default;

        if (!Component) {
          setError(`Plugin "${pluginName}" did not export a default React component.`);
          setLoading(false);
          return;
        }

        if (containerRef.current) {
          if (reactRootRef.current) reactRootRef.current.unmount();
          reactRootRef.current = createRoot(containerRef.current);
          reactRootRef.current.render(React.createElement(Component));
        }
      } catch (err: any) {
        setError(`Error rendering plugin view: ${err.message}`);
      }
      setLoading(false);
    };

    script.onerror = () => {
      setError(`Could not load bundle for plugin "${pluginName}" / view "${viewId}".`);
      setLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      if (reactRootRef.current) {
        reactRootRef.current.unmount();
        reactRootRef.current = null;
      }
      document.getElementById(scriptId)?.remove();
    };
  }, [pluginName, viewId]);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', position: 'relative' }}>
      {loading && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={32} />
        </Box>
      )}
      {!loading && error && (
        <Box sx={{ p: 3 }}>
          <Typography color="error" variant="body2">{error}</Typography>
        </Box>
      )}
      <Box ref={containerRef} sx={{ flex: 1 }} />
    </Box>
  );
}
