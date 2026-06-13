import { get, put } from './index'

export async function getSettings() {
  return get('/settings')
}

export async function updateSettings(data: Record<string, string>) {
  return put('/settings', data)
}

export async function updateProfile(data: { name?: string; currentPassword?: string; newPassword?: string }) {
  return put('/auth/profile', data)
}
