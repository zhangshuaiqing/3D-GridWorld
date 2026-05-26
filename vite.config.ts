import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { gridworldWS } from './ws-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), gridworldWS()],
})
