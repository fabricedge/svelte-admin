const API_BASE = '/api'

function getToken() {
  try { return localStorage.getItem('token') } catch { return null }
}

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...options.headers as Record<string, string> }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function get(path: string) { return request(path) }
export function post(path: string, data?: any) { return request(path, { method: 'POST', body: JSON.stringify(data) }) }
export function put(path: string, data?: any) { return request(path, { method: 'PUT', body: JSON.stringify(data) }) }
export function del(path: string) { return request(path, { method: 'DELETE' }) }
