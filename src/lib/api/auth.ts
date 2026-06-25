import { post } from './index'

export async function login(email: string, password: string) {
  localStorage.removeItem('selectedStoreId')
  const data = await post('/auth/login', { email, password })
  localStorage.setItem('token', data.token)
  return data
}

export async function register(name: string, email: string, password: string) {
  const data = await post('/auth/register', { name, email, password })
  localStorage.setItem('token', data.token)
  return data
}

export function logout() {
  localStorage.removeItem('token')
}

export function isAuthenticated(): boolean {
  try { return !!localStorage.getItem('token') } catch { return false }
}
