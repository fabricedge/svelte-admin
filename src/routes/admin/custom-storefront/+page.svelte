<script lang="ts">
  import { onMount } from 'svelte'
  import { submitStoreRequest, getMyRequests, type StoreRequest, type CustomizationData } from '$lib/api/store-requests'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'

  let requests = $state<StoreRequest[]>([])
  let loading = $state(true)
  let activeTab = $state<'form' | 'requests'>('form')

  // Form fields
  let storeName = $state('')
  let domain = $state('')
  let primaryColor = $state('#000000')
  let secondaryColor = $state('#ffffff')
  let logoUrl = $state('')
  let faviconUrl = $state('')
  let fontFamily = $state('')
  let enableToken = $state(false)
  let adminNotes = $state('')
  let submitting = $state(false)

  onMount(async () => {
    try {
      requests = await getMyRequests()
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
      const cd: CustomizationData = {}
      if (domain.trim()) cd.domain = domain.trim()
      if (primaryColor && primaryColor !== '#000000') cd.primaryColor = primaryColor
      if (secondaryColor && secondaryColor !== '#ffffff') cd.secondaryColor = secondaryColor
      if (logoUrl.trim()) cd.logoUrl = logoUrl.trim()
      if (faviconUrl.trim()) cd.faviconUrl = faviconUrl.trim()
      if (fontFamily.trim()) cd.fontFamily = fontFamily.trim()

      await submitStoreRequest(
        storeName.trim(),
        adminNotes.trim() || undefined,
        'INDEPENDENT',
        enableToken,
        Object.keys(cd).length > 0 ? cd : undefined,
      )
      toast.success(t('customStorefront.submitted'))
      // Reset form
      storeName = ''
      domain = ''
      primaryColor = '#000000'
      secondaryColor = '#ffffff'
      logoUrl = ''
      faviconUrl = ''
      fontFamily = ''
      enableToken = false
      adminNotes = ''
      requests = await getMyRequests()
      activeTab = 'requests'
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      submitting = false
    }
  }

  let customRequests = $derived(
    requests.filter((r) => r.storefrontType === 'INDEPENDENT' && r.customizationData)
  )

  function statusLabel(status: string) {
    return t(`storeRequests.status.${status.toLowerCase() as 'pending' | 'approved' | 'rejected'}`)
  }

  function statusClass(status: string) {
    if (status === 'APPROVED') return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    if (status === 'REJECTED') return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  }
</script>

<div class="max-w-2xl">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold">{t('customStorefront.title')}</h1>
  </div>

  <div class="mb-4 flex gap-4 border-b border-gray-200 dark:border-gray-800">
    <button
      onclick={() => activeTab = 'form'}
      class="pb-2 text-sm font-medium border-b-2 -mb-px {activeTab === 'form' ? 'border-black text-black dark:border-white dark:text-white' : 'border-transparent text-gray-500'}"
    >
      {t('customStorefront.tabs.form')}
    </button>
    <button
      onclick={() => activeTab = 'requests'}
      class="pb-2 text-sm font-medium border-b-2 -mb-px {activeTab === 'requests' ? 'border-black text-black dark:border-white dark:text-white' : 'border-transparent text-gray-500'}"
    >
      {t('customStorefront.tabs.requests')} ({customRequests.length})
    </button>
  </div>

  {#if activeTab === 'form'}
    <form onsubmit={handleSubmit} class="space-y-5 p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
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
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customStorefront.form.domain')}</label>
        <input
          type="text"
          bind:value={domain}
          placeholder="ex: minhaloja.com.br"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div>
        <p class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('customStorefront.form.branding')}</p>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">{t('customStorefront.form.primaryColor')}</label>
            <div class="flex items-center gap-2">
              <input
                type="color"
                bind:value={primaryColor}
                class="h-9 w-12 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
              />
              <input
                type="text"
                bind:value={primaryColor}
                class="w-24 px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded text-xs font-mono bg-white dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">{t('customStorefront.form.secondaryColor')}</label>
            <div class="flex items-center gap-2">
              <input
                type="color"
                bind:value={secondaryColor}
                class="h-9 w-12 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
              />
              <input
                type="text"
                bind:value={secondaryColor}
                class="w-24 px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded text-xs font-mono bg-white dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customStorefront.form.logoUrl')}</label>
          <input
            type="url"
            bind:value={logoUrl}
            placeholder="https://..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customStorefront.form.faviconUrl')}</label>
          <input
            type="url"
            bind:value={faviconUrl}
            placeholder="https://..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customStorefront.form.fontFamily')}</label>
        <input
          type="text"
          bind:value={fontFamily}
          placeholder="Inter, sans-serif"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
        />
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
      </div>
    </form>
  {:else}
    {#if loading}
      <div class="space-y-3">
        {#each [1,2,3] as _}
          <div class="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        {/each}
      </div>
    {:else if customRequests.length === 0}
      <p class="text-gray-500 dark:text-gray-400">{t('customStorefront.noRequests')}</p>
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
            {#each customRequests as req}
              <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="px-4 py-3">
                  <p class="font-medium">{req.storeName}</p>
                  {#if req.customizationData}
                    <div class="flex items-center gap-1.5 mt-1">
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
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>
