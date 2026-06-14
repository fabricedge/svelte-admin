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
      if (data.length > 0 && !this.currentStore) {
        this.currentStore = data[0]
      }
      if (this.currentStore) {
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
    await this.loadBranding(store.id)
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
