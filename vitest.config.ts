import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ['browser'],
    alias: {
      '$env/static/public': '/src/__mocks__/$env/static/public.ts',
      '$app/stores': '/src/__mocks__/$app/stores.ts',
      '$app/state': '/src/__mocks__/$app/state.ts',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts'],
    alias: {
      $lib: '/src/lib',
    },
  },
})
