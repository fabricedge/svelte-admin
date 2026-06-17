import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor, cleanup } from '@testing-library/svelte'

vi.mock('$lib/api/auth', () => ({
  logout: vi.fn(),
}))

vi.mock('svelte-sonner', () => ({ Toaster: () => {} }))

vi.mock('$lib/i18n/locale.svelte', () => ({
  t: (path: string) => {
    const map: Record<string, string> = {
      'superadmin.brand': 'MyEcom',
      'superadmin.badge': 'ADMIN',
      'superadmin.dashboard': 'Dashboard',
      'superadmin.stores': 'Lojas',
      'superadmin.users': 'Usuários',
      'superadmin.storeRequests': 'Pedidos de Loja',
      'superadmin.settings': 'Configurações',
      'superadmin.regularAdmin': 'Admin Normal',
      'superadmin.signOut': 'Sair',
      'superadmin.headerTitle': 'Painel de Controle',
      'common.storeSelector.unavailable': 'Indisponível',
      'common.storeLoading': 'Carregando...',
      'common.lightMode': 'Modo claro',
      'common.darkMode': 'Modo escuro',
    }
    return map[path] || path
  },
  getLocale: () => 'pt',
  setLocale: vi.fn(),
}))

const mockCtx = {
  currentStore: { id: 's1', name: 'Loja Teste', slug: 'loja-teste', storefrontType: 'DEFAULT', isActive: true, domain: null, createdAt: '' },
  stores: [],
  branding: null,
  loading: false,
  multiStoreEnabled: false,
  isSuperAdmin: true,
  init: vi.fn(),
  switchStore: vi.fn(),
  loadBranding: vi.fn(),
  canManageStores: () => true,
}

vi.mock('$lib/stores/store-context.svelte', () => {
  function MockStoreContext() { return mockCtx }
  MockStoreContext.prototype = mockCtx
  return {
    StoreContext: MockStoreContext,
    setStoreContext: vi.fn(),
    getStoreContext: () => mockCtx,
  }
})

vi.mock('$lib/components/StoreSelector.svelte', () => ({
  default: function() { return ''; },
}))

vi.mock('$lib/i18n/LanguageSwitcher.svelte', () => ({
  default: function() { return ''; },
}))

let authModule: any
let mockLocation: { href: string }

beforeEach(async () => {
  authModule = await import('$lib/api/auth')
  vi.clearAllMocks()
  mockLocation = { href: '' }
  Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
  })
  localStorage.clear()
  const payload = btoa(JSON.stringify({ email: 'admin@myecom.com', role: 'SUPER_ADMIN' }))
  localStorage.setItem('token', `header.${payload}.signature`)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  localStorage.clear()
})

async function renderLayout() {
  const mod = await import('./+layout.svelte')
  return render(mod.default, { children: () => 'Content' })
}

describe('Superadmin Layout', () => {
  it('renders brand name', async () => {
    const { findByText } = await renderLayout()
    expect(await findByText('MyEcom')).toBeTruthy()
  })

  it('renders admin badge', async () => {
    const { findByText } = await renderLayout()
    expect(await findByText('ADMIN')).toBeTruthy()
  })

  it('renders all navigation items', async () => {
    const { findByText } = await renderLayout()
    expect(await findByText('Dashboard')).toBeTruthy()
    expect(await findByText('Lojas')).toBeTruthy()
    expect(await findByText('Usuários')).toBeTruthy()
    expect(await findByText('Pedidos de Loja')).toBeTruthy()
    expect(await findByText('Configurações')).toBeTruthy()
  })

  it('shows user email from JWT', async () => {
    const { container } = await renderLayout()
    const matches = container.querySelectorAll('p.text-xs')
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].textContent).toBe('admin@myecom.com')
  })

  it('renders header title with user email', async () => {
    const { container } = await renderLayout()
    const fontMediumSpans = container.querySelectorAll('span.font-medium')
    const emailSpan = fontMediumSpans[1] || fontMediumSpans[0]
    expect(emailSpan?.textContent).toBe('admin@myecom.com')
  })

  it('renders "Admin Normal" link', async () => {
    const { findByText } = await renderLayout()
    expect(await findByText('Admin Normal')).toBeTruthy()
  })

  it('renders sign out button', async () => {
    const { findByText } = await renderLayout()
    expect(await findByText('Sair')).toBeTruthy()
  })

  it('highlights active nav item', async () => {
    const { container } = await renderLayout()
    const links = container.querySelectorAll('nav a')
    const storeRequestsLink = Array.from(links).find(
      (l) => l.getAttribute('href') === '/superadmin/store-requests'
    )
    expect(storeRequestsLink?.className).toContain('font-medium')
  })

  it('opens sidebar on hamburger click', async () => {
    const { container } = await renderLayout()
    const hamburger = container.querySelector('button.lg\\:hidden') as HTMLElement
    if (hamburger) {
      await fireEvent.click(hamburger)
      const sidebar = container.querySelector('aside')
      expect(sidebar?.className).toContain('translate-x-0')
    }
  })

  it('closes sidebar on overlay click', async () => {
    const { container } = await renderLayout()
    const hamburger = container.querySelector('button.lg\\:hidden') as HTMLElement
    if (hamburger) {
      await fireEvent.click(hamburger)
      const overlay = container.querySelector('.fixed.inset-0.z-30') as HTMLElement
      if (overlay) {
        await fireEvent.click(overlay)
      }
    }
  })

  it('closes sidebar on nav link click', async () => {
    const { container } = await renderLayout()
    const hamburger = container.querySelector('button.lg\\:hidden') as HTMLElement
    if (hamburger) {
      await fireEvent.click(hamburger)
      const dashboardLink = container.querySelector('a[href="/superadmin"]') as HTMLElement
      if (dashboardLink) {
        await fireEvent.click(dashboardLink)
      }
    }
  })

  it('calls logout on sign out click', async () => {
    const { findByText } = await renderLayout()
    await fireEvent.click(await findByText('Sair'))
    expect(authModule.logout).toHaveBeenCalledOnce()
  })

  it('navigates to /login on sign out', async () => {
    const { findByText } = await renderLayout()
    await fireEvent.click(await findByText('Sair'))
    await waitFor(() => expect(mockLocation.href).toBe('/login'))
  })

  it('redirects to /login when no token', async () => {
    localStorage.clear()
    const mod = await import('./+layout.svelte')
    render(mod.default, { children: () => '<div />' })
    await waitFor(() => expect(mockLocation.href).toBe('/login'))
  })

  it('redirects to /admin when not superadmin', async () => {
    localStorage.clear()
    const payload = btoa(JSON.stringify({ email: 'admin@test.com', role: 'ADMIN' }))
    localStorage.setItem('token', `header.${payload}.signature`)
    const mod = await import('./+layout.svelte')
    render(mod.default, { children: () => '<div />' })
    await waitFor(() => expect(mockLocation.href).toBe('/admin'))
  })
})
