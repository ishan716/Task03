import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  // Add these build options
  build: {
    rollupOptions: {
      external: []
    }
  }
})