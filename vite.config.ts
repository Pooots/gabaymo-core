/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Pages search engines may list. Signed-in areas and one-time links are excluded. */
const PUBLIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/register', priority: '0.6', changefreq: 'monthly' },
  { path: '/login', priority: '0.4', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
]

function robotsTxt(siteUrl: string) {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /account',
    'Disallow: /admin',
    'Disallow: /partner',
    'Disallow: /reset-password',
    'Disallow: /setup-account',
    'Disallow: /forgot-password',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n')
}

function sitemapXml(siteUrl: string) {
  const urls = PUBLIC_PAGES.map(
    (page) =>
      `  <url>\n    <loc>${siteUrl}${page.path}</loc>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`,
  ).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Local only: must match Laravel APP_URL (php artisan serve).
  // Public site URL without a trailing slash (canonical, social and sitemap links).
  const siteUrl = (env.VITE_FRONTEND_URL || 'http://localhost:3000').replace(
    /\/+$/,
    '',
  )
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
            .replace(/%VITE_FRONTEND_URL%/g, siteUrl)
            .replace(/%VITE_APP_TITLE%/g, env.VITE_APP_TITLE || 'GabayMo')
        },
      },
      {
        // robots.txt + sitemap.xml with absolute URLs for this deployment.
        name: 'seo-files',
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'robots.txt',
            source: robotsTxt(siteUrl),
          })
          this.emitFile({
            type: 'asset',
            fileName: 'sitemap.xml',
            source: sitemapXml(siteUrl),
          })
        },
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/robots.txt' || req.url === '/sitemap.xml') {
              const xml = req.url === '/sitemap.xml'
              res.setHeader(
                'Content-Type',
                xml ? 'application/xml' : 'text/plain',
              )
              res.end(xml ? sitemapXml(siteUrl) : robotsTxt(siteUrl))
              return
            }
            next()
          })
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
