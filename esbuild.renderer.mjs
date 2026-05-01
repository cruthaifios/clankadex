import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'fs';

// Copy index.html to dist
mkdirSync('dist/renderer', { recursive: true });
copyFileSync('src/renderer/index.html', 'dist/renderer/index.html');

// Copy font to dist/renderer/font
mkdirSync('dist/renderer/font', { recursive: true });
copyFileSync('src/renderer/assets/font/KdamThmorPro-Regular.ttf', 'dist/renderer/font/KdamThmorPro-Regular.ttf');

await build({
  entryPoints: ['src/renderer/index.tsx'],
  bundle: true,
  outfile: 'dist/renderer/bundle.js',
  platform: 'browser',
  format: 'iife',
  target: 'es2020',
  loader: { '.tsx': 'tsx', '.ts': 'ts', '.css': 'css' },
  define: {
    'process.env.NODE_ENV': '"development"'
  },
});

console.log('Renderer bundle built.');
