import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockResponse } from '../../tests/helpers'

let mockFetch: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockFetch = vi.fn()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function loadApi() {
  return import('./stores')
}

describe('stores API', () => {
  describe('getStores', () => {
    it('fetches all stores', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ stores: [{ id: '1' }, { id: '2' }] }))
      const { getStores } = await loadApi()
      const result = await getStores()
      expect(result).toEqual([{ id: '1' }, { id: '2' }])
      expect(mockFetch).toHaveBeenCalledWith('/api/stores', expect.anything())
    })
  })

  describe('getStore', () => {
    it('fetches store by id', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ id: 'store_001', name: 'Test' }))
      const { getStore } = await loadApi()
      const result = await getStore('store_001')
      expect(result).toEqual({ id: 'store_001', name: 'Test' })
      expect(mockFetch).toHaveBeenCalledWith('/api/stores/store_001', expect.anything())
    })
  })

  describe('createStore', () => {
    it('sends POST with name', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ id: 'new_1', name: 'Nova Loja' }))
      const { createStore } = await loadApi()
      const result = await createStore('Nova Loja')
      expect(result).toEqual({ id: 'new_1', name: 'Nova Loja' })
      expect(mockFetch).toHaveBeenCalledWith('/api/stores', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Nova Loja' }),
      }))
    })
  })

  describe('updateStore', () => {
    it('sends PUT with partial data', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ id: 'store_001', isActive: false }))
      const { updateStore } = await loadApi()
      const result = await updateStore('store_001', { isActive: false })
      expect(result).toEqual({ id: 'store_001', isActive: false })
      expect(mockFetch).toHaveBeenCalledWith('/api/stores/store_001', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ isActive: false }),
      }))
    })
  })

  describe('updateStoreDomain', () => {
    it('sends PUT with domain', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ id: 'store_001', domain: 'minhaloja.com' }))
      const { updateStoreDomain } = await loadApi()
      const result = await updateStoreDomain('store_001', 'minhaloja.com')
      expect(result).toEqual({ id: 'store_001', domain: 'minhaloja.com' })
      expect(mockFetch).toHaveBeenCalledWith('/api/stores/store_001/domain', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ domain: 'minhaloja.com' }),
      }))
    })
  })

  describe('getBranding', () => {
    it('fetches branding by store id', async () => {
      const brandingData = { store: { name: 'Loja', slug: 'loja' }, branding: { primary_color: '#ff0000' } }
      mockFetch.mockResolvedValue(createMockResponse(brandingData))
      const { getBranding } = await loadApi()
      const result = await getBranding('store_001')
      expect(result).toEqual(brandingData)
      expect(mockFetch).toHaveBeenCalledWith('/api/stores/store_001/branding', expect.anything())
    })
  })

  describe('updateBranding', () => {
    it('sends PUT with branding data', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ updated: true }))
      const { updateBranding } = await loadApi()
      await updateBranding('store_001', { primary_color: '#00ff00', font_family: 'Inter' })
      expect(mockFetch).toHaveBeenCalledWith('/api/stores/store_001/branding', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ primary_color: '#00ff00', font_family: 'Inter' }),
      }))
    })
  })
})
