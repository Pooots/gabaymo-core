import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

// Static build output only (JS, CSS, HTML shell, images). API responses are
// never cached here: they are per-user and must always come from the server.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
void self.skipWaiting()
clientsClaim()

/** Member pages still open offline (they show the last-opened answers). */
const OFFLINE_SHELL_PATHS = ['/account']

async function offlineResponse(pathname: string): Promise<Response> {
  const shell = OFFLINE_SHELL_PATHS.some((path) => pathname.startsWith(path))
  const cached =
    (shell ? await matchPrecache('index.html') : undefined) ??
    (await matchPrecache('offline.html'))
  return cached ?? Response.error()
}

registerRoute(
  new NavigationRoute(
    async ({ request, url }) => {
      try {
        return await fetch(request)
      } catch {
        return offlineResponse(url.pathname)
      }
    },
    { denylist: [/^\/api\//, /^\/sanctum\//, /^\/storage\//] },
  ),
)
