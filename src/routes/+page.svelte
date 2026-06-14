<script lang="ts">
  import { isAuthenticated } from '$lib/api/auth'
  import { t } from '$lib/i18n/locale.svelte'
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
  <div class="mx-auto max-w-5xl px-4 py-20 sm:py-32">
    <div class="text-center">
      <h1 class="text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl">
        {t('landing.title')}
      </h1>
      <p class="mt-4 text-xl text-gray-600 dark:text-gray-400">
        {t('landing.subtitle')}
      </p>
      <p class="mx-auto mt-6 max-w-2xl text-base text-gray-500 dark:text-gray-400 leading-relaxed">
        {t('landing.description')}
      </p>
      <div class="mt-10 flex items-center justify-center gap-4">
        <a
          href={isAuthenticated() ? '/admin' : '/login'}
          class="inline-flex h-12 items-center justify-center rounded-lg bg-black px-8 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors"
        >
          {isAuthenticated() ? t('landing.ctaAuthenticated') : t('landing.ctaGuest')}
        </a>
        {#if !isAuthenticated()}
          <a
            href="/login"
            class="inline-flex h-12 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 px-8 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {t('landing.createAccount')}
          </a>
        {/if}
      </div>
    </div>

    <div class="mt-24 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div class="mb-3 text-2xl">📊</div>
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">{t('landing.cards.dashboard.title')}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('landing.cards.dashboard.desc')}
        </p>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div class="mb-3 text-2xl">🏪</div>
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">{t('landing.cards.multistore.title')}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('landing.cards.multistore.desc')}
        </p>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div class="mb-3 text-2xl">💳</div>
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">{t('landing.cards.payments.title')}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('landing.cards.payments.desc')}
        </p>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div class="mb-3 text-2xl">📦</div>
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">{t('landing.cards.orders.title')}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('landing.cards.orders.desc')}
        </p>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div class="mb-3 text-2xl">🚚</div>
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">{t('landing.cards.shipping.title')}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('landing.cards.shipping.desc')}
        </p>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div class="mb-3 text-2xl">🎨</div>
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">{t('landing.cards.branding.title')}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('landing.cards.branding.desc')}
        </p>
      </div>
    </div>

    <div class="mt-20 border-t border-gray-200 dark:border-gray-800 pt-10 text-center">
      <p class="text-xs text-gray-400 dark:text-gray-500">
        {t('landing.footer')}
      </p>
    </div>
  </div>
</div>
