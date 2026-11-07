import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

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

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

/**
 * Which signed-in session a request belongs to. Members and partners share
 * the customer session cookie (`member`); staff use a separate one (`admin`).
 * Each area has its own client, so a 401 is routed to that area's handler
 * explicitly instead of guessing from the URL.
 */
export type ApiArea = 'member' | 'admin'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Session probes handle their own 401 (it just means "signed out"). */
    skipAuthRedirect?: boolean
  }
}

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

type RetriableConfig = InternalAxiosRequestConfig & { _csrfRetried?: boolean }

type UnauthorizedHandler = (url: string) => void

const unauthorizedHandlers = new Map<ApiArea, UnauthorizedHandler>()

/**
 * Called when a request of `area` returns 401 (session expired or signed out
 * elsewhere). Returns a function that removes the handler.
 */
export function onUnauthorized(area: ApiArea, handler: UnauthorizedHandler) {
  unauthorizedHandlers.set(area, handler)
  return () => {
    if (unauthorizedHandlers.get(area) === handler)
      unauthorizedHandlers.delete(area)
  }
}

/**
 * Auth is a Laravel Sanctum cookie session (httpOnly, set by the API).
 * No token is ever stored in JavaScript: the browser sends the session cookie,
 * and axios copies the XSRF-TOKEN cookie into the X-XSRF-TOKEN header.
 */
export function createApiClient(area: ApiArea): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    // Also send X-XSRF-TOKEN cross-origin (api.gabaymo.com from *.gabaymo.com).
    withXSRFToken: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  client.interceptors.request.use(async (config) => {
    if (UNSAFE_METHODS.has((config.method ?? 'get').toLowerCase())) {
      await ensureCsrfCookie()
    }
    return config
  })

  client.interceptors.response.use(undefined, async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) throw error
    const config = error.config as RetriableConfig

    // 419 = CSRF token expired (e.g. the session timed out). Refresh it and retry once.
    if (error.response?.status === 419 && !config._csrfRetried) {
      config._csrfRetried = true
      await ensureCsrfCookie(true)
      return client.request(config)
    }

    if (error.response?.status === 401 && !config.skipAuthRedirect) {
      unauthorizedHandlers.get(area)?.(config.url ?? '')
    }

    throw error
  })

  return client
}

/** Customer + partner session (`/v1/...`, `/v1/partner/...`). */
export const api = createApiClient('member')

/** Staff session (`/v1/admin/...`). */
export const adminApi = createApiClient('admin')

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
