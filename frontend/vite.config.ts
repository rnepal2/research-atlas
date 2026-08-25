import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const dataSnapshotVersion = process.env.GITHUB_RUN_ID || Date.now().toString(36)

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/research-atlas/' : '/',
  define: {
    __DATA_SNAPSHOT_VERSION__: JSON.stringify(dataSnapshotVersion),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
