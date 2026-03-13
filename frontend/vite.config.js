import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Provide a minimal process.env for libraries that expect it
    'process.env': {},
    // Ensure global is defined (some libraries expect it)
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Polyfill process and buffer
      process: 'process/browser',
      buffer: 'buffer',
    },
  },
})