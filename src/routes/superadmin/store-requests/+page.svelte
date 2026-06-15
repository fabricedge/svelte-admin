<script lang="ts">
  import { onMount } from 'svelte'
  import { getAllRequests, approveRequest, rejectRequest, type StoreRequest } from '$lib/api/store-requests'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'

  let requests = $state<StoreRequest[]>([])
  let loading = $state(true)
  let filter = $state('')
  let customOnly = $state(false)
  let processing = $state<string | null>(null)

  let showRejectModal = $state(false)
  let rejectTarget = $state<StoreRequest | null>(null)
  let rejectReason = $state('')

  let showSuccessModal = $state(false)
  let successData = $state<{ storeName: string; deploymentUrl?: string; rawToken?: string } | null>(null)

  onMount(() => load())

  async function load() {
    loading = true
    try {
      requests = await getAllRequests(filter || undefined)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      loading = false
    }
  }

  $effect(() => {
    if (!loading) load()
  })

  let filtered = $derived(
    (filter ? requests.filter((r) => r.status === filter) : requests)
      .filter((r) => !customOnly || r.customizationData)
  )

  async function handleApprove(req: StoreRequest) {
    processing = req.id
    try {
      const result: any = await approveRequest(req.id)
      if (result.rawToken || result.store?.deploymentUrl) {
        successData = {
          storeName: req.storeName,
          deploymentUrl: result.store?.deploymentUrl,
          rawToken: result.rawToken,
        }
        showSuccessModal = true
      } else {
        toast.success(t('storeRequests.approved'))
      }
      await load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      processing = null
    }
  }

  function openReject(req: StoreRequest) {
    rejectTarget = req
    rejectReason = ''
    showRejectModal = true
  }

  async function handleReject() {
    if (!rejectTarget) return
    processing = rejectTarget.id
    try {
      await rejectRequest(rejectTarget.id, rejectReason)
      toast.success(t('storeRequests.rejected'))
      showRejectModal = false
      rejectTarget = null
      await load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      processing = null
    }
  }

  function statusClass(status: string) {
    if (status === 'APPROVED') return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    if (status === 'REJECTED') return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  }

  function statusLabel(status: string) {
    return t(`storeRequests.status.${status.toLowerCase() as 'pending' | 'approved' | 'rejected'}`)
  }
</script>

<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-2xl font-bold">{t('storeRequests.superTitle')}</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('storeRequests.superDescription')}</p>
  </div>
</div>

<div class="mb-4 flex gap-2 flex-wrap">
  <button
    onclick={() => filter = ''}
    class="px-3 py-1.5 text-sm rounded-md border {!filter ? 'bg-black text-white border-black' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}"
  >
    {t('storeRequests.allRequests')}
  </button>
  <button
    onclick={() => filter = 'PENDING'}
    class="px-3 py-1.5 text-sm rounded-md border {filter === 'PENDING' ? 'bg-black text-white border-black' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}"
  >
    {t('storeRequests.filterPending')}
  </button>
  <button
    onclick={() => filter = 'APPROVED'}
    class="px-3 py-1.5 text-sm rounded-md border {filter === 'APPROVED' ? 'bg-black text-white border-black' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}"
  >
    {t('storeRequests.filterApproved')}
  </button>
  <button
    onclick={() => filter = 'REJECTED'}
    class="px-3 py-1.5 text-sm rounded-md border {filter === 'REJECTED' ? 'bg-black text-white border-black' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}"
  >
    {t('storeRequests.filterRejected')}
  </button>
  <button
    onclick={() => { customOnly = !customOnly; filter = '' }}
    class="px-3 py-1.5 text-sm rounded-md border {customOnly ? 'bg-purple-700 text-white border-purple-700' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}"
  >
    {t('storeRequests.filterCustom')}
  </button>
</div>

{#if loading}
  <div class="space-y-3">
    {#each [1,2,3,4,5] as _}
      <div class="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
    {/each}
  </div>
{:else if filtered.length === 0}
  <p class="text-gray-500 dark:text-gray-400">{t('storeRequests.noRequestsFiltered', { status: filter ? statusLabel(filter).toLowerCase() : '' })}</p>
{:else}
  <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <tr>
          <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.admin')}</th>
          <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.table.store')}</th>
          <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.storefrontType')}</th>
          <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.table.status')}</th>
          <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.deploymentStatus')}</th>
          <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.table.date')}</th>
          <th class="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('storeRequests.table.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {#each filtered as req}
          <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="px-4 py-3">
              <p class="font-medium">{req.admin?.name || '-'}</p>
              <p class="text-xs text-gray-500">{req.admin?.email}</p>
            </td>
            <td class="px-4 py-3">
              <p class="font-medium">{req.storeName}</p>
              {#if req.adminNotes}
                <p class="text-xs text-gray-500 mt-0.5">{req.adminNotes}</p>
              {/if}
              {#if req.customizationData}
                <div class="flex items-center gap-1.5 mt-1.5">
                  {#if req.customizationData.primaryColor}
                    <span class="inline-block h-3 w-3 rounded-full" style="background:{req.customizationData.primaryColor}" title="{t('customStorefront.form.primaryColor')}: {req.customizationData.primaryColor}"></span>
                  {/if}
                  {#if req.customizationData.secondaryColor}
                    <span class="inline-block h-3 w-3 rounded-full border border-gray-300" style="background:{req.customizationData.secondaryColor}" title="{t('customStorefront.form.secondaryColor')}: {req.customizationData.secondaryColor}"></span>
                  {/if}
                  {#if req.customizationData.logoUrl}
                    <span class="text-xs text-gray-400" title="{req.customizationData.logoUrl}">🖼</span>
                  {/if}
                  {#if req.customizationData.domain}
                    <span class="text-xs text-gray-500">{req.customizationData.domain}</span>
                  {/if}
                </div>
              {/if}
            </td>
            <td class="px-4 py-3">
              {#if req.storefrontType === 'INDEPENDENT'}
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  {t('storeRequests.storefrontIndependent')}
                </span>
              {:else}
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {t('storeRequests.storefrontDefault')}
                </span>
              {/if}
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
            <td class="px-4 py-3 text-xs">
              {#if req.storefrontType === 'INDEPENDENT'}
                {#if req.store?.deploymentStatus === 'READY' && req.store?.deploymentUrl}
                  <a href={req.store.deploymentUrl} target="_blank" class="text-blue-600 hover:underline">{req.store.deploymentUrl}</a>
                {:else if req.store?.deploymentStatus === 'FAILED'}
                  <span class="text-red-600">{t('storeRequests.deployFailed')}</span>
                {:else if req.store?.deploymentStatus === 'DEPLOYING'}
                  <span class="text-yellow-600">{t('storeRequests.deployDeploying')}</span>
                {:else}
                  <span class="text-gray-500">{t('storeRequests.deployPending')}</span>
                {/if}
              {:else}
                <span class="text-gray-400">—</span>
              {/if}
            </td>
            <td class="px-4 py-3 text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>
            <td class="px-4 py-3 text-right">
              {#if req.status === 'PENDING'}
                <div class="flex items-center justify-end gap-2">
                  <button
                    onclick={() => handleApprove(req)}
                    disabled={processing === req.id}
                    class="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing === req.id ? '...' : t('storeRequests.approve')}
                  </button>
                  <button
                    onclick={() => openReject(req)}
                    disabled={processing === req.id}
                    class="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {t('storeRequests.reject')}
                  </button>
                </div>
              {:else if req.status === 'APPROVED' && req.store}
                <a href="/superadmin/stores" class="text-xs text-blue-600 hover:underline">{t('storeRequests.viewStore')}</a>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

{#if showSuccessModal && successData}
  <div class="fixed inset-0 z-50 flex items-center justify-center" onclick={() => showSuccessModal = false}>
    <div class="absolute inset-0 bg-black/40"></div>
    <div
      class="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 class="text-lg font-semibold mb-2">{t('storeRequests.approved')}</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">{successData.storeName}</p>
      {#if successData.deploymentUrl}
        <div class="mb-3">
          <label class="block text-xs font-medium text-gray-500 uppercase mb-1">{t('storeRequests.deploymentUrl')}</label>
          <a href={successData.deploymentUrl} target="_blank" class="text-blue-600 hover:underline text-sm break-all">{successData.deploymentUrl}</a>
        </div>
      {/if}
      {#if successData.rawToken}
        <div class="mb-3">
          <label class="block text-xs font-medium text-gray-500 uppercase mb-1">{t('storeRequests.tokenInfo', { code: '' }).replace(': {code}', '')}</label>
          <p class="text-2xl font-mono font-bold tracking-widest select-all">{successData.rawToken}</p>
          <p class="text-xs text-gray-500 mt-1">{t('storeRequests.tokenInfo', { code: successData.rawToken })}</p>
        </div>
      {/if}
      <div class="flex justify-end">
        <button onclick={() => showSuccessModal = false} class="px-4 py-2 bg-black text-white rounded-md text-sm">{t('superadmin.storesPage.cancel')}</button>
      </div>
    </div>
  </div>
{/if}

{#if showRejectModal && rejectTarget}
  <div class="fixed inset-0 z-50 flex items-center justify-center" onclick={() => showRejectModal = false}>
    <div class="absolute inset-0 bg-black/40"></div>
    <div
      class="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-sm w-full mx-4 p-6"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 class="text-lg font-semibold mb-2">{t('storeRequests.rejectConfirm')}</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('storeRequests.approveConfirm', { name: rejectTarget.storeName })}</p>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('storeRequests.rejectReasonLabel')}</label>
        <textarea
          bind:value={rejectReason}
          placeholder={t('storeRequests.rejectReasonPlaceholder')}
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
        ></textarea>
      </div>
      <div class="flex items-center justify-end gap-3">
        <button onclick={() => showRejectModal = false} class="text-sm text-gray-500 hover:underline">{t('superadmin.storesPage.cancel')}</button>
        <button
          onclick={handleReject}
          disabled={processing === rejectTarget.id}
          class="px-4 py-2 bg-red-600 text-white rounded-md text-sm disabled:opacity-50"
        >
          {processing === rejectTarget.id ? '...' : t('storeRequests.reject')}
        </button>
      </div>
    </div>
  </div>
{/if}
