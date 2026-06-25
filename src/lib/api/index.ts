import { PUBLIC_API_URL } from '$env/static/public'

const API_BASE = PUBLIC_API_URL ? `${PUBLIC_API_URL}/api` : '/api'

export class RateLimitError extends Error {
  retryAfter: number
  constructor(message: string, retryAfter: number) {
    super(message)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

function getToken() {
  try { return localStorage.getItem('token') } catch { return null }
}

function getStoreId() {
  try { return localStorage.getItem('selectedStoreId') } catch { return null }
}

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...options.headers as Record<string, string> }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const storeId = getStoreId()
  if (storeId) headers['X-Store-Id'] = storeId

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 429) {
    const retryAfter = 10
    const endTime = Date.now() + retryAfter * 1000
    localStorage.setItem('rateLimitEnd', String(endTime))
    window.location.reload()
    throw new RateLimitError(`Muitas requisições. Aguarde ${retryAfter}s e a página será atualizada automaticamente.`, retryAfter)
  }

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
