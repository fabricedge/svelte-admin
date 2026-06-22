<script lang="ts">
  import { submitStoreRequest } from '$lib/api/store-requests'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'

  let activeTab = $state<'domain' | 'custom'>('domain')

  let storeName = $state('')
  let domain = $state('')
  let submittingDomain = $state(false)
  let lastSubmitResult = $state<{ paymentLink?: string; paymentIntentId?: string; connectOnboardingUrl?: string; storeName?: string } | null>(null)

  let contactName = $state('')
  let businessName = $state('')
  let description = $state('')
  let submittingContact = $state(false)
  let contactSent = $state(false)

  async function handleDomainSubmit(e: Event) {
    e.preventDefault()
    if (!storeName.trim() || !domain.trim()) return
    submittingDomain = true
    try {
      const result = await submitStoreRequest(
        storeName.trim(),
        undefined,
        'INDEPENDENT',
        false,
        { domain: domain.trim() },
      )
      lastSubmitResult = {
        paymentLink: result.paymentLink ?? undefined,
        paymentIntentId: result.paymentIntentId ?? undefined,
        connectOnboardingUrl: result.connectOnboardingUrl ?? undefined,
        storeName: result.storeName,
      }
      toast.success(t('customStorefront.domainSubmitted'))
      storeName = ''
      domain = ''
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      submittingDomain = false
    }
  }

  function handleContactSubmit(e: Event) {
    e.preventDefault()
    if (!contactName.trim() || !description.trim()) return
    submittingContact = true
    setTimeout(() => {
      contactSent = true
      submittingContact = false
      contactName = ''
      businessName = ''
      description = ''
    }, 500)
  }
</script>

<div class="max-w-2xl">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold">{t('customStorefront.title')}</h1>
  </div>

  <div class="mb-6 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
    <p class="text-sm text-blue-700 dark:text-blue-300">{t('customStorefront.planNotice')}</p>
  </div>

  <div class="mb-4 flex gap-4 border-b border-gray-200 dark:border-gray-800">
    <button
      onclick={() => activeTab = 'domain'}
      class="pb-2 text-sm font-medium border-b-2 -mb-px {activeTab === 'domain' ? 'border-black text-black dark:border-white dark:text-white' : 'border-transparent text-gray-500'}"
    >
      {t('customStorefront.tabs.domain')}
    </button>
    <button
      onclick={() => activeTab = 'custom'}
      class="pb-2 text-sm font-medium border-b-2 -mb-px {activeTab === 'custom' ? 'border-black text-black dark:border-white dark:text-white' : 'border-transparent text-gray-500'}"
    >
      {t('customStorefront.tabs.custom')}
    </button>
  </div>

  {#if activeTab === 'domain'}
    <form onsubmit={handleDomainSubmit} class="space-y-5 p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customStorefront.domainForm.storeName')}</label>
        <input
          type="text"
          bind:value={storeName}
          placeholder={t('customStorefront.domainForm.storeNamePlaceholder')}
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customStorefront.domainForm.domain')}</label>
        <input
          type="text"
          bind:value={domain}
          placeholder="ex: minhaloja.com.br"
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
        />
        <p class="text-xs text-gray-400 mt-1">{t('storeRequests.customDomainPlanNotice')}</p>
      </div>

      <button type="submit" disabled={submittingDomain} class="px-4 py-2 bg-black text-white rounded-md text-sm disabled:opacity-50">
        {submittingDomain ? t('customStorefront.domainForm.submitting') : t('customStorefront.domainForm.submit')}
      </button>
    </form>

    {#if lastSubmitResult}
      <div class="mt-6 p-6 rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
        <h3 class="text-lg font-semibold mb-1">{t('storeRequests.submittedIndependent')}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">{lastSubmitResult?.storeName} → {domain}</p>
        <div class="space-y-4 text-sm">
          <div>
            <p class="font-medium mb-1">{t('storeRequests.paySetupFee')}</p>
            <p class="text-gray-600 dark:text-gray-400 mb-2">{t('storeRequests.paySetupFeeDesc')}</p>
            {#if lastSubmitResult?.paymentLink}
              <a href={lastSubmitResult.paymentLink} target="_blank" rel="noopener noreferrer" class="inline-block px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">{t('storeRequests.paySetupFee')} →</a>
            {/if}
          </div>
          <div>
            <p class="font-medium mb-1">{t('storeRequests.completeOnboarding')}</p>
            <p class="text-gray-600 dark:text-gray-400 mb-2">{t('storeRequests.completeOnboardingDesc')}</p>
            {#if lastSubmitResult?.connectOnboardingUrl}
              <a href={lastSubmitResult.connectOnboardingUrl} target="_blank" rel="noopener noreferrer" class="inline-block px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700">{t('storeRequests.openOnboarding')}</a>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  {:else}
    {#if contactSent}
      <div class="p-6 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
        <p class="text-green-700 dark:text-green-300 text-sm">{t('customStorefront.customForm.success')}</p>
      </div>
    {:else}
      <form onsubmit={handleContactSubmit} class="space-y-5 p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customStorefront.customForm.name')}</label>
          <input
            type="text"
            bind:value={contactName}
            placeholder={t('customStorefront.customForm.namePlaceholder')}
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customStorefront.customForm.businessName')}</label>
          <input
            type="text"
            bind:value={businessName}
            placeholder={t('customStorefront.customForm.businessNamePlaceholder')}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customStorefront.customForm.description')}</label>
          <textarea
            bind:value={description}
            placeholder={t('customStorefront.customForm.descriptionPlaceholder')}
            rows="4"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
          ></textarea>
        </div>

        <button type="submit" disabled={submittingContact} class="px-4 py-2 bg-black text-white rounded-md text-sm disabled:opacity-50">
          {submittingContact ? t('customStorefront.customForm.submitting') : t('customStorefront.customForm.submit')}
        </button>
      </form>
    {/if}
  {/if}
</div>
