import { get, put } from './index'

export async function getSettings() {
  return get('/settings')
}

export async function updateSettings(data: Record<string, string>) {
  return put('/settings', data)
}

export async function getMultiStore() {
  return get('/settings/multi-store')
}

export async function updateMultiStore(enabled: boolean) {
  return put('/settings/multi-store', { enabled })
}

export async function updateProfile(data: { name?: string; currentPassword?: string; newPassword?: string }) {
  return put('/auth/profile', data)
}
