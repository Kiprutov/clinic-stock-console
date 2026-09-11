import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useFetch } from './useFetch'
import { useAuth } from './useAuth'

function mockResponse(body: unknown, init: { status?: number; ok?: boolean } = {}) {
  const status = init.status ?? 200
  const ok = init.ok ?? (status >= 200 && status < 300)
  return { ok, status, json: async () => body } as Response
}

function delayedResponse(body: unknown, ms: number, signal?: AbortSignal) {
  return new Promise<Response>((resolve, reject) => {
    const timer = setTimeout(() => resolve(mockResponse(body)), ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

describe('useFetch', () => {
  beforeEach(() => {
    const { logout } = useAuth()
    logout()
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns parsed JSON on a successful request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ hello: 'world' }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await useFetch<{ hello: string }>('https://example.com/data')

    expect(result).toEqual({ hello: 'world' })
  })

  it('attaches an Authorization header when an access token is present', async () => {
    const { accessToken } = useAuth()
    accessToken.value = 'test-access-token'

    const fetchMock = vi.fn().mockResolvedValue(mockResponse({}))
    vi.stubGlobal('fetch', fetchMock)

    await useFetch('https://example.com/data')

    const [, options] = fetchMock.mock.calls[0]!
    expect((options as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer test-access-token',
    })
  })

  it('cancels a previous request under the same key when a new one fires', async () => {
    let callIndex = 0
    const fetchMock = vi.fn((_url: string, options: RequestInit = {}) => {
      callIndex++
      const delay = callIndex === 1 ? 50 : 5
      return delayedResponse({ url: _url }, delay, options.signal ?? undefined)
    })
    vi.stubGlobal('fetch', fetchMock)

    const first = useFetch('https://example.com/first', { key: 'shared' })
    await new Promise((r) => setTimeout(r, 0)) // let the first request register before firing the second
    const second = useFetch('https://example.com/second', { key: 'shared' })

    await expect(first).rejects.toMatchObject({ name: 'AbortError' })
    await expect(second).resolves.toEqual({ url: 'https://example.com/second' })
  })

  it('throws a friendly error on a genuine network failure, not an abort', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(useFetch('https://example.com/data')).rejects.toThrow(
      'Network request failed. Check your connection and try again.'
    )
  })

  it('refreshes the token once on a 401 and retries the original request', async () => {
    const { accessToken, refreshToken } = useAuth()
    accessToken.value = 'expired-token'
    refreshToken.value = 'valid-refresh-token'

    let dataCallCount = 0
    let refreshCallCount = 0

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/auth/refresh')) {
        refreshCallCount++
        return mockResponse({ accessToken: 'new-token', refreshToken: 'new-refresh-token' })
      }
      dataCallCount++
      return dataCallCount === 1
        ? mockResponse({}, { status: 401, ok: false })
        : mockResponse({ data: 'ok' })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await useFetch<{ data: string }>('https://example.com/data')

    expect(result).toEqual({ data: 'ok' })
    expect(dataCallCount).toBe(2) // original attempt + exactly one retry
    expect(refreshCallCount).toBe(1)
    expect(accessToken.value).toBe('new-token')
  })

  it('shares a single refresh call across multiple concurrent 401s', async () => {
    const { accessToken, refreshToken } = useAuth()
    accessToken.value = 'expired-token'
    refreshToken.value = 'valid-refresh-token'

    let refreshCallCount = 0
    const dataCallCounts: Record<string, number> = {}

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/auth/refresh')) {
        refreshCallCount++
        await new Promise((r) => setTimeout(r, 20))
        return mockResponse({ accessToken: 'new-token', refreshToken: 'new-refresh-token' })
      }
      dataCallCounts[url] = (dataCallCounts[url] ?? 0) + 1
      return dataCallCounts[url] === 1
        ? mockResponse({}, { status: 401, ok: false })
        : mockResponse({ data: url })
    })
    vi.stubGlobal('fetch', fetchMock)

    const [resultA, resultB] = await Promise.all([
      useFetch<{ data: string }>('https://example.com/a'),
      useFetch<{ data: string }>('https://example.com/b'),
    ])

    expect(resultA).toEqual({ data: 'https://example.com/a' })
    expect(resultB).toEqual({ data: 'https://example.com/b' })
    expect(refreshCallCount).toBe(1) // NOT 2 — this is the whole point
  })

  it('does not loop forever if the refreshed token is rejected again', async () => {
    const { accessToken, refreshToken } = useAuth()
    accessToken.value = 'expired-token'
    refreshToken.value = 'valid-refresh-token'

    let refreshCallCount = 0
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/auth/refresh')) {
        refreshCallCount++
        return mockResponse({ accessToken: 'still-bad-token', refreshToken: 'new-refresh-token' })
      }
      // Every attempt against the data endpoint 401s, even post-refresh.
      return mockResponse({}, { status: 401, ok: false })
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(useFetch('https://example.com/data')).rejects.toThrow('Request failed: 401')
    expect(refreshCallCount).toBe(1) // tried exactly once, retry: false stopped a second attempt
  })

  it('logs out and propagates the error if refresh itself fails', async () => {
    const { accessToken, refreshToken, isAuthenticated } = useAuth()
    accessToken.value = 'expired-token'
    refreshToken.value = 'dead-refresh-token'

    const fetchMock = vi.fn().mockResolvedValue(mockResponse({}, { status: 401, ok: false }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(useFetch('https://example.com/data')).rejects.toThrow(
      'Session expired. Please login again.'
    )
    expect(isAuthenticated.value).toBe(false)
    expect(accessToken.value).toBeNull()
  })

  it('throws when the response is not ok and not a 401', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({}, { status: 500, ok: false }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(useFetch('https://example.com/data')).rejects.toThrow('Request failed: 500')
  })
})

