import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // allow network access by default (0.0.0.0). Use --host to enable network binding too.
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/assets/banners': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
    // Security headers to prevent browser privacy warnings
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  },
})
