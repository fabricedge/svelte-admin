<script lang="ts">
  import { onMount } from 'svelte'
  import { getStoreContext } from '$lib/stores/store-context.svelte'
  import { getStores } from '$lib/api/stores'

  const ctx = getStoreContext()

  let storesCount = $state(0)
  let adminsCount = $state(0)
  let loading = $state(true)

  onMount(async () => {
    try {
      const stores = await getStores()
      storesCount = stores.length
    } catch {}
    loading = false
  })
</script>

<h1 class="text-2xl font-bold mb-6">Painel Superior</h1>

<p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
  Gerencie todas as lojas, branding e configurações globais.
</p>

{#if loading}
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    {#each [1,2,3] as _}
      <div class="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
    {/each}
  </div>
{:else}
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="rounded-lg border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-gray-900">
      <p class="text-sm text-gray-500 dark:text-gray-400">Lojas</p>
      <p class="text-3xl font-bold mt-1">{storesCount}</p>
    </div>
    <div class="rounded-lg border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-gray-900">
      <p class="text-sm text-gray-500 dark:text-gray-400">Loja atual</p>
      <p class="text-lg font-bold mt-1 truncate">{ctx.currentStore?.name || '-'}</p>
    </div>
    <div class="rounded-lg border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-gray-900">
      <p class="text-sm text-gray-500 dark:text-gray-400">Multi-store</p>
      <p class="text-3xl font-bold mt-1">{ctx.multiStoreEnabled ? '✅' : '❌'}</p>
    </div>
  </div>
{/if}
