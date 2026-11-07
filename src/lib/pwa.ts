import { registerSW } from 'virtual:pwa-register'

/** Register the service worker in production builds (auto-updates in the background). */
export function registerServiceWorker() {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return
  registerSW({ immediate: true })
}
