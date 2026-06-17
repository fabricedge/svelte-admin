import { getContext, setContext } from 'svelte'
import { getStores, type Store, getBranding, type Branding } from '$lib/api/stores'

const STORE_KEY = Symbol('store-context')

export class StoreContext {
  currentStore = $state<Store | null>(null)
  stores = $state<Store[]>([])
  branding = $state<Branding | null>(null)
  loading = $state(true)
  multiStoreEnabled = $state(false)
  isSuperAdmin = $state(false)

  constructor(initialStore?: Store) {
    if (initialStore) this.currentStore = initialStore
  }

  async init(userRole: string) {
    this.isSuperAdmin = userRole === 'SUPER_ADMIN'
    try {
      const data = await getStores()
      this.stores = data
      const savedId = this.loadSavedStoreId()
      if (data.length > 0) {
        const saved = savedId ? data.find((s) => s.id === savedId) : null
        this.currentStore = saved || data[0]
      }
      if (this.currentStore) {
        this.saveStoreId(this.currentStore.id)
        await this.loadBranding(this.currentStore.id)
      }
    } catch (err) {
      console.error('Erro ao carregar lojas:', err)
    } finally {
      this.loading = false
    }
  }

  async switchStore(store: Store) {
    this.currentStore = store
    this.saveStoreId(store.id)
    await this.loadBranding(store.id)
  }

  private saveStoreId(id: string) {
    try { localStorage.setItem('selectedStoreId', id) } catch {}
  }

  private loadSavedStoreId(): string | null {
    try { return localStorage.getItem('selectedStoreId') } catch { return null }
  }

  async loadBranding(storeId: string) {
    try {
      const data = await getBranding(storeId)
      this.branding = data.branding
    } catch {
      this.branding = null
    }
  }

  canManageStores(): boolean {
    return this.isSuperAdmin || this.multiStoreEnabled
  }
}

export function setStoreContext(ctx: StoreContext) {
  setContext(STORE_KEY, ctx)
}

export function getStoreContext(): StoreContext {
  return getContext<StoreContext>(STORE_KEY)
}
