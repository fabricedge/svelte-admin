import { get } from './index'

export async function getStats() {
  return get('/orders/stats')
}
