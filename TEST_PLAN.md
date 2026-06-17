# Admin Dashboard — UI Test Plan

## Test Infrastructure

Location: `src/tests/`

| File | Purpose |
|---|---|
| `helpers.ts` | Mock factories (`mockStoreRequest`, `mockStore`, `mockUser`), prebuilt API response fixtures |
| `mocks.ts` | Global fetch/API mock setup using `vi.stubGlobal` |
| `setup.ts` | Extends existing `test-setup.ts` with common mocks (localStorage, clipboard API) |

Tooling: **Vitest** + `@testing-library/svelte` + `jsdom`.  
No Playwright / e2e configured.

---

## 1. Login (`/login`)

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 1.1 | Renders login form | Mount page | Email input, password input, "Login" button visible |
| 1.2 | Switches to register | Click "Register" tab/link | Name + email + password fields, "Register" button |
| 1.3 | Successful login | Fill valid creds, submit | Redirects to `/admin` or `/superadmin`, token stored in localStorage |
| 1.4 | Failed login | Fill invalid creds, submit | Shows error message "Credenciais inválidas" |
| 1.5 | Already authenticated | Token in localStorage | Redirects away from `/login` |

---

## 2. Superadmin Layout (`/superadmin/+layout.svelte`)

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 2.1 | Renders sidebar | Mount with `SUPER_ADMIN` role | Purple "SUPER ADMIN" badge, nav links: Dashboard, Stores, Users, Store Requests, Settings |
| 2.2 | Non-superadmin redirected | Mount with `ADMIN` role | Redirects to `/admin` |
| 2.3 | Language switcher | Click language toggle | Changes displayed language immediately |
| 2.4 | Dark mode toggle | Click dark mode button | Toggles `dark` class on `<html>` |
| 2.5 | Mobile sidebar | Narrow viewport | Hamburger menu appears, sidebar hidden/collapsible |

---

## 3. Superadmin Store Requests (`/superadmin/store-requests`)

### 3a. Initial Render States

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 3a.1 | Loading state | Mount, API not yet resolved | Shows 5 animated skeleton rows (pulsing divs) |
| 3a.2 | Empty state | API returns `{ requests: [] }` | Shows "Nenhum pedido encontrado" message |
| 3a.3 | Error state | API rejects/thows | Toast shows error message |
| 3a.4 | Populated table | API returns 3+ requests | Table renders with columns: Admin, Loja, Tipo, Status, Deploy, Data, Ações |

### 3b. Filtering

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 3b.1 | All filter (default) | Mount | Requests of all statuses shown |
| 3b.2 | Pending filter | Click "Pendentes" button | Only `PENDING` requests visible |
| 3b.3 | Pending Payment filter | Click "Pagamento Pendente" | Only `APPROVED_PENDING_PAYMENT` visible |
| 3b.4 | Approved filter | Click "Aprovados" | Only `APPROVED` visible |
| 3b.5 | Rejected filter | Click "Rejeitados" | Only `REJECTED` visible |
| 3b.6 | Custom filter | Click "Customizados" | Only requests with non-null `customizationData` |
| 3b.7 | Active filter style | Click filter button | Clicked button gets dark/blue background to indicate active state |

### 3c. PENDING — Approve / Reject

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 3c.1 | Approve DEFAULT store | Click "✓" on PENDING DEFAULT request | Calls `approveRequest`, success modal (if token) or toast "Aprovado!" |
| 3c.2 | Approve INDEPENDENT store | Click "✓" on PENDING INDEPENDENT | Calls `approveRequest`, status becomes `APPROVED_PENDING_PAYMENT`, billing status row added |
| 3c.3 | Reject with reason | Click "✕", type reason, confirm | Calls `rejectRequest` with reason, status becomes `REJECTED`, reason shown in table |
| 3c.4 | Reject without reason | Click "✕", confirm without text | Calls `rejectRequest` with `null` reason |
| 3c.5 | Cancel reject | Open reject modal, click "Cancelar" | Modal closes, no API call |
| 3c.6 | Loading state on action | Click Approve | Button shows "…" and is disabled during request |

### 3d. APPROVED_PENDING_PAYMENT — Billing Status

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 3d.1 | Initial — status not fetched | Mount with `APPROVED_PENDING_PAYMENT` | Shows "[Verificar Status]" button |
| 3d.2 | Check billing status | Click "Verificar Status" | Calls `getBillingStatus`, shows status indicators |
| 3d.3 | Setup fee paid | `setupFeePaid=true` | Green "✅ R$3 pago" indicator |
| 3d.4 | Setup fee pending | `setupFeePaid=false` | Yellow "⏳ R$3 pendente" indicator |
| 3d.5 | Onboarding complete | `connectOnboardingComplete=true` | Green "✅ Onboarding" indicator |
| 3d.6 | Onboarding pending | `connectOnboardingComplete=false` | Yellow "⏳ Onboarding" indicator |
| 3d.7 | Copy Payment ID button | `setupFeePaid=false`, has `paymentIntentId` | Blue button "Copiar ID do Pagamento" visible |
| 3d.8 | Copy Onboarding Link button | onboarding incomplete, has `connectOnboardingUrl` | Purple button "Copiar Link de Onboarding" visible |
| 3d.9 | Refresh Onboarding Link button | has `connectOnboardingUrl` | Gray button "Atualizar Link" visible |
| 3d.10 | Copy to clipboard | Click any "Copiar" button | Calls `navigator.clipboard.writeText`, shows toast "Copiado!" |
| 3d.11 | Refresh Link | Click "Atualizar Link" | Calls `refreshOnboardingLink`, copies new URL, shows toast |
| 3d.12 | Refresh loading | Click "Atualizar Link" during request | Button shows "…" and is disabled |

### 3e. Force Activate

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 3e.1 | Force Activate visible | `APPROVED_PENDING_PAYMENT` request | Orange "Forçar Ativação" button visible |
| 3e.2 | Force Activate — success | Click, API returns `success=true` | Toast "Loja ativada com sucesso!" |
| 3e.3 | Force Activate — failure | Click, API returns `success=false` | Toast "Falha ao ativar loja" |
| 3e.4 | Force Activate — loading | During request | Button shows "…" and is disabled |

### 3f. APPROVED

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 3f.1 | Approved with store | `status=APPROVED`, store exists | "Gerenciar" link to `/superadmin/stores` |
| 3f.2 | Deployment URL shown | INDEPENDENT with `deploymentUrl` | Clickable link to store's domain |
| 3f.3 | Deployment pending | No `deploymentUrl` | "Pendente" text |
| 3f.4 | Created store label | store exists | "Loja criada: {store.name}" below status badge |

### 3g. REJECTED

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 3g.1 | Rejected with reason | `rejectReason` present | "Motivo: {reason}" below status badge |
| 3g.2 | Rejected without reason | `rejectReason` null | No additional text |

### 3h. Success Modal

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 3h.1 | Opens on approve with token | Approve returns `rawToken` | Modal shows deployment URL + raw token (large font, `select-all` class) + copy info |
| 3h.2 | Opens on approve without token | Approve returns no `rawToken` | Modal with deployment URL only |
| 3h.3 | Close modal | Click backdrop or "Fechar" | Modal disappears |

### 3i. Storefront Type Badges

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 3i.1 | INDEPENDENT badge | Request with `storefrontType=INDEPENDENT` | Purple "Independente" badge |
| 3i.2 | DEFAULT badge | Request with `storefrontType=DEFAULT` | Gray "Padrão" badge |

### 3j. Customization Indicators

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 3j.1 | Primary color dot | `customizationData.primaryColor` set | Small colored circle shown with that color |
| 3j.2 | Secondary color dot | `customizationData.secondaryColor` set | Small circle with border, colored |
| 3j.3 | Logo icon | `customizationData.logoUrl` set | 🖼 icon visible |
| 3j.4 | Custom domain shown | `customizationData.domain` set | Domain text shown inline |

---

## 4. Superadmin Stores (`/superadmin/stores`)

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 4.1 | Loading state | Mount, API pending | Skeleton rows (animate-pulse) |
| 4.2 | Table renders | Stores loaded | Columns: Nome, Slug, Domínio, Tipo, Status, Ações |
| 4.3 | Type badge — INDEPENDENT | `storefrontType=INDEPENDENT` | Violet "Custom" badge |
| 4.4 | Type badge — DEFAULT | `storefrontType=DEFAULT` | Gray "Padrão" badge |
| 4.5 | Status badge — Active | `isActive=true` | Green "Ativo" badge |
| 4.6 | Status badge — Inactive | `isActive=false` | Gray "Inativo" badge |
| 4.7 | New store form toggle | Click "[+ Nova Loja]" | Inline form with name input + [Criar] [Cancelar] |
| 4.8 | Cancel new store | Click "Cancelar" | Form disappears |
| 4.9 | Create store | Type name, click "Criar" | Calls `createStore`, store appears in table |
| 4.10 | Domain inline edit | Click domain text | Turns into input with [Salvar] [Cancelar] |
| 4.11 | Domain save | Edit domain, click "Salvar" | Calls `updateStoreDomain`, toast "Domínio atualizado!" |
| 4.12 | Domain cancel | Edit domain, click "Cancelar" | Reverts to original text |
| 4.13 | Toggle active | Click "Ativar" / "Desativar" | Calls `updateStore`, status badge updates |

---

## 5. API Error Handling (global)

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 5.1 | 401 Unauthorized | Any API call returns 401 | Redirects to `/login` |
| 5.2 | Network error | Fetch throws `NetworkError` | Toast shows error message |
| 5.3 | Server error | API returns 500 | Toast shows error message |

---

## Mock Strategy

- Use `vi.fn()` to stub `fetch` globally (the API layer uses native `fetch`).
- Factory functions in `helpers.ts` generate realistic mock data with sensible defaults.
- Example mock factories:

```ts
// helpers.ts

export function mockStoreRequest(overrides: Partial<StoreRequest> = {}): StoreRequest {
  return {
    id: 'req_001',
    storeName: 'Test Store',
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

export function mockStore(overrides: Partial<Store> = {}): Store {
  return {
    id: 'store_001',
    name: 'Test Store',
    slug: 'test-store',
    domain: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}
```

## Implementation Priority

1. **Store Requests page** (`/superadmin/store-requests`) — highest complexity, billing flow
2. **Stores page** (`/superadmin/stores`) — moderate complexity
3. **Login + Layout** — lower complexity, foundation
4. **Error handling** — cross-cutting, verify after core tests
