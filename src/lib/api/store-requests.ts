import { get, post, put } from './index'
import type { Store } from './stores'

export interface CustomizationData {
  domain?: string
  primaryColor?: string
  secondaryColor?: string
  logoUrl?: string
  faviconUrl?: string
  fontFamily?: string
}

export interface StoreRequest {
  id: string
  storeName: string
  adminId: string
  status: 'PENDING' | 'APPROVED' | 'APPROVED_PENDING_PAYMENT' | 'REJECTED'
  storefrontType: 'DEFAULT' | 'INDEPENDENT'
  enableToken: boolean
  customizationData: CustomizationData | null
  adminNotes: string | null
  rejectReason: string | null
  storeId: string | null
  store: Pick<Store, 'id' | 'name' | 'slug' | 'domain' | 'isActive' | 'storefrontType' | 'deploymentUrl' | 'deploymentStatus'> & { deploymentToken?: string | null } | null
  admin?: { id: string; email: string; name: string | null }
  createdAt: string
  updatedAt: string
  rawToken?: string
  onboardingUrl?: string
  paymentIntentId?: string
  paymentLink?: string | null
  paymentAmountCents?: number
  setupFeePaymentIntentId?: string | null
  setupFeePaid?: boolean
  connectOnboardingComplete?: boolean
  stripeConnectAccountId?: string
  connectOnboardingUrl?: string
}

export interface StoreRequestResponse {
  requests: StoreRequest[]
}

export async function submitStoreRequest(storeName: string, adminNotes?: string, storefrontType?: string, enableToken?: boolean, customizationData?: CustomizationData): Promise<StoreRequest> {
  return post('/store-requests', { storeName, adminNotes, storefrontType, enableToken, customizationData })
}

export async function getMyRequests(): Promise<StoreRequest[]> {
  const data: StoreRequestResponse = await get('/store-requests/mine')
  return data.requests
}

export async function getAllRequests(status?: string): Promise<StoreRequest[]> {
  const query = status ? `?status=${status}` : ''
  const data: StoreRequestResponse = await get(`/store-requests${query}`)
  return data.requests
}

export async function approveRequest(id: string): Promise<StoreRequest> {
  return put(`/store-requests/${id}/approve`)
}

export async function rejectRequest(id: string, rejectReason: string): Promise<StoreRequest> {
  return put(`/store-requests/${id}/reject`, { rejectReason })
}

export interface BillingStatus {
  status: string
  setupFeePaid: boolean
  setupFeePaymentIntentId: string | null
  connectOnboardingComplete: boolean
  stripeConnectAccountId: string | null
  connectOnboardingUrl: string | null
}

export async function getBillingStatus(id: string): Promise<BillingStatus> {
  return get(`/store-requests/${id}/billing-status`)
}

export async function refreshOnboardingLink(id: string): Promise<{ onboardingUrl: string }> {
  return post(`/store-requests/${id}/refresh-onboarding-link`, {})
}

export async function forceActivate(id: string): Promise<{ success: boolean; status: string }> {
  return post(`/store-requests/${id}/force-activate`, {})
}

export async function generatePaymentLink(id: string): Promise<{ paymentLink: string; paymentIntentId: string | null; paymentAmountCents: number }> {
  return post(`/store-requests/${id}/generate-payment-link`, {})
}
