import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',   // sockjs-client necesita 'global'
  },
  server: {
    port: 5173,
  },
})
