import axios from 'axios'

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

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
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
