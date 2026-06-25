<script lang="ts">
  import { getStoreContext } from '$lib/stores/store-context.svelte'
  import { t } from '$lib/i18n/locale.svelte'
  import { page } from '$app/state'

  const ctx = getStoreContext()

  let open = $state(false)
</script>

<div class="relative px-6 py-3 border-b border-gray-200 dark:border-gray-800">
  {#if ctx.loading}
    <div class="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
  {:else}
    <button
      onclick={() => { if (ctx.canManageStores()) open = !open }}
      class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors {ctx.canManageStores() ? 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer' : 'cursor-default'}"
      title={!ctx.canManageStores() ? t('common.storeSelector.unavailable') : t('common.storeSelector.switchStore')}
    >
      <div class="flex-1 min-w-0">
        <p class="truncate font-medium text-gray-900 dark:text-gray-100">
          {ctx.currentStore?.name || t('common.storeLoading')}
        </p>
        <p class="truncate text-xs text-gray-500 dark:text-gray-400">
          {ctx.currentStore ? `/${ctx.currentStore.slug}` : ''}
        </p>
        {#if ctx.currentStore?.domain}
          <p class="truncate text-xs text-gray-400 dark:text-gray-500">
            {ctx.currentStore.domain}
          </p>
        {/if}
        {#if ctx.isSuperAdmin}
          <span class="inline-block mt-0.5 rounded bg-purple-100 dark:bg-purple-900 px-1 py-0.5 text-[9px] font-medium text-purple-700 dark:text-purple-300 leading-none">{t('superadmin.badge')}</span>
        {/if}
      </div>
      {#if ctx.canManageStores()}
        <svg class="h-4 w-4 shrink-0 text-gray-400 transition-transform" class:rotate-180={open} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      {:else}
        <span class="shrink-0 text-xs text-gray-400" title={t('common.storeSelector.unavailable')}>🔒</span>
      {/if}
    </button>

    {#if open && ctx.canManageStores()}
      <div class="absolute left-3 right-3 top-full z-50 mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
        {#each ctx.stores as store}
          <button
            onclick={() => { ctx.switchStore(store, page.url.pathname); open = false }}
            class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 {ctx.currentStore?.id === store.id ? 'font-semibold' : ''}"
          >
            <span class="h-2 w-2 shrink-0 rounded-full {store.isActive ? 'bg-green-500' : 'bg-gray-300'}" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-gray-900 dark:text-gray-100">{store.name}</p>
              <p class="truncate text-xs text-gray-500 dark:text-gray-400">{store.slug}</p>
              {#if store.domain}
                <p class="truncate text-xs text-gray-400 dark:text-gray-500">{store.domain}</p>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    {/if}
  {/if}
</div>
