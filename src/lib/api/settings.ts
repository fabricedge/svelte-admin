import { get, put, post } from './index'

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

export async function getPlatformSettings(): Promise<Record<string, string>> {
  return get('/settings/platform')
}

export async function updatePlatformSettings(data: Record<string, string>) {
  return put('/settings/platform', data)
}

export async function testStripeConnection(secretKey: string): Promise<{ success: boolean; error?: string }> {
  return post('/settings/platform/test-connection', { secret_key: secretKey })
}

export async function revealSetting(key: string, password: string): Promise<{ key: string; value: string }> {
  return post('/settings/reveal', { key, password })
}

export async function updateProfile(data: { name?: string; currentPassword?: string; newPassword?: string }) {
  return put('/auth/profile', data)
}
