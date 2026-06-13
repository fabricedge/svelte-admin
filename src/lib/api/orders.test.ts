import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

let mockFetch: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockFetch = vi.fn()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function loadOrders() {
  return import('./orders')
}

describe('orders API', () => {
  it('listOrders builds query string', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ orders: [] }) })
    const { listOrders } = await loadOrders()
    await listOrders({ page: '1', status: 'PENDING' })
    expect(mockFetch).toHaveBeenCalledWith('/api/orders/admin?page=1&status=PENDING', expect.anything())
  })

  it('getOrder fetches by id', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: '1' }) })
    const { getOrder } = await loadOrders()
    const result = await getOrder('1')
    expect(result).toEqual({ id: '1' })
    expect(mockFetch).toHaveBeenCalledWith('/api/orders/1', expect.anything())
  })

  it('updateOrderStatus puts status', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ updated: true }) })
    const { updateOrderStatus } = await loadOrders()
    await updateOrderStatus('1', 'PAID')
    expect(mockFetch).toHaveBeenCalledWith('/api/orders/1/status', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ status: 'PAID' }),
    }))
  })

  it('bulkUpdateOrderStatus posts ids and status', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ updated: 3 }) })
    const { bulkUpdateOrderStatus } = await loadOrders()
    const result = await bulkUpdateOrderStatus(['1', '2', '3'], 'SHIPPED')
    expect(result).toEqual({ updated: 3 })
    expect(mockFetch).toHaveBeenCalledWith('/api/orders/bulk-status', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ ids: ['1', '2', '3'], status: 'SHIPPED' }),
    }))
  })
})
