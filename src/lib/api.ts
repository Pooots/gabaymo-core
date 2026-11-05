import axios, { type InternalAxiosRequestConfig } from 'axios'

/**
 * Resolve API base URL for local (relative / Vite proxy) and hosted frontends.
 * Callers use `/health` and `/v1/...`, so the base must end at `/api`.
 */
function resolveApiBaseUrl(raw: string | undefined): string {
  const value = (raw || '/api').trim().replace(/\/+$/, '')

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    const path = value.startsWith('/') ? value : `/${value}`
    return path.replace(/\/v\d+$/, '') || '/api'
  }

  try {
    const url = new URL(value)
    const path = url.pathname.replace(/\/+$/, '').replace(/\/v\d+$/, '')

    url.pathname = path.endsWith('/api') ? path : `${path}/api`
    url.search = ''
    url.hash = ''
    return `${url.origin}${url.pathname}`
  } catch {
    return '/api'
  }
}

export const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL as string | undefined,
)

/**
 * Auth is a Laravel Sanctum cookie session (httpOnly, set by the API).
 * No token is ever stored in JavaScript: the browser sends the session cookie,
 * and axios copies the XSRF-TOKEN cookie into the X-XSRF-TOKEN header.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // Also send X-XSRF-TOKEN cross-origin (api.gabaymo.com from *.gabaymo.com).
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/** `/api` → `/sanctum/csrf-cookie`, `https://api.x.com/api` → `https://api.x.com/sanctum/csrf-cookie` */
const CSRF_COOKIE_URL = `${API_BASE_URL.replace(/\/api$/, '')}/sanctum/csrf-cookie`

let csrfRequest: Promise<void> | null = null

function hasXsrfCookie() {
  return document.cookie
    .split('; ')
    .some((part) => part.startsWith('XSRF-TOKEN='))
}

/** Ask Laravel for a fresh XSRF-TOKEN cookie (once at a time). */
export function ensureCsrfCookie(force = false): Promise<void> {
  if (!force && hasXsrfCookie()) return Promise.resolve()
  csrfRequest ??= axios
    .get(CSRF_COOKIE_URL, { withCredentials: true })
    .then(() => undefined)
    .finally(() => {
      csrfRequest = null
    })
  return csrfRequest
}

const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete'])

api.interceptors.request.use(async (config) => {
  if (UNSAFE_METHODS.has((config.method ?? 'get').toLowerCase())) {
    await ensureCsrfCookie()
  }
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _csrfRetried?: boolean }

let unauthorizedHandler: ((url: string) => void) | null = null

/** Called when any API request returns 401 (session expired or signed out elsewhere). */
export function onUnauthorized(handler: (url: string) => void) {
  unauthorizedHandler = handler
}

api.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || !error.config) throw error
  const config = error.config as RetriableConfig

  // 419 = CSRF token expired (e.g. the session timed out). Refresh it and retry once.
  if (error.response?.status === 419 && !config._csrfRetried) {
    config._csrfRetried = true
    await ensureCsrfCookie(true)
    return api.request(config)
  }

  if (error.response?.status === 401) unauthorizedHandler?.(config.url ?? '')

  throw error
})

export type ApiInfo = {
  ok: boolean
  type: string
  service: string
  name: string
  version: string
  description: string
  health: string
  v1: string
}

export type HealthInfo = {
  ok: boolean
  service: string
  status: string
  app: string
  env: string
  database: string
  timestamp: string
  php: string
}
