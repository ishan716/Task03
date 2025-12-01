import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Add this for Vercel deployment:
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  // For routing (if using React Router):
  server: {
    historyApiFallback: true
  }
}) 