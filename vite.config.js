import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'analyze' &&
      visualizer({
        filename: 'stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    // Prevent duplicate React from symlinked @aviary-ui file: deps — hooks crash without this.
    dedupe: ['react', 'react-dom'],
  },
  server: {
    watch: {
      // Watch @aviary-ui dist/ so HMR fires when aviary-ui packages are rebuilt.
      ignored: (path) => path.includes('node_modules') && !path.includes('@aviary-ui'),
    },
  },
  optimizeDeps: {
    // Load @aviary-ui fresh on each rebuild — skip Vite's pre-bundle cache.
    exclude: ['@aviary-ui/core', '@aviary-ui/ui'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
}));
