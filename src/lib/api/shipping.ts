import { get, post } from './index'

export async function getShippingStatus() {
  return get('/shipping/status')
}

export async function getShippingRates(orderId: string, weight?: number, length?: number, width?: number, height?: number) {
  return post('/shipping/rates', { orderId, weight, length, width, height })
}

export async function createShippingLabel(orderId: string, productCode: string, weight?: number, length?: number, width?: number, height?: number) {
  return post('/shipping/label', { orderId, productCode, weight, length, width, height })
}

export async function getTracking(code: string) {
  return get(`/shipping/tracking/${code}`)
}
