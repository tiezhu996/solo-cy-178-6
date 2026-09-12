import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendProxyTarget = process.env.VITE_BACKEND_PROXY_TARGET || 'http://backend:9178';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8178,
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/api': backendProxyTarget,
      '/uploads': backendProxyTarget
    }
  }
});
