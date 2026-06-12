import { post } from './index'

export async function login(email: string, password: string) {
  const data = await post('/auth/login', { email, password })
  localStorage.setItem('token', data.token)
  return data
}

export function logout() {
  localStorage.removeItem('token')
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token')
}
