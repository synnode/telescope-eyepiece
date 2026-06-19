import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'public',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: resolve(__dirname, 'resources/js/main.tsx'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
  },
})
