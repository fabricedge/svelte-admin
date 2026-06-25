import { get, post, put, del } from './index'

export async function listProducts(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return get(`/products${qs}`)
}

export async function getProduct(id: string) {
  return get(`/products/${id}`)
}

export async function createProduct(data: any) {
  return post('/products', data)
}

export async function updateProduct(id: string, data: any) {
  return put(`/products/${id}`, data)
}

export async function deleteProduct(id: string) {
  return del(`/products/${id}`)
}

export async function duplicateProduct(id: string) {
  const product = await getProduct(id)
  const { name, description, price, images, category, inventory, sku } = product
  return createProduct({
    name: `${name} (cópia)`,
    description,
    price: price / 100,
    images,
    category,
    inventory,
    sku: sku ? `${sku}-copia` : null,
  })
}

export async function listCategories() {
  return get('/products/categories')
}

export async function deleteCategory(name: string) {
  return del(`/products/category/${encodeURIComponent(name)}`)
}
