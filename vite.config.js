import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// Standalone Proofly: React + Vite frontend talking to the local Node backend
// (see /server) via the /api proxy. No base44 cloud dependency.
export default defineConfig({
  logLevel: 'error',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
