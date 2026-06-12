import { get, put } from './index'

export async function listOrders(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return get(`/orders/admin${qs}`)
}

export async function getOrder(id: string) {
  return get(`/orders/${id}`)
}

export async function updateOrderStatus(id: string, status: string) {
  return put(`/orders/${id}/status`, { status })
}
