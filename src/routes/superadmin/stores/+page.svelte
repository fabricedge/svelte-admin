<script lang="ts">
  import { onMount } from 'svelte'
  import { getStoreContext } from '$lib/stores/store-context.svelte'
  import { createStore, updateStore, updateStoreDomain, type Store } from '$lib/api/stores'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'

  const ctx = getStoreContext()

  let stores = $state<Store[]>([])
  let loading = $state(true)

  onMount(() => {
    stores = ctx.stores
    loading = false
  })

  let showNewForm = $state(false)
  let newStoreName = $state('')
  let creating = $state(false)

  async function handleCreate() {
    if (!newStoreName.trim()) return
    creating = true
    try {
      const store = await createStore(newStoreName.trim())
      stores = [...stores, store]
      newStoreName = ''
      showNewForm = false
      toast.success(t('superadmin.storesPage.created'))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      creating = false
    }
  }

  let editingDomain = $state<string | null>(null)
  let domainInput = $state('')

  async function handleDomainSave(storeId: string) {
    if (!domainInput.trim()) return
    try {
      const updated = await updateStoreDomain(storeId, domainInput.trim())
      stores = stores.map((s) => s.id === storeId ? { ...s, domain: updated.domain } : s)
      toast.success(t('superadmin.storesPage.domainUpdated'))
      editingDomain = null
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  function startDomainEdit(store: Store) {
    editingDomain = store.id
    domainInput = store.domain || ''
  }

  async function toggleActive(store: Store) {
    try {
      const updated = await updateStore(store.id, { isActive: !store.isActive })
      stores = stores.map((s) => s.id === updated.id ? updated : s)
      toast.success(updated.isActive ? t('superadmin.storesPage.toggledOn') : t('superadmin.storesPage.toggledOff'))
    } catch (err: any) {
      toast.error(err.message)
    }
  }
</script>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">{t('superadmin.storesPage.title')}</h1>
  {#if showNewForm}
    <button onclick={() => showNewForm = false} class="text-sm text-gray-500 hover:underline">{t('superadmin.storesPage.cancel')}</button>
  {:else}
    <button onclick={() => showNewForm = true} class="px-4 py-2 bg-black text-white rounded-md text-sm">{t('superadmin.storesPage.newStore')}</button>
  {/if}
</div>

{#if showNewForm}
  <form onsubmit={(e) => { e.preventDefault(); handleCreate() }} class="flex gap-3 items-end mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
    <div class="flex-1">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superadmin.storesPage.nameLabel')}</label>
      <input
        type="text"
        bind:value={newStoreName}
        placeholder={t('superadmin.storesPage.namePlaceholder')}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800"
      />
    </div>
    <button type="submit" disabled={creating} class="px-4 py-2 bg-black text-white rounded-md text-sm disabled:opacity-50">
      {creating ? t('superadmin.storesPage.creating') : t('superadmin.storesPage.create')}
    </button>
  </form>
{/if}

{#if loading}
  <div class="space-y-3">
    {#each [1,2,3] as _}
      <div class="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
    {/each}
  </div>
{:else}
  <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 dark:bg-gray-900 text-left">
        <tr>
          <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('superadmin.storesPage.table.name')}</th>
          <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('superadmin.storesPage.table.slug')}</th>
          <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('superadmin.storesPage.table.domain')}</th>
          <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('superadmin.storesPage.table.type')}</th>
          <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('superadmin.storesPage.table.status')}</th>
          <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('superadmin.storesPage.table.actions')}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
        {#each stores as store}
          <tr class="hover:bg-gray-50 dark:hover:bg-gray-900/50">
            <td class="px-4 py-3 font-medium">{store.name}</td>
            <td class="px-4 py-3 text-gray-500">/{store.slug}</td>
            <td class="px-4 py-3 text-gray-500">
              {#if editingDomain === store.id}
                <form onsubmit={(e) => { e.preventDefault(); handleDomainSave(store.id) }} class="flex gap-2">
                  <input
                    type="text"
                    bind:value={domainInput}
                    placeholder={t('superadmin.storesPage.domainPlaceholder')}
                    class="w-40 px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                  <button type="submit" class="text-xs text-green-600 hover:underline">{t('superadmin.storesPage.domainSave')}</button>
                  <button onclick={() => editingDomain = null} class="text-xs text-gray-400 hover:underline">{t('superadmin.storesPage.domainCancel')}</button>
                </form>
              {:else}
                <button onclick={() => startDomainEdit(store)} class="hover:underline cursor-pointer">
                  {store.domain || '-'}
                </button>
              {/if}
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {store.storefrontType === 'INDEPENDENT' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}">
                {store.storefrontType === 'INDEPENDENT' ? t('superadmin.storesPage.customStorefront') : t('superadmin.storesPage.defaultStorefront')}
              </span>
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {store.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
                <span class="h-1.5 w-1.5 rounded-full {store.isActive ? 'bg-green-500' : 'bg-gray-400'}" />
                {store.isActive ? t('superadmin.storesPage.active') : t('superadmin.storesPage.inactive')}
              </span>
            </td>
            <td class="px-4 py-3">
              <button
                onclick={() => toggleActive(store)}
                class="text-xs text-blue-600 hover:underline"
              >
                {store.isActive ? t('superadmin.storesPage.deactivate') : t('superadmin.storesPage.activate')}
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
