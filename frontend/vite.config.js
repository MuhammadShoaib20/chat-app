import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},                // minimal process.env
    global: 'globalThis',              // ensure global is defined
  },
  resolve: {
    alias: {
      process: 'process/browser',      // polyfill process
      buffer: 'buffer',                 // polyfill buffer (optional)
    },
  },
})