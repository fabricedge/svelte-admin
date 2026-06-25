<script lang="ts">
  import { onMount } from 'svelte'
  import { t } from '$lib/i18n/locale.svelte'
  import { page } from '$app/state'
  import { getMyUsage, type MyUsage } from '$lib/api/stores'

  const s = $derived(page.params.slug || '')

  let usage = $state<MyUsage | null>(null)

  onMount(async () => {
    try {
      usage = await getMyUsage()
    } catch {}
  })

  const currentPlanId = $derived(usage?.plan.toLowerCase() || 'free')

  const plans = [
    {
      id: 'free',
      name: () => t('billing.plans.free.name'),
      description: () => t('billing.plans.free.description'),
      price: () => t('billing.plans.free.price'),
      priceSuffix: () => t('billing.plans.free.priceSuffix'),
      setupFee: null,
      features: [
        { key: 'storeUrl', included: true },
        { key: 'products', included: true },
        { key: 'orders', included: true },
        { key: 'customers', included: true },
        { key: 'shipping', included: true },
        { key: 'storeLimit', included: true, vars: { count: 3 } },
      ],
      ctaLabel: () => t('billing.cta.currentPlan'),
      href: null,
      highlighted: false,
      badge: null,
      vars: { slug: s },
    },
    {
      id: 'monthly',
      name: () => t('billing.plans.monthly.name'),
      description: () => t('billing.plans.monthly.description'),
      price: () => t('billing.plans.monthly.price'),
      priceSuffix: () => t('billing.plans.monthly.priceSuffix'),
      setupFee: () => t('billing.plans.monthly.setupFee'),
      features: [
        { key: 'everythingInFree', included: true },
        { key: 'customDomain', included: true },
        { key: 'storeLimit', included: true, vars: { count: 10 } },
      ],
      ctaLabel: () => currentPlanId === 'monthly' ? t('billing.cta.currentPlan') : t('billing.cta.requestCustom'),
      href: `/admin/${s}/custom-storefront`,
      highlighted: currentPlanId === 'monthly' ? false : true,
      badge: currentPlanId === 'monthly' ? null : () => t('billing.planIncludes'),
      vars: { slug: s },
    },
    {
      id: 'branding',
      name: () => t('billing.plans.branding.name'),
      description: () => t('billing.plans.branding.description'),
      price: () => t('billing.plans.branding.price'),
      priceSuffix: () => t('billing.plans.branding.priceSuffix'),
      setupFee: () => t('billing.plans.branding.setupFee'),
      features: [
        { key: 'everythingInMonthly', included: true },
        { key: 'customBranding', included: true },
        { key: 'storeLimitUnlimited', included: true },
      ],
      ctaLabel: () => currentPlanId === 'branding' || currentPlanId === 'custom' ? t('billing.cta.currentPlan') : t('billing.cta.requestBranding'),
      href: `/admin/${s}/custom-storefront`,
      highlighted: false,
      badge: null,
      vars: { slug: s },
    },
  ]

  const faq = $derived([
    { q: t('billing.faq.0.q'), a: t('billing.faq.0.a') },
    { q: t('billing.faq.1.q'), a: t('billing.faq.1.a') },
    { q: t('billing.faq.2.q'), a: t('billing.faq.2.a') },
    { q: t('billing.faq.3.q'), a: t('billing.faq.3.a') },
  ])
</script>

<div class="max-w-5xl mx-auto">
  <div class="text-center mb-12">
    <h1 class="text-3xl font-bold mb-3">{t('billing.title')}</h1>
    <p class="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">{t('billing.subtitle')}</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
    {#each plans as plan}
      <div
        class="relative rounded-2xl border {plan.highlighted ? 'border-black dark:border-white shadow-lg ring-1 ring-black/10 dark:ring-white/10' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-900 p-8 flex flex-col"
      >
        {#if plan.badge}
          <div
            class="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap {plan.highlighted ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}"
          >
            {plan.badge()}
          </div>
        {/if}

        <h2 class="text-xl font-bold mb-1">{plan.name()}</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">{plan.description()}</p>

        <div class="mb-6">
          <span class="text-4xl font-bold">{plan.price()}</span>
          <span class="text-gray-500 dark:text-gray-400 text-sm ml-1">{plan.priceSuffix()}</span>
          {#if plan.setupFee}
            <p class="text-sm text-gray-400 mt-1">+ {plan.setupFee()}</p>
          {/if}
        </div>

        <ul class="space-y-3 mb-8 flex-1">
          {#each plan.features as feat}
            <li class="flex items-start gap-3 text-sm">
              {#if feat.included}
                <span class="text-green-600 dark:text-green-400 shrink-0 mt-0.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                </span>
              {:else}
                <span class="text-gray-300 dark:text-gray-600 shrink-0 mt-0.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </span>
              {/if}
              <span class:line-through={!feat.included} class="text-gray-700 dark:text-gray-300">{t(`billing.features.${feat.key}`, { ...plan.vars, ...feat.vars })}</span>
            </li>
          {/each}
        </ul>

        {#if plan.href}
          <a
            href={plan.href}
            class="block w-full text-center py-3 rounded-xl text-sm font-semibold bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors"
          >
            {plan.ctaLabel()}
          </a>
        {:else}
          <div class="w-full text-center py-3 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-default">
            {plan.ctaLabel()}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="mb-16">
    <h2 class="text-xl font-bold mb-6 text-center">{t('billing.faq.title')}</h2>
    <div class="space-y-4 max-w-2xl mx-auto">
      {#each faq as item}
        <details class="group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <summary class="flex items-center justify-between px-5 py-4 text-sm font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            {item.q}
            <svg class="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </summary>
          <div class="px-5 pb-4 text-sm text-gray-600 dark:text-gray-400">
            {item.a}
          </div>
        </details>
      {/each}
    </div>
  </div>
</div>
