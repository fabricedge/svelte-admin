<script lang="ts">
  import { onMount } from 'svelte'
  import { listProducts, deleteProduct, duplicateProduct, listCategories } from '$lib/api/products'
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'
  import ConfirmModal from '$lib/components/ConfirmModal.svelte'
  import { exportCSV } from '$lib/utils/csv'
  import { t } from '$lib/i18n/locale.svelte'

  let products = $state<any[]>([])
  let categories: string[] = $state([])
  let loading = $state(true)
  let search = $state('')
  let categoryFilter = $state(page.url.searchParams.get('category') || '')
  let currentPage = $state(1)
  let totalPages = $state(1)
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  let deleteTarget = $state<string | null>(null)

  onMount(() => {
    listCategories().then((d) => { categories = (d.categories || []).map((c: any) => c.name || c) }).catch(() => {})
    load()
  })

  async function load() {
    loading = true
    try {
      const params: Record<string, string> = { limit: '20', offset: String((currentPage - 1) * 20) }
      if (search) params.search = search
      if (categoryFilter) params.category = categoryFilter
      const data = await listProducts(params)
      products = data.products || []
      totalPages = Math.max(1, Math.ceil((data.count || 0) / 20))
    } catch (err) {
      console.error('Erro ao carregar produtos:', err)
    } finally {
      loading = false
    }
  }

  function onSearchInput() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      currentPage = 1
      load()
    }, 300)
  }

  function onCategoryChange() {
    currentPage = 1
    load()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await deleteProduct(deleteTarget)
      products = products.filter(p => p.id !== deleteTarget)
      toast.success(t('products.deleted'))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      deleteTarget = null
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await duplicateProduct(id)
      toast.success(t('products.duplicated'))
      load()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  function handleExportCSV() {
    exportCSV(t('products.title'), [t('products.table.name'), t('products.table.price'), t('products.table.category'), t('products.table.inventory')],
      products.map((p) => [
        p.name,
        formatPrice(p.price),
        p.category || '-',
        String(p.inventory),
      ])
    )
  }

  function formatPrice(cents: number) {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }
</script>

<ConfirmModal
  open={deleteTarget !== null}
  title={t('products.deleteProduct')}
  message={t('products.confirmDelete')}
  confirmLabel={t('products.deleteProduct')}
  onConfirm={confirmDelete}
  onCancel={() => { deleteTarget = null }}
/>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">{t('products.title')}</h1>
  <div class="flex items-center gap-3">
    <select bind:value={categoryFilter} onchange={onCategoryChange} class="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-gray-300">
      <option value="">{t('products.categoryAll')}</option>
      {#each categories as cat}
        <option value={cat}>{cat}</option>
      {/each}
    </select>
    <input
      type="text"
      placeholder={t('products.searchPlaceholder')}
      bind:value={search}
      oninput={onSearchInput}
      class="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-gray-300 w-48 lg:w-64"
    />
    <button onclick={handleExportCSV} class="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">{t('common.csv')}</button>
    <a href="/admin/products/new" class="px-4 py-2 bg-black text-white rounded-md text-sm">{t('products.addProduct')}</a>
  </div>
</div>

{#if loading}
  <div class="space-y-3">
    {#each [1,2,3,4,5] as _}
      <div class="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
    {/each}
  </div>
{:else if products.length === 0}
  <p class="text-gray-500 dark:text-gray-400">{t('products.noProducts')}</p>
{:else}
  <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
        <tr>
          <th class="text-left px-4 py-3 font-medium dark:text-gray-300">{t('products.table.name')}</th>
          <th class="text-left px-4 py-3 font-medium dark:text-gray-300">{t('products.table.price')}</th>
          <th class="text-left px-4 py-3 font-medium dark:text-gray-300">{t('products.table.category')}</th>
          <th class="text-left px-4 py-3 font-medium dark:text-gray-300">{t('products.table.inventory')}</th>
          <th class="text-right px-4 py-3 font-medium dark:text-gray-300">{t('products.table.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {#each products as product}
          <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="px-4 py-3 dark:text-gray-300">{product.name}</td>
            <td class="px-4 py-3 dark:text-gray-300">{formatPrice(product.price)}</td>
            <td class="px-4 py-3 dark:text-gray-300">{product.category || '-'}</td>
            <td class="px-4 py-3">
              <span class:font-bold={product.inventory <= 5} class:text-red-600={product.inventory <= 5}>
                {product.inventory}
              </span>
            </td>
            <td class="px-4 py-3 text-right space-x-2">
              <button onclick={() => handleDuplicate(product.id)} class="text-gray-600 dark:text-gray-400 hover:underline text-xs">{t('products.duplicate')}</button>
              <a href="/admin/products/{product.id}" class="text-blue-600 dark:text-blue-400 hover:underline">{t('products.editProduct')}</a>
              <button onclick={() => { deleteTarget = product.id }} class="text-red-600 hover:underline">{t('products.deleteProduct')}</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if totalPages > 1}
    <div class="flex items-center justify-center gap-2 mt-4">
      <button
        onclick={() => { currentPage = Math.max(1, currentPage - 1); load() }}
        disabled={currentPage <= 1}
        class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md disabled:opacity-50 dark:text-gray-300"
      >
        {t('common.pagination.previous')}
      </button>
      <span class="text-sm text-gray-600 dark:text-gray-400">{t('common.pagination.page', { current: currentPage, total: totalPages })}</span>
      <button
        onclick={() => { currentPage = Math.min(totalPages, currentPage + 1); load() }}
        disabled={currentPage >= totalPages}
        class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md disabled:opacity-50 dark:text-gray-300"
      >
        {t('common.pagination.next')}
      </button>
    </div>
  {/if}
{/if}
