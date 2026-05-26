/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { gridworldWS } from './ws-plugin'

export default defineConfig({
  plugins: [react(), gridworldWS()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
