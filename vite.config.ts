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
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
          'vendor-icons':  ['lucide-react'],
          'vendor-three':  ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/esp32': {
        target: process.env.VITE_ESP32_TARGET || 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/esp32/, ''),
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            // Non-fatal error handling so dev server doesn't crash if ESP32 is offline
            if ('writeHead' in res && typeof res.writeHead === 'function') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'ESP32 proxy target unreachable',
                target: process.env.VITE_ESP32_TARGET || 'http://localhost:8080'
              }));
            }
          });
        },
      },
    },
  },
});

