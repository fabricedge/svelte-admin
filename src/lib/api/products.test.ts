import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

let mockFetch: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockFetch = vi.fn()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function loadProducts() {
  return import('./products')
}

describe('products API', () => {
  it('listProducts builds query string', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ products: [] }) })
    const { listProducts } = await loadProducts()
    await listProducts({ search: 'foo', limit: '10' })
    expect(mockFetch).toHaveBeenCalledWith('/api/products?search=foo&limit=10', expect.anything())
  })

  it('getProduct fetches by id', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: '1', name: 'Test' }) })
    const { getProduct } = await loadProducts()
    const result = await getProduct('1')
    expect(result).toEqual({ id: '1', name: 'Test' })
    expect(mockFetch).toHaveBeenCalledWith('/api/products/1', expect.anything())
  })

  it('createProduct posts data', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: '2' }) })
    const { createProduct } = await loadProducts()
    const result = await createProduct({ name: 'New' })
    expect(result).toEqual({ id: '2' })
    expect(mockFetch).toHaveBeenCalledWith('/api/products', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'New' }),
    }))
  })

  it('updateProduct puts data', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ updated: true }) })
    const { updateProduct } = await loadProducts()
    await updateProduct('1', { name: 'Updated' })
    expect(mockFetch).toHaveBeenCalledWith('/api/products/1', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    }))
  })

  it('deleteProduct sends DELETE', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    const { deleteProduct } = await loadProducts()
    await deleteProduct('1')
    expect(mockFetch).toHaveBeenCalledWith('/api/products/1', expect.objectContaining({ method: 'DELETE' }))
  })

  it('duplicateProduct fetches original and creates copy', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ name: 'Original', description: 'Desc', price: 1000, images: ['a.jpg'], category: 'cat', inventory: 5 }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: '2' }) })
    const { duplicateProduct } = await loadProducts()
    const result = await duplicateProduct('1')
    expect(result).toEqual({ id: '2' })
    expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/products/1', expect.anything())
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/products', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'Original (cópia)', description: 'Desc', price: 10, images: ['a.jpg'], category: 'cat', inventory: 5 }),
    }))
  })

  it('listCategories fetches categories endpoint', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ categories: ['a', 'b'] }) })
    const { listCategories } = await loadProducts()
    const result = await listCategories()
    expect(result).toEqual({ categories: ['a', 'b'] })
    expect(mockFetch).toHaveBeenCalledWith('/api/products/categories', expect.anything())
  })

  it('deleteCategory sends DELETE with encoded name', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    const { deleteCategory } = await loadProducts()
    await deleteCategory('Cat Name')
    expect(mockFetch).toHaveBeenCalledWith('/api/products/category/Cat%20Name', expect.objectContaining({ method: 'DELETE' }))
  })
})
