import { get, put } from './index'

export async function listUsers(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return get(`/users${qs}`)
}

export async function getUser(id: string) {
  return get(`/users/${id}`)
}

export async function updateUserRole(id: string, role: string) {
  return put(`/users/${id}/role`, { role })
}
