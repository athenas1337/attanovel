import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// - For GitHub Pages: set GITHUB_PAGES=true in your build environment
// - For Vercel / root-domain hosting: no env var needed (base = '/')
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/attanovel/' : '/',
  build: {
    // Increase chunk size warning limit to suppress 500kB warning
    chunkSizeWarningLimit: 1500,
  },
})
