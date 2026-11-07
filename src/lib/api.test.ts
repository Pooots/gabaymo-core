import axios from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adminApi, api, ensureCsrfCookie, onUnauthorized } from './api'
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import type { MockInstance } from 'vitest'


type Reply = { status: number; data?: unknown }

/** Route requests of both clients through a fake adapter. */
function useAdapter(reply: (config: InternalAxiosRequestConfig) => Reply) {
  const calls: Array<InternalAxiosRequestConfig> = []
  const adapter: AxiosAdapter = (config) => {
    calls.push(config)
    const { status, data = {} } = reply(config)
    const response = { status, data, headers: {}, statusText: String(status), config }
    if (status >= 400) {
      return Promise.reject(
        new axios.AxiosError(`Request failed with status code ${status}`, String(status), config, null, response),
      )
    }
    return Promise.resolve(response)
  }
  api.defaults.adapter = adapter
  adminApi.defaults.adapter = adapter
  return calls
}

describe('api client', () => {
  let csrf: MockInstance<typeof axios.get>

  beforeEach(() => {
    csrf = vi.spyOn(axios, 'get').mockImplementation(() => {
      document.cookie = 'XSRF-TOKEN=fresh-token; path=/'
      return Promise.resolve({ data: {} })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends the session cookie and the XSRF header', () => {
    expect(api.defaults.withCredentials).toBe(true)
    expect(api.defaults.withXSRFToken).toBe(true)
  })

  it('fetches the CSRF cookie before an unsafe request, once', async () => {
    const calls = useAdapter(() => ({ status: 200 }))
    await api.post('/v1/login', {})
    await api.post('/v1/login', {})
    expect(csrf).toHaveBeenCalledTimes(1)
    expect(csrf.mock.calls[0]?.[0]).toBe('/sanctum/csrf-cookie')
    expect(calls).toHaveLength(2)
  })

  it('does not fetch the CSRF cookie for GET requests', async () => {
    useAdapter(() => ({ status: 200 }))
    await api.get('/v1/plans')
    expect(csrf).not.toHaveBeenCalled()
  })

  it('refreshes the CSRF cookie and retries once on 419', async () => {
    let attempts = 0
    useAdapter(() => {
      attempts += 1
      return { status: attempts === 1 ? 419 : 200 }
    })
    document.cookie = 'XSRF-TOKEN=stale; path=/'
    await expect(api.post('/v1/tickets', {})).resolves.toMatchObject({ status: 200 })
    expect(attempts).toBe(2)
    expect(csrf).toHaveBeenCalledTimes(1)
  })

  it('ensureCsrfCookie(force) refetches even when a cookie exists', async () => {
    document.cookie = 'XSRF-TOKEN=present; path=/'
    await ensureCsrfCookie()
    expect(csrf).not.toHaveBeenCalled()
    await ensureCsrfCookie(true)
    expect(csrf).toHaveBeenCalledTimes(1)
  })

  it('routes a 401 to the handler of the client area only', async () => {
    useAdapter(() => ({ status: 401 }))
    const member = vi.fn()
    const admin = vi.fn()
    const offMember = onUnauthorized('member', member)
    const offAdmin = onUnauthorized('admin', admin)

    await expect(adminApi.get('/v1/admin/overview')).rejects.toThrow()
    expect(admin).toHaveBeenCalledWith('/v1/admin/overview')
    expect(member).not.toHaveBeenCalled()

    await expect(api.get('/v1/me')).rejects.toThrow()
    expect(member).toHaveBeenCalledWith('/v1/me')
    expect(admin).toHaveBeenCalledTimes(1)

    offMember()
    offAdmin()
  })

  it('skips the 401 handler for session probes', async () => {
    useAdapter(() => ({ status: 401 }))
    const member = vi.fn()
    const off = onUnauthorized('member', member)
    await expect(api.get('/v1/session', { skipAuthRedirect: true })).rejects.toThrow()
    expect(member).not.toHaveBeenCalled()
    off()
  })
})
