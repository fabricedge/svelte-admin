import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

let mockFetch: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockFetch = vi.fn()
  vi.stubGlobal('fetch', mockFetch)
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function loadApi() {
  return import('./index')
}

describe('API client', () => {
  it('sends GET request', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: 'ok' }) })
    const { get } = await loadApi()
    const result = await get('/products')
    expect(result).toEqual({ data: 'ok' })
    expect(mockFetch).toHaveBeenCalledWith('/api/products', expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }))
  })

  it('sends POST with JSON body', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) })
    const { post } = await loadApi()
    const result = await post('/products', { name: 'Foo' })
    expect(result).toEqual({ id: 1 })
    expect(mockFetch).toHaveBeenCalledWith('/api/products', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'Foo' }),
    }))
  })

  it('sends PUT with JSON body', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ updated: true }) })
    const { put } = await loadApi()
    const result = await put('/products/1', { name: 'Bar' })
    expect(result).toEqual({ updated: true })
    expect(mockFetch).toHaveBeenCalledWith('/api/products/1', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ name: 'Bar' }),
    }))
  })

  it('sends DELETE request', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ deleted: true }) })
    const { del } = await loadApi()
    const result = await del('/products/1')
    expect(result).toEqual({ deleted: true })
    expect(mockFetch).toHaveBeenCalledWith('/api/products/1', expect.objectContaining({ method: 'DELETE' }))
  })

  it('includes auth token from localStorage', async () => {
    localStorage.setItem('token', 'my-token')
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    const { get } = await loadApi()
    await get('/products')
    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers['Authorization']).toBe('Bearer my-token')
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) })
    const { get } = await loadApi()
    await expect(get('/products')).rejects.toThrow('Unauthorized')
  })

  it('throws generic error when body cannot be parsed', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: () => Promise.reject(new Error()) })
    const { get } = await loadApi()
    await expect(get('/products')).rejects.toThrow('HTTP 500')
  })
})
