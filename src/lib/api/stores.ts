import { get, post, put } from './index'

export interface Store {
  id: string
  name: string
  slug: string
  domain: string | null
  isActive: boolean
  createdAt: string
}

export async function getStores(): Promise<Store[]> {
  const data = await get('/stores')
  return data.stores
}

export async function getStore(id: string): Promise<Store> {
  return get(`/stores/${id}`)
}

export async function createStore(name: string): Promise<Store> {
  return post('/stores', { name })
}

export async function updateStore(id: string, data: Partial<Store>): Promise<Store> {
  return put(`/stores/${id}`, data)
}

export interface Branding {
  primary_color?: string
  secondary_color?: string
  logo_url?: string
  favicon_url?: string
  font_family?: string
}

export async function getBranding(id: string): Promise<{ store: { name: string; slug: string }; branding: Branding }> {
  return get(`/stores/${id}/branding`)
}

export async function updateBranding(id: string, branding: Branding) {
  return put(`/stores/${id}/branding`, branding)
}

export async function updateStoreDomain(id: string, domain: string) {
  return put(`/stores/${id}/domain`, { domain })
}
