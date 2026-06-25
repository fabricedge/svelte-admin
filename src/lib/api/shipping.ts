import { get, post } from './index'

export async function getShippingStatus() {
  return get('/shipping/status')
}

export async function getShippingRates(orderId: string, weight?: number, length?: number, width?: number, height?: number) {
  return post('/shipping/rates', { orderId, weight, length, width, height })
}

export async function createShippingLabel(orderId: string, courierServiceId: string) {
  return post('/shipping/label', { orderId, courierServiceId })
}

export async function getTracking(shipmentId: string) {
  return get(`/shipping/tracking/${shipmentId}`)
}
