import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor, cleanup, screen } from '@testing-library/svelte'
import { createMockResponse } from '../../../../tests/helpers'

vi.mock('$lib/api/settings', () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  revealSetting: vi.fn(),
}))

const mockToast = { success: vi.fn(), error: vi.fn() }
vi.mock('svelte-sonner', () => ({ toast: mockToast }))

vi.mock('$lib/i18n/locale.svelte', () => ({
  t: (path: string, vars?: Record<string, string | number>) => {
    const map: Record<string, string> = {
      'settings.title': 'Configurações',
      'settings.subtitle': 'Gerencie as preferências da sua loja.',
      'settings.saved': 'Configurações salvas!',
      'settings.sections.general': 'Geral',
      'settings.sections.domain': 'Domínio',
      'settings.sections.plan': 'Plano',
      'settings.sections.checkout': 'Checkout',
      'settings.sections.payment': 'Pagamentos',
      'settings.sections.shipping': 'Frete',
      'settings.sections.branding': 'Branding',
      'settings.payment.sectionTitle': 'Pagamentos',
      'settings.payments.creditCard': 'Cartão de Crédito',
      'settings.payments.alwaysActive': 'Sempre ativo',
      'settings.payments.boletoDesc': 'Pagamento via boleto bancário',
      'settings.payments.pixDesc': 'Pagamento instantâneo',
      'settings.payment.paymentMethods': 'Métodos de Pagamento',
      'billing.upgradeLabel': 'Fazer upgrade',
      'storeRequests.storeLabel': 'lojas',
      'storeRequests.upgradeToMonthly': 'Fazer upgrade',
      'common.save': 'Salvar',
      'common.saving': 'Salvando...',
      'common.loading': 'Carregando...',
    }
    let val = map[path]
    if (val === undefined) return path
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        val = val!.replace(`{${k}}`, String(v))
      })
    }
    return val!
  },
  getLocale: () => 'pt',
  setLocale: vi.fn(),
}))

vi.mock('$lib/stores/store-context.svelte', () => ({
  getStoreContext: () => ({
    currentStore: {
      id: 's1', name: 'Loja Teste', slug: 'loja-teste',
      storefrontType: 'DEFAULT', isActive: true,
      domain: null, deploymentStatus: null, deploymentUrl: null,
      createdAt: '',
    },
    stores: [], branding: null, loading: false,
    multiStoreEnabled: false, isSuperAdmin: false,
    init: vi.fn(), switchStore: vi.fn(), loadBranding: vi.fn(),
    canManageStores: () => true,
  }),
  StoreContext: vi.fn(),
  setStoreContext: vi.fn(),
}))

let apiModule: any
let mockFetch: ReturnType<typeof vi.fn>
let container: HTMLElement

function getDesktopNavButton(label: string): HTMLElement | null {
  const nav = container.querySelector('nav')
  if (!nav) return null
  return [...nav.querySelectorAll('button')].find(b => b.textContent?.includes(label)) || null
}

async function clickDesktopTab(label: string) {
  const btn = getDesktopNavButton(label)
  if (!btn) throw new Error(`Tab "${label}" not found in desktop nav`)
  await fireEvent.click(btn)
}

beforeEach(async () => {
  apiModule = await import('$lib/api/settings')
  vi.clearAllMocks()

  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(() => null),
  })

  mockFetch = vi.fn()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

async function renderPage(settings: Record<string, string> = {}) {
  apiModule.getSettings.mockResolvedValue({ settings })
  const mod = await import('./+page.svelte')
  const result = render(mod.default)
  container = result.container
  await waitFor(() => expect(apiModule.getSettings).toHaveBeenCalled())
  return result
}

// ─── Tests ───

describe('Settings Page', () => {
  describe('sidebar navigation', () => {
    it('renders all section labels', async () => {
      await renderPage()
      expect(getDesktopNavButton('Geral')).toBeTruthy()
      expect(getDesktopNavButton('Domínio')).toBeTruthy()
      expect(getDesktopNavButton('Plano')).toBeTruthy()
      expect(getDesktopNavButton('Checkout')).toBeTruthy()
      expect(getDesktopNavButton('Pagamentos')).toBeTruthy()
      expect(getDesktopNavButton('Frete')).toBeTruthy()
      expect(getDesktopNavButton('Branding')).toBeTruthy()
    })

    it('highlights general tab by default', async () => {
      await renderPage()
      const generalBtn = getDesktopNavButton('Geral')!
      expect(generalBtn.className).toContain('shadow-sm')
    })

    it('switches active tab on click', async () => {
      await renderPage()
      await clickDesktopTab('Frete')
      await waitFor(() => {
        const shippingBtn = getDesktopNavButton('Frete')!
        expect(shippingBtn.className).toContain('shadow-sm')
      })
    })
  })

  describe('general tab', () => {
    it('shows loading skeleton while settings load', async () => {
      apiModule.getSettings.mockReturnValue(new Promise(() => {}))
      const mod = await import('./+page.svelte')
      const { container: c } = render(mod.default)
      const skeletons = c.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThanOrEqual(1)
    })

    it('renders settings fields after loading', async () => {
      const { findByDisplayValue } = await renderPage({ store_name: 'Minha Loja' })
      expect(await findByDisplayValue('Minha Loja')).toBeTruthy()
    })
  })

  describe('plan tab', () => {
    it('displays plan label and usage bar when data loads', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ plan: 'MONTHLY', storeCount: 1, limit: 3 }))
      const { findByText } = await renderPage()
      await clickDesktopTab('Plano')
      expect(await findByText('Monthly (R$ 29/mês)')).toBeTruthy()
      expect(await findByText('1 de 3 lojas')).toBeTruthy()
      const bar = container.querySelector('.rounded-full.bg-gray-900.dark\\:bg-gray-50')
      expect(bar).toBeTruthy()
    })

    it('shows upgrade button for non-CUSTOM plans', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ plan: 'FREE', storeCount: 1, limit: 3 }))
      const { findByText } = await renderPage()
      await clickDesktopTab('Plano')
      expect(await findByText('Fazer upgrade')).toBeTruthy()
    })

    it('hides upgrade button for CUSTOM plan', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ plan: 'CUSTOM', storeCount: 5, limit: null }))
      await renderPage()
      await clickDesktopTab('Plano')
      await waitFor(() => {
        expect(screen.queryByText('Fazer upgrade')).toBeNull()
      })
    })

    it('handles null limit gracefully', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ plan: 'CUSTOM', storeCount: 5, limit: null }))
      const { findByText } = await renderPage()
      await clickDesktopTab('Plano')
      expect(await findByText('5 de ∞ lojas')).toBeTruthy()
    })
  })

  describe('checkout tab', () => {
    function getCheckboxes() {
      return container.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>
    }

    it('shows card as checked and disabled', async () => {
      const { findByText } = await renderPage()
      await clickDesktopTab('Checkout')
      expect(await findByText('Cartão de Crédito')).toBeTruthy()
      expect(await findByText('Sempre ativo')).toBeTruthy()
      const cbs = getCheckboxes()
      expect(cbs[0]).toBeDisabled()
      expect(cbs[0]).toBeChecked()
    })

    it('toggles boleto payment method', async () => {
      await renderPage({ payment_method_types: JSON.stringify(['boleto']) })
      await clickDesktopTab('Checkout')
      await waitFor(() => {
        const cbs = getCheckboxes()
        expect(cbs[1].checked).toBe(true)
      })
      const cbs = getCheckboxes()
      await fireEvent.click(cbs[1])
      expect(cbs[1].checked).toBe(false)
    })

    it('toggles pix payment method', async () => {
      await renderPage()
      await clickDesktopTab('Checkout')
      await waitFor(() => {
        const cbs = getCheckboxes()
        expect(cbs[2].checked).toBe(false)
      })
      const cbs = getCheckboxes()
      await fireEvent.click(cbs[2])
      expect(cbs[2].checked).toBe(true)
    })

    it('shows pix placeholder message', async () => {
      await renderPage()
      await clickDesktopTab('Checkout')
      expect(await screen.findByText(/Em breve.*configurar chave PIX/i)).toBeTruthy()
    })

    it('saves checkout settings on save', async () => {
      apiModule.updateSettings.mockResolvedValue(undefined)
      await renderPage()
      await clickDesktopTab('Checkout')

      const cbs = await waitFor(() => {
        const c = getCheckboxes()
        expect(c.length).toBeGreaterThanOrEqual(3)
        return c
      })
      await fireEvent.click(cbs[2])

      const saveBtn = [...container.querySelectorAll('button')].find(b => b.textContent === 'Salvar')!
      await fireEvent.click(saveBtn)

      await waitFor(() => {
        expect(apiModule.updateSettings).toHaveBeenCalledWith({
          payment_method_types: JSON.stringify(['pix']),
        })
      })
      expect(mockToast.success).toHaveBeenCalledWith('Configurações salvas!')
    })

    it('saves boleto selection', async () => {
      apiModule.updateSettings.mockResolvedValue(undefined)
      await renderPage()
      await clickDesktopTab('Checkout')

      const cbs = await waitFor(() => {
        const c = getCheckboxes()
        expect(c.length).toBeGreaterThanOrEqual(3)
        return c
      })
      await fireEvent.click(cbs[1])

      const saveBtn = [...container.querySelectorAll('button')].find(b => b.textContent === 'Salvar')!
      await fireEvent.click(saveBtn)

      await waitFor(() => {
        expect(apiModule.updateSettings).toHaveBeenCalledWith({
          payment_method_types: JSON.stringify(['boleto']),
        })
      })
    })
  })

  describe('payment tab', () => {
    const mockTransactions = [
      { id: 'tx1', amount: 10000, balanceAfter: 60000, description: 'Venda #1', createdAt: '2026-06-15T10:00:00Z' },
      { id: 'tx2', amount: -5000, balanceAfter: 55000, description: 'Saque', createdAt: '2026-06-20T10:00:00Z' },
    ]
    const mockPayouts = [
      { id: 'po1', amount: 5000, status: 'COMPLETED', createdAt: '2026-06-20T10:00:00Z' },
      { id: 'po2', amount: 3000, status: 'PENDING', createdAt: '2026-06-25T10:00:00Z' },
    ]
    const mockPixKey = { pixKey: 'admin@loja.com', pixKeyType: 'EMAIL', holderName: 'Admin', holderDocument: '123.456.789-00' }

    function mockPaymentApis(
      overrides: {
        balance?: any; transactions?: any; payouts?: any; pixKey?: any | null
      } = {}
    ) {
      const b = overrides.balance !== undefined ? overrides.balance : { balance: 50000 }
      const tx = overrides.transactions !== undefined ? overrides.transactions : mockTransactions
      const po = overrides.payouts !== undefined ? overrides.payouts : mockPayouts
      const pk = overrides.pixKey !== undefined ? overrides.pixKey : mockPixKey

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/payments/balance')) return createMockResponse(b)
        if (url.includes('/api/payments/transactions')) return createMockResponse(tx)
        if (url.includes('/api/payments/payouts')) return createMockResponse(po)
        if (url.includes('/api/payments/pix-key')) return createMockResponse(pk)
        if (url.includes('/api/stores/my-usage')) return createMockResponse({ plan: 'FREE', storeCount: 1, limit: 3 })
        return createMockResponse({})
      })
    }

    it('displays balance formatted in BRL', async () => {
      mockPaymentApis({ balance: { balance: 150000 } })
      await renderPage()
      await clickDesktopTab('Pagamentos')
      expect(await screen.findByText('R$ 1.500,00')).toBeTruthy()
    })

    it('shows "Solicitar Saque" button when pixKey exists and balance >= R$1', async () => {
      mockPaymentApis()
      await renderPage()
      await clickDesktopTab('Pagamentos')
      expect(await screen.findByText('Solicitar Saque')).toBeTruthy()
    })

    it('disables "Solicitar Saque" when balance is less than R$1', async () => {
      mockPaymentApis({ balance: { balance: 50 } })
      await renderPage()
      await clickDesktopTab('Pagamentos')
      const btn = await screen.findByText('Solicitar Saque') as HTMLButtonElement
      expect(btn.disabled).toBe(true)
    })

    it('hides "Solicitar Saque" when pixKey is null', async () => {
      mockPaymentApis({ pixKey: null })
      await renderPage()
      await clickDesktopTab('Pagamentos')
      await waitFor(() => {
        expect(screen.queryByText('Solicitar Saque')).toBeNull()
      })
    })

    it('shows "Cadastrar Chave PIX" when no pix key', async () => {
      mockPaymentApis({ pixKey: null })
      await renderPage()
      await clickDesktopTab('Pagamentos')
      expect(await screen.findByText('Cadastrar Chave PIX')).toBeTruthy()
    })

    it('shows "Editar Chave PIX" when pix key exists', async () => {
      mockPaymentApis()
      await renderPage()
      await clickDesktopTab('Pagamentos')
      expect(await screen.findByText('Editar Chave PIX')).toBeTruthy()
    })

    it('opens PIX form on button click', async () => {
      mockPaymentApis({ pixKey: null })
      await renderPage()
      await clickDesktopTab('Pagamentos')
      await fireEvent.click(await screen.findByText('Cadastrar Chave PIX'))
      expect(await screen.findByText('Tipo de Chave')).toBeTruthy()
    })

    it('saves PIX key via PUT /api/payments/pix-key', async () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => {
          if (key === 'token') return 'test-token'
          if (key === 'selectedStoreId') return 'store_1'
          return null
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 1,
        key: vi.fn(() => null),
      })

      mockPaymentApis({ pixKey: null })
      await renderPage()
      await clickDesktopTab('Pagamentos')
      await fireEvent.click(await screen.findByText('Cadastrar Chave PIX'))

      const pixKeyInput = document.querySelector('input[placeholder="admin@exemplo.com"]') as HTMLInputElement
      const holderInput = document.querySelector('input[placeholder="João Silva"]') as HTMLInputElement
      const docInput = document.querySelector('input[placeholder="123.456.789-00"]') as HTMLInputElement

      await fireEvent.input(pixKeyInput, { target: { value: 'test@email.com' } })
      await fireEvent.input(holderInput, { target: { value: 'Test User' } })
      await fireEvent.input(docInput, { target: { value: '123.456.789-00' } })

      // Override mock for PUT pix-key
      mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
        if (url.includes('/api/payments/pix-key') && opts?.method === 'PUT') {
          return createMockResponse({ pixKey: 'test@email.com', pixKeyType: 'EMAIL', holderName: 'Test User', holderDocument: '123.456.789-00' })
        }
        return createMockResponse({})
      })

      const saveBtn = [...container.querySelectorAll('button')].find(b => b.textContent === 'Salvar')!
      await fireEvent.click(saveBtn)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/payments/pix-key',
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token',
              'X-Store-Id': 'store_1',
            }),
            body: expect.stringContaining('test@email.com'),
          })
        )
      })
      expect(mockToast.success).toHaveBeenCalledWith('Chave PIX salva')
    })

    it('requests payout via POST /api/payments/request-payout', async () => {
      window.confirm = vi.fn(() => true) as any
      mockPaymentApis()

      // Override mock for request-payout + subsequent data reload
      mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
        if (url.includes('/api/payments/request-payout') && opts?.method === 'POST') {
          return createMockResponse({ success: true })
        }
        if (url.includes('/api/payments/balance')) return createMockResponse({ balance: 50000 })
        if (url.includes('/api/payments/transactions')) return createMockResponse(mockTransactions)
        if (url.includes('/api/payments/payouts')) return createMockResponse(mockPayouts)
        if (url.includes('/api/payments/pix-key')) return createMockResponse(mockPixKey)
        if (url.includes('/api/stores/my-usage')) return createMockResponse({ plan: 'FREE', storeCount: 1, limit: 3 })
        return createMockResponse({})
      })

      await renderPage()
      await clickDesktopTab('Pagamentos')
      await fireEvent.click(await screen.findByText('Solicitar Saque'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/payments/request-payout',
          expect.objectContaining({ method: 'POST' })
        )
      })
      expect(mockToast.success).toHaveBeenCalledWith('Saque solicitado!')
    })

    it('renders transactions with +/- color coding', async () => {
      mockPaymentApis()
      const { findByText } = await renderPage()
      await clickDesktopTab('Pagamentos')
      expect(await findByText('Venda #1')).toBeTruthy()
      expect(await findByText('Saque')).toBeTruthy()
      const positive = await screen.findByText('+R$ 100,00')
      expect(positive.className).toContain('emerald')
      const negative = await screen.findByText('-R$ 50,00')
      expect(negative.className).toContain('red')
    })

    it('renders payouts with status badges', async () => {
      mockPaymentApis()
      await renderPage()
      await clickDesktopTab('Pagamentos')
      expect(await screen.findByText('Concluído')).toBeTruthy()
      expect(await screen.findByText('Pendente')).toBeTruthy()
    })

    it('shows empty state when no transactions', async () => {
      mockPaymentApis({ transactions: [] })
      await renderPage()
      await clickDesktopTab('Pagamentos')
      expect(await screen.findByText(/Nenhuma transação ainda/)).toBeTruthy()
    })

    it('hides payouts section when none exist', async () => {
      mockPaymentApis({ payouts: [] })
      await renderPage()
      await clickDesktopTab('Pagamentos')
      await waitFor(() => {
        // The "Saques" heading only appears inside the payouts section
        const headers = [...document.querySelectorAll('h3')].filter(h => h.textContent === 'Saques')
        expect(headers.length).toBe(0)
      })
    })
  })
})
