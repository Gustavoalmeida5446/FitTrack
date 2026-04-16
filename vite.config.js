import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base avoids white screen on GitHub Pages when repo name/path changes.
  base: './'
})
