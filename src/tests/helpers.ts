import type { StoreRequest, BillingStatus } from '$lib/api/store-requests'
import type { Store } from '$lib/api/stores'

export function mockStoreRequest(overrides: Partial<StoreRequest> = {}): StoreRequest {
  return {
    id: 'req_001',
    storeName: 'Loja Teste',
    adminId: 'admin_001',
    status: 'PENDING',
    storefrontType: 'DEFAULT',
    enableToken: false,
    customizationData: null,
    adminNotes: null,
    rejectReason: null,
    storeId: null,
    store: null,
    admin: { id: 'admin_001', email: 'admin@test.com', name: 'Admin' },
    createdAt: new Date('2026-06-01').toISOString(),
    updatedAt: new Date('2026-06-01').toISOString(),
    ...overrides,
  }
}

export function mockBillingStatus(overrides: Partial<BillingStatus> = {}): BillingStatus {
  return {
    status: 'APPROVED_PENDING_PAYMENT',
    setupFeePaid: false,
    setupFeePaymentIntentId: 'pi_123',
    connectOnboardingComplete: false,
    stripeConnectAccountId: 'acct_123',
    connectOnboardingUrl: 'https://connect.stripe.com/onboard',
    ...overrides,
  }
}

export function mockStore(overrides: Partial<Store> = {}): Store {
  return {
    id: 'store_001',
    name: 'Loja Teste',
    slug: 'loja-teste',
    domain: null,
    isActive: true,
    createdAt: new Date('2026-06-01').toISOString(),
    storefrontType: 'DEFAULT',
    ...overrides,
  }
}

export function createMockResponse(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  }
}

export function setupFetchMock() {
  const mockFetch = vi.fn()
  vi.stubGlobal('fetch', mockFetch)
  return mockFetch
}

export function teardownFetchMock() {
  vi.unstubAllGlobals()
}
