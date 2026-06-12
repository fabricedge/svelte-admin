import { get, post, put, del } from './index'

export async function listProducts() {
  return get('/products')
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
