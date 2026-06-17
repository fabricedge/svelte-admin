import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor, cleanup, screen } from '@testing-library/svelte'
import { mockStoreRequest, mockBillingStatus } from '../../../tests/helpers'

vi.mock('$lib/api/store-requests', () => ({
  getAllRequests: vi.fn(),
  approveRequest: vi.fn(),
  rejectRequest: vi.fn(),
  getBillingStatus: vi.fn(),
  refreshOnboardingLink: vi.fn(),
  forceActivate: vi.fn(),
}))

const mockToast = { success: vi.fn(), error: vi.fn() }
vi.mock('svelte-sonner', () => ({ toast: mockToast }))

vi.mock('$lib/i18n/locale.svelte', () => ({
  t: (path: string, vars?: Record<string, string | number>) => {
    const map: Record<string, string> = {
      'storeRequests.superTitle': 'Pedidos de Loja',
      'storeRequests.superDescription': 'Gerencie os pedidos de criação de loja',
      'storeRequests.allRequests': 'Todos',
      'storeRequests.filterPending': 'Pendentes',
      'storeRequests.filterApproved': 'Aprovados',
      'storeRequests.filterPendingPayment': 'Pagamento Pendente',
      'storeRequests.filterRejected': 'Rejeitados',
      'storeRequests.filterCustom': 'Customizados',
      'storeRequests.admin': 'Admin',
      'storeRequests.table.store': 'Loja',
      'storeRequests.storefrontType': 'Tipo',
      'storeRequests.table.status': 'Status',
      'storeRequests.deploymentStatus': 'Deploy',
      'storeRequests.table.date': 'Data',
      'storeRequests.table.actions': 'Ações',
      'storeRequests.noRequestsFiltered': 'Nenhum pedido encontrado',
      'storeRequests.status.pending': 'Pendente',
      'storeRequests.status.approved': 'Aprovado',
      'storeRequests.status.rejected': 'Rejeitado',
      'storeRequests.status.approved_pending_payment': 'Pagamento Pendente',
      'storeRequests.approve': '✓',
      'storeRequests.reject': '✕',
      'storeRequests.storefrontIndependent': 'Independente',
      'storeRequests.storefrontDefault': 'Padrão',
      'storeRequests.deployPending': 'Pendente',
      'storeRequests.deployReady': 'Pronto',
      'storeRequests.deployDeploying': 'Implantando',
      'storeRequests.deployFailed': 'Falhou',
      'storeRequests.rejectReason': 'Motivo: {reason}',
      'storeRequests.createdStore': 'Loja criada: {name}',
      'storeRequests.viewStore': 'Gerenciar',
      'storeRequests.billingPending': 'Pagamento pendente',
      'storeRequests.copied': 'Copiado!',
      'storeRequests.copyPaymentId': 'Copiar ID do Pagamento',
      'storeRequests.copyOnboardingLink': 'Copiar Link de Onboarding',
      'storeRequests.refreshOnboarding': 'Atualizar Link',
      'storeRequests.checkStatus': 'Verificar Status',
      'storeRequests.loading': 'Carregando...',
      'storeRequests.forceActivate': 'Forçar Ativação',
      'storeRequests.activated': 'Loja ativada com sucesso!',
      'storeRequests.activationFailed': 'Falha ao ativar loja',
      'storeRequests.approved': 'Aprovado!',
      'storeRequests.rejected': 'Rejeitado!',
      'storeRequests.rejectConfirm': 'Confirmar rejeição',
      'storeRequests.approveConfirm': 'Rejeitar {name}',
      'storeRequests.rejectReasonLabel': 'Motivo da rejeição',
      'storeRequests.rejectReasonPlaceholder': 'Descreva o motivo...',
      'storeRequests.deploymentUrl': 'URL da Loja',
      'storeRequests.tokenInfo': 'Token: {code}',
      'customStorefront.form.primaryColor': 'Cor primária',
      'customStorefront.form.secondaryColor': 'Cor secundária',
      'superadmin.storesPage.cancel': 'Cancelar',
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
}))

let apiModule: any

beforeEach(async () => {
  apiModule = await import('$lib/api/store-requests')
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

async function renderPage(requests: any[] = []) {
  apiModule.getAllRequests.mockResolvedValue(requests)
  const mod = await import('./+page.svelte')
  return render(mod.default)
}

describe('Store Requests Page', () => {
  // ── Loading State ──
  it('shows loading skeleton on mount', async () => {
    apiModule.getAllRequests.mockReturnValue(new Promise(() => {}))
    const { container } = render(await (await import('./+page.svelte')).default)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThanOrEqual(4)
  })

  // ── Empty State ──
  it('shows empty message when no requests', async () => {
    const { findByText } = await renderPage([])
    expect(await findByText('Nenhum pedido encontrado')).toBeTruthy()
  })

  // ── Filter Buttons ──
  it('renders all filter buttons', async () => {
    const { findAllByRole } = await renderPage([])
    const buttons = await findAllByRole('button')
    const labels = buttons.map(b => b.textContent?.trim())
    expect(labels).toContain('Todos')
    expect(labels).toContain('Pendentes')
    expect(labels).toContain('Aprovados')
    expect(labels).toContain('Pagamento Pendente')
    expect(labels).toContain('Rejeitados')
    expect(labels).toContain('Customizados')
  })

  it('shows table with request data', async () => {
    const requests = [
      mockStoreRequest({ id: '1', storeName: 'Loja Um' }),
      mockStoreRequest({ id: '2', storeName: 'Loja Dois' }),
    ]
    const { findByText } = await renderPage(requests)
    expect(await findByText('Loja Um')).toBeTruthy()
    expect(await findByText('Loja Dois')).toBeTruthy()
  })

  // ── PENDING Actions ──
  describe('PENDING requests', () => {
    async function findApproveBtn(container: HTMLElement) {
      return await waitFor(() => {
        const btn = container.querySelector('.bg-green-600')
        if (!btn) throw new Error('Approve button not found')
        return btn as HTMLElement
      })
    }

    async function findRejectBtn(container: HTMLElement) {
      return await waitFor(() => {
        const btn = container.querySelector('.bg-red-600')
        if (!btn) throw new Error('Reject button not found')
        return btn as HTMLElement
      })
    }

    it('shows approve and reject buttons', async () => {
      const req = mockStoreRequest({ status: 'PENDING' })
      const { container } = await renderPage([req])
      expect(await findApproveBtn(container)).toBeTruthy()
      expect(await findRejectBtn(container)).toBeTruthy()
    })

    it('calls approveRequest on approve click for DEFAULT', async () => {
      apiModule.approveRequest.mockResolvedValue({ status: 'APPROVED', store: { deploymentUrl: null } })
      const req = mockStoreRequest({ status: 'PENDING' })
      const { container } = await renderPage([req])
      await fireEvent.click(await findApproveBtn(container))
      await waitFor(() => expect(apiModule.approveRequest).toHaveBeenCalledWith('req_001'))
    })

    it('calls approveRequest on approve click for INDEPENDENT', async () => {
      apiModule.approveRequest.mockResolvedValue({
        status: 'APPROVED_PENDING_PAYMENT',
        paymentIntentId: 'pi_123',
        onboardingUrl: 'https://stripe.com/onboard',
      })
      const req = mockStoreRequest({ id: 'req_ind', status: 'PENDING', storefrontType: 'INDEPENDENT' })
      const { container } = await renderPage([req])
      await fireEvent.click(await findApproveBtn(container))
      await waitFor(() => expect(apiModule.approveRequest).toHaveBeenCalledWith('req_ind'))
    })

    it('shows success modal when approve returns token', async () => {
      apiModule.approveRequest.mockResolvedValue({
        status: 'APPROVED',
        rawToken: 'ABC123',
        store: { deploymentUrl: 'https://loja.fskk.site' },
      })
      const req = mockStoreRequest({ status: 'PENDING' })
      const { container, findByText } = await renderPage([req])
      await fireEvent.click(await findApproveBtn(container))
      expect(await findByText('ABC123')).toBeTruthy()
    })

    it('closes success modal on cancel click', async () => {
      apiModule.approveRequest.mockResolvedValue({
        status: 'APPROVED',
        rawToken: 'XYZ',
        store: { deploymentUrl: 'https://loja.fskk.site' },
      })
      const req = mockStoreRequest({ status: 'PENDING' })
      const { container } = await renderPage([req])
      await fireEvent.click(await findApproveBtn(container))
      expect(await screen.findByText('XYZ')).toBeTruthy()
      const cancelBtn = container.querySelector('[class*="bg-black text-white rounded-md"]') as HTMLElement
      if (cancelBtn) await fireEvent.click(cancelBtn)
    })

    it('opens reject modal on reject click', async () => {
      const req = mockStoreRequest({ status: 'PENDING' })
      const { container } = await renderPage([req])
      await fireEvent.click(await findRejectBtn(container))
      expect(await screen.findByText('Confirmar rejeição')).toBeTruthy()
    })

    it('calls rejectRequest on modal confirm', async () => {
      apiModule.rejectRequest.mockResolvedValue({ status: 'REJECTED' })
      const req = mockStoreRequest({ status: 'PENDING' })
      const { container } = await renderPage([req])
      await fireEvent.click(await findRejectBtn(container))
      const confirmBtn = await waitFor(() => {
        const btns = container.querySelectorAll('.bg-red-600')
        expect(btns.length).toBeGreaterThanOrEqual(2)
        return btns[1] as HTMLElement
      })
      await fireEvent.click(confirmBtn)
      await waitFor(() => expect(apiModule.rejectRequest).toHaveBeenCalledWith('req_001', ''))
    })
  })

  // ── APPROVED_PENDING_PAYMENT Flow ──
  describe('APPROVED_PENDING_PAYMENT', () => {
    it('shows check status button when billing not loaded', async () => {
      const req = mockStoreRequest({ status: 'APPROVED_PENDING_PAYMENT' })
      const { findByText } = await renderPage([req])
      expect(await findByText('Verificar Status')).toBeTruthy()
    })

    it('loads billing status on check status click', async () => {
      apiModule.getBillingStatus.mockResolvedValue(mockBillingStatus())
      const req = mockStoreRequest({ status: 'APPROVED_PENDING_PAYMENT' })
      const { findByText } = await renderPage([req])
      await fireEvent.click(await findByText('Verificar Status'))
      await waitFor(() => expect(apiModule.getBillingStatus).toHaveBeenCalledWith('req_001'))
    })

    it('shows setup fee paid indicator', async () => {
      apiModule.getBillingStatus.mockResolvedValue(mockBillingStatus({ setupFeePaid: true }))
      const req = mockStoreRequest({ status: 'APPROVED_PENDING_PAYMENT' })
      const { findByText } = await renderPage([req])
      await fireEvent.click(await findByText('Verificar Status'))
      expect(await findByText('✅ R$3 pago')).toBeTruthy()
    })

    it('shows setup fee pending indicator', async () => {
      apiModule.getBillingStatus.mockResolvedValue(mockBillingStatus({ setupFeePaid: false }))
      const req = mockStoreRequest({ status: 'APPROVED_PENDING_PAYMENT' })
      const { findByText } = await renderPage([req])
      await fireEvent.click(await findByText('Verificar Status'))
      expect(await findByText('⏳ R$3 pendente')).toBeTruthy()
    })

    it('shows copy payment ID when setup fee unpaid', async () => {
      apiModule.getBillingStatus.mockResolvedValue(mockBillingStatus({ setupFeePaid: false }))
      const req = mockStoreRequest({ status: 'APPROVED_PENDING_PAYMENT', paymentIntentId: 'pi_123' })
      const { findByText } = await renderPage([req])
      await fireEvent.click(await findByText('Verificar Status'))
      expect(await findByText('Copiar ID do Pagamento')).toBeTruthy()
    })

    it('shows onboarding complete indicator', async () => {
      apiModule.getBillingStatus.mockResolvedValue(mockBillingStatus({ connectOnboardingComplete: true }))
      const req = mockStoreRequest({ status: 'APPROVED_PENDING_PAYMENT' })
      const { findByText } = await renderPage([req])
      await fireEvent.click(await findByText('Verificar Status'))
      expect(await findByText('✅ Onboarding')).toBeTruthy()
    })

    it('shows copy onboarding link when onboarding pending', async () => {
      apiModule.getBillingStatus.mockResolvedValue(mockBillingStatus({ connectOnboardingComplete: false }))
      const req = mockStoreRequest({ status: 'APPROVED_PENDING_PAYMENT' })
      const { findByText } = await renderPage([req])
      await fireEvent.click(await findByText('Verificar Status'))
      expect(await findByText('Copiar Link de Onboarding')).toBeTruthy()
    })

    it('shows refresh onboarding link button', async () => {
      apiModule.getBillingStatus.mockResolvedValue(mockBillingStatus())
      const req = mockStoreRequest({ status: 'APPROVED_PENDING_PAYMENT' })
      const { findByText } = await renderPage([req])
      await fireEvent.click(await findByText('Verificar Status'))
      expect(await findByText('Atualizar Link')).toBeTruthy()
    })

    it('refreshes onboarding link on click', async () => {
      apiModule.getBillingStatus.mockResolvedValue(mockBillingStatus())
      apiModule.refreshOnboardingLink.mockResolvedValue({ onboardingUrl: 'https://stripe.com/new-link' })
      const req = mockStoreRequest({ status: 'APPROVED_PENDING_PAYMENT' })
      const { findByText } = await renderPage([req])
      await fireEvent.click(await findByText('Verificar Status'))
      await fireEvent.click(await findByText('Atualizar Link'))
      await waitFor(() => expect(apiModule.refreshOnboardingLink).toHaveBeenCalledWith('req_001'))
    })

    it('shows force activate button', async () => {
      const req = mockStoreRequest({ status: 'APPROVED_PENDING_PAYMENT' })
      const { findByText } = await renderPage([req])
      expect(await findByText('Forçar Ativação')).toBeTruthy()
    })

    it('calls forceActivate on click', async () => {
      apiModule.forceActivate.mockResolvedValue({ success: true, status: 'APPROVED' })
      const req = mockStoreRequest({ status: 'APPROVED_PENDING_PAYMENT' })
      const { findByText } = await renderPage([req])
      await fireEvent.click(await findByText('Forçar Ativação'))
      await waitFor(() => expect(apiModule.forceActivate).toHaveBeenCalledWith('req_001'))
    })
  })

  // ── APPROVED State ──
  describe('APPROVED requests', () => {
    it('shows view store link when store exists', async () => {
      const req = mockStoreRequest({
        status: 'APPROVED',
        store: { id: 's1', name: 'Loja Criada', slug: 'loja', storefrontType: 'DEFAULT', isActive: true, domain: null, deploymentUrl: null, deploymentStatus: null },
        storeId: 's1',
      })
      const { findByText } = await renderPage([req])
      expect(await findByText('Gerenciar')).toBeTruthy()
    })

    it('shows created store name', async () => {
      const req = mockStoreRequest({
        status: 'APPROVED',
        store: { id: 's1', name: 'Minha Loja', slug: 'minha-loja', storefrontType: 'DEFAULT', isActive: true, domain: null, deploymentUrl: null, deploymentStatus: null },
        storeId: 's1',
      })
      const { findByText } = await renderPage([req])
      expect(await findByText('Loja criada: Minha Loja')).toBeTruthy()
    })
  })

  // ── REJECTED State ──
  describe('REJECTED requests', () => {
    it('shows reject reason when present', async () => {
      const req = mockStoreRequest({ status: 'REJECTED', rejectReason: 'Nome inválido' })
      const { findByText } = await renderPage([req])
      expect(await findByText('Motivo: Nome inválido')).toBeTruthy()
    })
  })

  // ── Storefront Type Badges ──
  describe('storefront type badges', () => {
    it('shows INDEPENDENT badge', async () => {
      const req = mockStoreRequest({ storefrontType: 'INDEPENDENT' })
      const { findByText } = await renderPage([req])
      expect(await findByText('Independente')).toBeTruthy()
    })

    it('shows DEFAULT badge', async () => {
      const req = mockStoreRequest({ storefrontType: 'DEFAULT' })
      const { findByText } = await renderPage([req])
      expect(await findByText('Padrão')).toBeTruthy()
    })
  })
})
