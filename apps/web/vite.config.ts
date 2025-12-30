import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    force: true, // Force re-bundling on every dev server start
  },
  server: {
    port: 4000,
    open: true,
    watch: {
      usePolling: true, // Better file watching in Docker/WSL
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
