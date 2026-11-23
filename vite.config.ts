import { fileURLToPath } from 'node:url'
import config from './src/data/config.json'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: [],
    manifest: {
      id: './', name: config.title+'｜副業のススメ', short_name: config.word+' STUDY',
      description: config.qualName+'の非公式の重点学習教材。',
      lang: 'ja', start_url: './', scope: './', display: 'standalone',
      theme_color: '#172f3e', background_color: '#f4f7f7',
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      clientsClaim: true, cleanupOutdatedCaches: true,
      dontCacheBustURLsMatching: /\/assets\/.*-[\w-]{8}\.(?:js|css)$/,
      globPatterns: ['**/*.{js,css,html,json,png,svg,webmanifest,txt,xlsx,zip}'],
      navigateFallback: 'index.html'
    }
  })],
  build: { rollupOptions: { output: { manualChunks(id) {
    if (id.includes('/node_modules/zod/')) return 'validation'
    if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor'
  } } } },
  test: {
    environment: 'jsdom', setupFiles: fileURLToPath(new URL('./src/test/setup.ts', import.meta.url)),
    include: ['src/**/*.test.{ts,tsx}'], restoreMocks: true
  }
})
