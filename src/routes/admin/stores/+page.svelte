<script lang="ts">
  import { onMount } from 'svelte'
  import { getStores } from '$lib/api/stores'
  import { submitStoreRequest, getMyRequests, type StoreRequest } from '$lib/api/store-requests'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'

  let stores = $state<any[]>([])
  let requests = $state<StoreRequest[]>([])
  let loading = $state(true)

  let showForm = $state(false)
  let storeName = $state('')
  let adminNotes = $state('')
  let storefrontType = $state<'DEFAULT' | 'INDEPENDENT'>('DEFAULT')
  let enableToken = $state(false)
  let submitting = $state(false)

  let slug = $derived(storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'loja')

  let activeTab = $state<'stores' | 'requests'>('stores')

  onMount(async () => {
    try {
      const [s, r] = await Promise.all([getStores(), getMyRequests()])
      stores = s
      requests = r
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      loading = false
    }
  })

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (!storeName.trim()) return
    submitting = true
    try {
      const result = await submitStoreRequest(
        storeName.trim(),
        adminNotes.trim() || undefined,
        storefrontType,
        enableToken,
      )
      toast.success(t('storeRequests.submitted'))
      storeName = ''
      adminNotes = ''
      storefrontType = 'DEFAULT'
      enableToken = false
      showForm = false
      const r = await getMyRequests()
      requests = r
      activeTab = 'requests'
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      submitting = false
    }
  }

  function statusLabel(status: string) {
    const key = status.toLowerCase() as 'pending' | 'approved' | 'rejected'
    return t(`storeRequests.status.${key}`)
  }

  function statusClass(status: string) {
    if (status === 'APPROVED') return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    if (status === 'REJECTED') return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  }
</script>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">{t('storeRequests.title')}</h1>
  {#if !showForm}
    <button onclick={() => showForm = true} class="px-4 py-2 bg-black text-white rounded-md text-sm">{t('storeRequests.newRequest')}</button>
  {/if}
</div>

{#if showForm}
  <form onsubmit={handleSubmit} class="max-w-lg mb-8 p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('storeRequests.storeName')}</label>
      <input
        type="text"
        bind:value={storeName}
        placeholder={t('storeRequests.storeNamePlaceholder')}
        required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('storeRequests.storefrontType')}</label>
      <div class="space-y-2">
        <label class="flex items-center gap-3 p-3 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer {storefrontType === 'DEFAULT' ? 'bg-black/5 dark:bg-white/5 border-black' : ''}">
          <input type="radio" name="storefrontType" value="DEFAULT" bind:group={storefrontType} class="accent-black" />
          <div>
            <p class="text-sm font-medium">{t('storeRequests.storefrontDefault')}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">stfront.fskk.site/{slug}</p>
          </div>
        </label>
        <label class="flex items-center gap-3 p-3 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer {storefrontType === 'INDEPENDENT' ? 'bg-black/5 dark:bg-white/5 border-black' : ''}">
          <input type="radio" name="storefrontType" value="INDEPENDENT" bind:group={storefrontType} class="accent-black" />
          <div>
            <p class="text-sm font-medium">{t('storeRequests.storefrontIndependent')}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{slug}.fskk.site</p>
          </div>
        </label>
      </div>
    </div>
    {#if storefrontType === 'INDEPENDENT'}
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" bind:checked={enableToken} class="accent-black" />
        <span class="text-sm text-gray-700 dark:text-gray-300">{t('storeRequests.enableToken')}</span>
      </label>
    {/if}
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('storeRequests.notes')}</label>
      <textarea
        bind:value={adminNotes}
        placeholder={t('storeRequests.notesPlaceholder')}
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
      ></textarea>
    </div>
    <div class="flex items-center gap-3">
      <button type="submit" disabled={submitting} class="px-4 py-2 bg-black text-white rounded-md text-sm disabled:opacity-50">
        {submitting ? t('storeRequests.submitting') : t('storeRequests.submit')}
      </button>
      <button type="button" onclick={() => showForm = false} class="text-sm text-gray-500 hover:underline">{t('superadmin.storesPage.cancel')}</button>
    </div>
  </form>
{/if}

{#if loading}
  <div class="space-y-3">
    {#each [1,2,3] as _}
      <div class="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
    {/each}
  </div>
{:else}
  <div class="mb-4 flex gap-4 border-b border-gray-200 dark:border-gray-800">
    <button
      onclick={() => activeTab = 'stores'}
      class="pb-2 text-sm font-medium border-b-2 -mb-px {activeTab === 'stores' ? 'border-black text-black dark:border-white dark:text-white' : 'border-transparent text-gray-500'}"
    >
      {t('storeRequests.tabs.stores')} ({stores.length})
    </button>
    <button
      onclick={() => activeTab = 'requests'}
      class="pb-2 text-sm font-medium border-b-2 -mb-px {activeTab === 'requests' ? 'border-black text-black dark:border-white dark:text-white' : 'border-transparent text-gray-500'}"
    >
      {t('storeRequests.tabs.requests')} ({requests.length})
    </button>
  </div>

  {#if activeTab === 'stores'}
    {#if stores.length === 0}
      <p class="text-gray-500 dark:text-gray-400">{t('storeRequests.noStores')}</p>
    {:else}
      <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.table.store')}</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.table.status')}</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.deploymentUrl')}</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {#each stores as store}
              <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="px-4 py-3 font-medium">{store.name}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {store.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
                    {store.isActive ? t('superadmin.storesPage.active') : t('superadmin.storesPage.inactive')}
                  </span>
                </td>
                <td class="px-4 py-3">
                  {#if store.deploymentUrl}
                    <a href={store.deploymentUrl} target="_blank" class="text-blue-600 hover:underline text-xs">{store.deploymentUrl}</a>
                  {:else if store.storefrontType === 'INDEPENDENT'}
                    <span class="text-xs text-yellow-600">{t('storeRequests.deployPending')}</span>
                  {:else}
                    <span class="text-xs text-gray-400">{t('storeRequests.storefrontDefault')}</span>
                  {/if}
                </td>
                <td class="px-4 py-3 text-right">
                  <a href="/admin/settings" class="text-blue-600 hover:underline text-xs">{t('storeRequests.viewStore')}</a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {:else}
    {#if requests.length === 0}
      <p class="text-gray-500 dark:text-gray-400">{t('storeRequests.noRequests')}</p>
    {:else}
      <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.table.store')}</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.table.status')}</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.table.date')}</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.deploymentStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {#each requests as req}
              <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="px-4 py-3 font-medium">{req.storeName}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {statusClass(req.status)}">
                    {statusLabel(req.status)}
                  </span>
                  {#if req.status === 'REJECTED' && req.rejectReason}
                    <p class="text-xs text-gray-500 mt-0.5">{t('storeRequests.rejectReason', { reason: req.rejectReason })}</p>
                  {/if}
                  {#if req.status === 'APPROVED' && req.store}
                    <p class="text-xs text-gray-500 mt-0.5">{t('storeRequests.createdStore', { name: req.store.name })}</p>
                  {/if}
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs">{new Date(req.createdAt).toLocaleDateString()}</td>
                <td class="px-4 py-3">
                  {#if req.storefrontType === 'INDEPENDENT'}
                    {#if req.store?.deploymentStatus === 'READY' && req.store?.deploymentUrl}
                      <a href={req.store.deploymentUrl} target="_blank" class="text-blue-600 hover:underline text-xs">{req.store.deploymentUrl}</a>
                    {:else if req.store?.deploymentStatus === 'FAILED'}
                      <span class="text-xs text-red-600">{t('storeRequests.deployFailed')}</span>
                    {:else if req.store?.deploymentStatus === 'DEPLOYING'}
                      <span class="text-xs text-yellow-600">{t('storeRequests.deployDeploying')}</span>
                    {:else}
                      <span class="text-xs text-gray-500">{t('storeRequests.deployPending')}</span>
                    {/if}
                  {:else}
                    <span class="text-xs text-gray-400">{t('storeRequests.storefrontDefault')}</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
{/if}
