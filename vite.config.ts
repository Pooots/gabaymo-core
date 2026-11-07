/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Local only: must match Laravel APP_URL (php artisan serve).
  const apiOrigin =
    env.VITE_APP_URL || env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000'

  const proxy = {
    // Browser: http://localhost:3000/api/* → Laravel APP_URL /api/*
    '/api': {
      target: apiOrigin,
      changeOrigin: true,
    },
    '/storage': {
      target: apiOrigin,
      changeOrigin: true,
    },
    // Sanctum's XSRF-TOKEN cookie endpoint.
    '/sanctum': {
      target: apiOrigin,
      changeOrigin: true,
    },
  }

  return {
    plugins: [
      viteReact(),
      tailwindcss(),
      VitePWA({
        // Custom worker (src/sw/sw.ts): precache the app shell + static
        // assets, never cache API responses, offline.html for areas that
        // need the network. Members keep their last-opened answers via
        // src/lib/offlineAnswers.ts (localStorage), not the service worker.
        strategies: 'injectManifest',
        srcDir: 'src/sw',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectRegister: false,
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        },
        includeAssets: ['gabaymo-logo.png', 'offline.html'],
        manifest: {
          name: 'GabayMo',
          short_name: 'GabayMo',
          description:
            'Cited DepEd policy answers for Philippine public school teachers.',
          lang: 'en-PH',
          start_url: '/account',
          scope: '/',
          display: 'standalone',
          background_color: '#f4f7f4',
          theme_color: '#0e6b3e',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: { enabled: false },
      }),
      {
        name: 'html-transform',
        transformIndexHtml(html: string) {
          return html
            .replace(
              /%VITE_FRONTEND_URL%/g,
              env.VITE_FRONTEND_URL || 'http://localhost:3000',
            )
            .replace(/%VITE_APP_TITLE%/g, env.VITE_APP_TITLE || 'Gabaymo')
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy,
    },
    preview: {
      port: 3000,
      proxy,
    },
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
    },
  }
})
