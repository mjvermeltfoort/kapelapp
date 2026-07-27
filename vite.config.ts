import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifestFilename: 'manifest.json',
      includeAssets: ['favicon-v2.png', 'apple-touch-icon-v2.png', 'icons.svg', 'logo-v2.png'],
      manifest: {
        id: '/',
        name: 'Kapel App',
        short_name: 'Kapel App',
        description: 'Planning en afstemming voor kapellen en optredens.',
        theme_color: '#2456d6',
        background_color: '#f3f7fb',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192-v2.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512-v2.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-512-v2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512-v2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],

      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
      },
    }),
  ],
})
