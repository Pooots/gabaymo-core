import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

import { api } from '@/lib/api'

// Echo's reverb connector looks for the Pusher client on window.
;

(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

type ReverbEcho = Echo<'reverb'>

const REVERB_KEY = import.meta.env.VITE_REVERB_APP_KEY
const REVERB_HOST = import.meta.env.VITE_REVERB_HOST || window.location.hostname

/**
 * ws/wss: VITE_REVERB_SCHEME when set, otherwise match the page, so an https
 * site never tries an insecure socket (browsers block mixed content).
 */
export function resolveReverbScheme(
  configured: string | undefined,
  pageProtocol: string,
): 'http' | 'https' {
  if (configured === 'https' || configured === 'http') return configured
  return pageProtocol === 'https:' ? 'https' : 'http'
}

const REVERB_SCHEME = resolveReverbScheme(
  import.meta.env.VITE_REVERB_SCHEME,
  window.location.protocol,
)
const REVERB_PORT = Number(
  import.meta.env.VITE_REVERB_PORT || (REVERB_SCHEME === 'https' ? 443 : 8080),
)

if (import.meta.env.DEV && REVERB_KEY && !import.meta.env.VITE_REVERB_SCHEME) {
  console.warn(
    `[echo] VITE_REVERB_SCHEME is not set; using "${REVERB_SCHEME}" to match the page. Set it in .env to be explicit.`,
  )
}

let echo: ReverbEcho | null = null

/**
 * Shared Reverb connection, or null when realtime is not configured
 * (no VITE_REVERB_APP_KEY). Private channels are authorized through
 * POST /v1/broadcasting/auth on the same Sanctum session cookie, so the
 * axios client adds the XSRF header.
 */
export function getEcho(): ReverbEcho | null {
  if (!REVERB_KEY) return null
  echo ??= new Echo<'reverb'>({
    broadcaster: 'reverb',
    key: REVERB_KEY,
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel: { name: string }) => ({
      authorize: (
        socketId: string,
        callback: (error: Error | null, data: { auth: string } | null) => void,
      ) => {
        api
          .post<{ auth: string }>('/v1/broadcasting/auth', {
            socket_id: socketId,
            channel_name: channel.name,
          })
          .then((response) => callback(null, response.data))
          .catch((error: Error) => callback(error, null))
      },
    }),
  })
  return echo
}

/** Close the socket (on sign-out) so the next user starts clean. */
export function disconnectEcho() {
  echo?.disconnect()
  echo = null
}
