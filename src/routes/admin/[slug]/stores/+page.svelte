<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { getStores } from '$lib/api/stores'
  import { submitStoreRequest, getMyRequests, generatePaymentLink, type StoreRequest } from '$lib/api/store-requests'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'

  let stores = $state<any[]>([])
  let requests = $state<StoreRequest[]>([])
  let loading = $state(true)

  let showForm = $state(false)
  let storeName = $state('')
  let domain = $state('')
  let adminNotes = $state('')
  let enableToken = $state(false)
  let submitting = $state(false)

  let lastSubmitResult = $state<StoreRequest | null>(null)

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
      const cd: Record<string, string> = {}
      if (domain.trim()) cd.domain = domain.trim()

      const result = await submitStoreRequest(
        storeName.trim(),
        adminNotes.trim() || undefined,
        'INDEPENDENT',
        enableToken,
        Object.keys(cd).length > 0 ? cd : undefined,
      )
      lastSubmitResult = result
      toast.success(t('storeRequests.submitted'))
      storeName = ''
      domain = ''
      adminNotes = ''
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
    const key = status.toLowerCase().replace(/_/g, '')
    return t(`storeRequests.status.${key}`)
  }

  function statusClass(status: string) {
    if (status === 'APPROVED') return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    if (status === 'REJECTED') return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    if (status === 'APPROVED_PENDING_PAYMENT') return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  }

  let generatingLink = $state<string | null>(null)

  async function handleGeneratePaymentLink(reqId: string) {
    generatingLink = reqId
    try {
      const result = await generatePaymentLink(reqId)
      if (result.paymentLink) {
        window.open(result.paymentLink, '_blank')
        toast.success('Link de pagamento gerado!')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      generatingLink = null
    }
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
      <p class="text-xs text-gray-500 mt-1">{slug}.fskk.site</p>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customStorefront.form.domain')}</label>
      <input
        type="text"
        bind:value={domain}
        placeholder="ex: minhaloja.com.br"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
      />
      <p class="text-xs text-gray-400 mt-1">{t('storeRequests.customDomainPlanNotice')}</p>
    </div>
    <label class="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" bind:checked={enableToken} class="accent-black" />
      <span class="text-sm text-gray-700 dark:text-gray-300">{t('storeRequests.enableToken')}</span>
    </label>
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

{#if lastSubmitResult && lastSubmitResult.stripeConnectAccountId && lastSubmitResult.paymentAmountCents}
  <div class="mb-8 p-6 rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
    <h3 class="text-lg font-semibold mb-1">{t('storeRequests.submittedIndependent')}</h3>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
      {lastSubmitResult.storeName} → {lastSubmitResult.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'loja'}.fskk.site
    </p>
    <div class="space-y-4 text-sm">
      <div>
        <p class="font-medium mb-1">{t('storeRequests.paySetupFee')}</p>
        <p class="text-gray-600 dark:text-gray-400 mb-2">{t('storeRequests.paySetupFeeDesc')}</p>
        {#if lastSubmitResult.paymentLink}
          <a href={lastSubmitResult.paymentLink} target="_blank" rel="noopener noreferrer" class="inline-block px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">{t('storeRequests.paySetupFee')} →</a>
        {:else}
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">{t('storeRequests.paymentId')}</span>
            <code class="px-2 py-1 bg-white dark:bg-gray-800 rounded border text-xs font-mono select-all">{lastSubmitResult!.paymentIntentId}</code>
            <button onclick={() => { navigator.clipboard.writeText(lastSubmitResult!.paymentIntentId!); toast.success(t('storeRequests.copied')) }} class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">{t('storeRequests.copyPaymentId')}</button>
          </div>
        {/if}
      </div>
      <div>
        <p class="font-medium mb-1">{t('storeRequests.completeOnboarding')}</p>
        <p class="text-gray-600 dark:text-gray-400 mb-2">{t('storeRequests.completeOnboardingDesc')}</p>
        <a href={lastSubmitResult.connectOnboardingUrl} target="_blank" rel="noopener noreferrer" class="inline-block px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700">{t('storeRequests.openOnboarding')}</a>
      </div>
    </div>
  </div>
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
                <td class="px-4 py-3">
                  <p class="font-medium">{store.name}</p>
                  <p class="text-xs text-gray-500">{store.domain || store.slug + '.fskk.site'}</p>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {store.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
                    {store.isActive ? t('superadmin.storesPage.active') : t('superadmin.storesPage.inactive')}
                  </span>
                </td>
                <td class="px-4 py-3">
                  {#if store.deploymentUrl}
                    <a href={store.deploymentUrl} target="_blank" class="text-blue-600 hover:underline text-xs">{store.deploymentUrl}</a>
                  {:else}
                    <span class="text-xs text-yellow-600">{t('storeRequests.deployPending')}</span>
                  {/if}
                </td>
                <td class="px-4 py-3 text-right">
                  <a href={`/admin/${page.params.slug}/settings`} class="text-blue-600 hover:underline text-xs">{t('storeRequests.viewStore')}</a>
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
              <th class="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {#each requests as req}
              <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="px-4 py-3">
                  <p class="font-medium">{req.storeName}</p>
                  <p class="text-xs text-gray-500">
                    {req.customizationData?.domain || req.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'loja'}.fskk.site
                  </p>
                </td>
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
                  {#if req.store?.deploymentStatus === 'READY' && req.store?.deploymentUrl}
                    <a href={req.store.deploymentUrl} target="_blank" class="text-blue-600 hover:underline text-xs">{req.store.deploymentUrl}</a>
                  {:else if req.store?.deploymentStatus === 'FAILED'}
                    <span class="text-xs text-red-600">{t('storeRequests.deployFailed')}</span>
                  {:else if req.store?.deploymentStatus === 'DEPLOYING'}
                    <span class="text-xs text-yellow-600">{t('storeRequests.deployDeploying')}</span>
                  {:else}
                    <span class="text-xs text-gray-500">{t('storeRequests.deployPending')}</span>
                  {/if}
                </td>
                <td class="px-4 py-3 text-right">
                  {#if req.status === 'APPROVED_PENDING_PAYMENT'}
                    <div class="flex flex-col items-end gap-1">
                      <button
                        onclick={() => handleGeneratePaymentLink(req.id)}
                        disabled={generatingLink === req.id}
                        class="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {generatingLink === req.id ? t('common.saving') : t('storeRequests.paySetupFee')} →
                      </button>
                      {#if req.setupFeePaymentIntentId}
                        <button
                          onclick={() => { navigator.clipboard.writeText(req.setupFeePaymentIntentId!); toast.success(t('storeRequests.copied')) }}
                          class="text-xs text-blue-600 hover:underline"
                        >
                          {t('storeRequests.copyPaymentId')}
                        </button>
                      {/if}
                      {#if req.connectOnboardingUrl}
                        <a
                          href={req.connectOnboardingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-xs text-purple-600 hover:underline"
                        >
                          {t('storeRequests.openOnboarding')}
                        </a>
                      {/if}
                    </div>
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
