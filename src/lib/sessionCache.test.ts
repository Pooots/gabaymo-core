import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSessionCache } from './sessionCache'
import { axiosError } from '@/test/utils'

type User = { name: string }

describe('createSessionCache', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('asks the API once and reuses the answer', async () => {
    const probe = vi.fn().mockResolvedValue({ name: 'Ana' })
    const cache = createSessionCache<User>({ storageKey: 'test_user', probe })
    await expect(cache.load()).resolves.toEqual({ name: 'Ana' })
    await expect(cache.load()).resolves.toEqual({ name: 'Ana' })
    expect(probe).toHaveBeenCalledTimes(1)
    expect(cache.read()).toEqual({ name: 'Ana' })
  })

  it('treats 401 as signed out and clears the cached profile', async () => {
    window.localStorage.setItem('test_user', JSON.stringify({ name: 'Old' }))
    const cache = createSessionCache<User>({ storageKey: 'test_user', probe: () => Promise.reject(axiosError(401)) })
    await expect(cache.load()).resolves.toBeNull()
    expect(cache.read()).toBeNull()
    expect(window.localStorage.getItem('test_user')).toBeNull()
  })

  it('keeps the cached profile on network trouble and retries next time', async () => {
    window.localStorage.setItem('test_user', JSON.stringify({ name: 'Cached' }))
    const probe = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ name: 'Fresh' })
    const cache = createSessionCache<User>({ storageKey: 'test_user', probe })
    await expect(cache.load()).resolves.toEqual({ name: 'Cached' })
    await expect(cache.load()).resolves.toEqual({ name: 'Fresh' })
    expect(probe).toHaveBeenCalledTimes(2)
  })

  it('write() answers later loads without asking; clear() signs out', async () => {
    const probe = vi.fn().mockResolvedValue({ name: 'Server' })
    const cache = createSessionCache<User>({ storageKey: 'test_user', probe })
    cache.write({ name: 'Signed in' })
    await expect(cache.load()).resolves.toEqual({ name: 'Signed in' })
    cache.clear()
    await expect(cache.load()).resolves.toBeNull()
    expect(probe).not.toHaveBeenCalled()
  })

  it('removes legacy keys and survives unreadable JSON', () => {
    window.localStorage.setItem('legacy_token', 'abc')
    window.localStorage.setItem('test_user', '{not json')
    const cache = createSessionCache<User>({ storageKey: 'test_user', legacyKeys: ['legacy_token'], probe: vi.fn() })
    expect(window.localStorage.getItem('legacy_token')).toBeNull()
    expect(cache.read()).toBeNull()
  })

  it('keeps working when localStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const cache = createSessionCache<User>({ storageKey: 'test_user', probe: () => Promise.resolve({ name: 'Ana' }) })
    await expect(cache.load()).resolves.toEqual({ name: 'Ana' })
    expect(cache.read()).toBeNull()
  })
})
