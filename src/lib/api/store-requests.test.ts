import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockResponse } from '../../tests/helpers'

let mockFetch: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockFetch = vi.fn()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function loadApi() {
  return import('./store-requests')
}

describe('store-requests API', () => {
  describe('getAllRequests', () => {
    it('fetches all requests without status filter', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ requests: [] }))
      const { getAllRequests } = await loadApi()
      const result = await getAllRequests()
      expect(result).toEqual([])
      expect(mockFetch).toHaveBeenCalledWith('/api/store-requests', expect.anything())
    })

    it('appends status query parameter', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ requests: [] }))
      const { getAllRequests } = await loadApi()
      await getAllRequests('PENDING')
      expect(mockFetch).toHaveBeenCalledWith('/api/store-requests?status=PENDING', expect.anything())
    })
  })

  describe('getMyRequests', () => {
    it('fetches own requests', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ requests: [{ id: '1' }] }))
      const { getMyRequests } = await loadApi()
      const result = await getMyRequests()
      expect(result).toEqual([{ id: '1' }])
      expect(mockFetch).toHaveBeenCalledWith('/api/store-requests/mine', expect.anything())
    })
  })

  describe('submitStoreRequest', () => {
    it('sends minimal DEFAULT request', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ id: 'new_1' }))
      const { submitStoreRequest } = await loadApi()
      const result = await submitStoreRequest('Minha Loja')
      expect(result).toEqual({ id: 'new_1' })
      expect(mockFetch).toHaveBeenCalledWith('/api/store-requests', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ storeName: 'Minha Loja', adminNotes: undefined, storefrontType: undefined, enableToken: undefined, customizationData: undefined }),
      }))
    })

    it('sends INDEPENDENT request with branding', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ id: 'new_2' }))
      const { submitStoreRequest } = await loadApi()
      await submitStoreRequest('Loja Custom', 'notas', 'INDEPENDENT', true, {
        primaryColor: '#ff0000',
        logoUrl: 'https://logo.url',
      })
      expect(mockFetch).toHaveBeenCalledWith('/api/store-requests', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          storeName: 'Loja Custom',
          adminNotes: 'notas',
          storefrontType: 'INDEPENDENT',
          enableToken: true,
          customizationData: { primaryColor: '#ff0000', logoUrl: 'https://logo.url' },
        }),
      }))
    })
  })

  describe('approveRequest', () => {
    it('sends PUT to approve endpoint', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ status: 'APPROVED' }))
      const { approveRequest } = await loadApi()
      const result = await approveRequest('req_001')
      expect(result).toEqual({ status: 'APPROVED' })
      expect(mockFetch).toHaveBeenCalledWith('/api/store-requests/req_001/approve', expect.objectContaining({
        method: 'PUT',
      }))
    })
  })

  describe('rejectRequest', () => {
    it('sends PUT with rejectReason', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ status: 'REJECTED' }))
      const { rejectRequest } = await loadApi()
      const result = await rejectRequest('req_001', 'Nome inadequado')
      expect(result).toEqual({ status: 'REJECTED' })
      expect(mockFetch).toHaveBeenCalledWith('/api/store-requests/req_001/reject', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ rejectReason: 'Nome inadequado' }),
      }))
    })
  })

  describe('getBillingStatus', () => {
    it('fetches billing status by request id', async () => {
      const billingData = {
        status: 'APPROVED_PENDING_PAYMENT',
        setupFeePaid: true,
        setupFeePaymentIntentId: 'pi_123',
        connectOnboardingComplete: false,
        stripeConnectAccountId: 'acct_123',
        connectOnboardingUrl: 'https://stripe.com/onboard',
      }
      mockFetch.mockResolvedValue(createMockResponse(billingData))
      const { getBillingStatus } = await loadApi()
      const result = await getBillingStatus('req_001')
      expect(result).toEqual(billingData)
      expect(mockFetch).toHaveBeenCalledWith('/api/store-requests/req_001/billing-status', expect.anything())
    })
  })

  describe('refreshOnboardingLink', () => {
    it('posts to refresh onboarding link', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ onboardingUrl: 'https://stripe.com/new-link' }))
      const { refreshOnboardingLink } = await loadApi()
      const result = await refreshOnboardingLink('req_001')
      expect(result).toEqual({ onboardingUrl: 'https://stripe.com/new-link' })
      expect(mockFetch).toHaveBeenCalledWith('/api/store-requests/req_001/refresh-onboarding-link', expect.objectContaining({
        method: 'POST',
      }))
    })
  })

  describe('forceActivate', () => {
    it('posts to force-activate endpoint', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, status: 'APPROVED' }))
      const { forceActivate } = await loadApi()
      const result = await forceActivate('req_001')
      expect(result).toEqual({ success: true, status: 'APPROVED' })
      expect(mockFetch).toHaveBeenCalledWith('/api/store-requests/req_001/force-activate', expect.objectContaining({
        method: 'POST',
      }))
    })
  })
})
