<script lang="ts">
  import { onMount } from 'svelte'
  import { listOrders, bulkUpdateOrderStatus } from '$lib/api/orders'
  import { toast } from 'svelte-sonner'
  import ConfirmModal from '$lib/components/ConfirmModal.svelte'
  import { exportCSV } from '$lib/utils/csv'
  import { t, getLocale } from '$lib/i18n/locale.svelte'

  let orders = $state<any[]>([])
  let loading = $state(true)
  let currentPage = $state(1)
  let totalPages = $state(1)
  let statusFilter = $state('ALL')
  let search = $state('')
  let selectedIds = $state<Set<string>>(new Set())
  let bulkLoading = $state(false)
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  let bulkAction = $state<{ status: string; label: string } | null>(null)

  const localeMap: Record<string, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }

  onMount(() => load())

  async function load() {
    loading = true
    try {
      const params: Record<string, string> = { page: String(currentPage) }
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (search) params.search = search
      const data = await listOrders(params)
      orders = data.orders || []
      totalPages = data.pages || 1
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err)
    } finally {
      loading = false
    }
  }

  function onFilterChange() {
    currentPage = 1
    load()
  }

  function onSearchInput() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      currentPage = 1
      load()
    }, 300)
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds = next
  }

  function toggleSelectAll() {
    if (selectedIds.size === orders.length) {
      selectedIds = new Set()
    } else {
      selectedIds = new Set(orders.map((o) => o.id))
    }
  }

  async function confirmBulkAction() {
    if (!bulkAction || selectedIds.size === 0) return
    bulkLoading = true
    try {
      await bulkUpdateOrderStatus([...selectedIds], bulkAction.status)
      toast.success(t('orders.bulk.updated', { count: selectedIds.size }))
      selectedIds = new Set()
      bulkAction = null
      load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      bulkLoading = false
    }
  }

  function handleExportCSV() {
    const locale = localeMap[getLocale()] || 'pt-BR'
    exportCSV(t('orders.title'), [t('orders.table.order'), t('orders.table.customer'), t('orders.table.total'), t('orders.table.status'), t('orders.table.date')],
      orders.map((o) => [
        o.id,
        o.user?.email || '-',
        formatPrice(o.total),
        statusLabel(o.status),
        new Date(o.createdAt).toLocaleDateString(locale),
      ])
    )
  }

  function formatPrice(cents: number) {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }

  function statusLabel(status: string) {
    return t(`orders.statusLabels.${status}`) || status
  }

  function statusClass(status: string) {
    if (status === 'PAID' || status === 'SHIPPED' || status === 'DELIVERED') return 'text-green-600 dark:text-green-400'
    if (status === 'PENDING') return 'text-yellow-600 dark:text-yellow-400'
    if (status === 'CANCELLED') return 'text-red-600 dark:text-red-400'
    return 'text-gray-600'
  }
</script>

<ConfirmModal
  open={bulkAction !== null}
  title={t('orders.bulk.title')}
  message={bulkAction ? t('orders.bulk.message', { count: selectedIds.size, label: bulkAction.label }) : ''}
  confirmLabel={bulkAction?.label ?? t('common.confirm')}
  onConfirm={confirmBulkAction}
  onCancel={() => { bulkAction = null }}
/>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">{t('orders.title')}</h1>
  <div class="flex items-center gap-3">
    <input
      type="text"
      placeholder={t('orders.searchPlaceholder')}
      bind:value={search}
      oninput={onSearchInput}
      class="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-gray-300 w-48 lg:w-64"
    />
    <select
      bind:value={statusFilter}
      onchange={onFilterChange}
      class="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 dark:text-gray-300"
    >
      <option value="ALL">{t('orders.statusAll')}</option>
      <option value="PENDING">{t('orders.statusLabels.PENDING')}</option>
      <option value="PAID">{t('orders.statusLabels.PAID')}</option>
      <option value="SHIPPED">{t('orders.statusLabels.SHIPPED')}</option>
      <option value="DELIVERED">{t('orders.statusLabels.DELIVERED')}</option>
      <option value="CANCELLED">{t('orders.statusLabels.CANCELLED')}</option>
    </select>
    <button onclick={handleExportCSV} class="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">{t('orders.exportCSV')}</button>
  </div>
</div>

{#if selectedIds.size > 0}
  <div class="mb-4 flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <span class="text-sm text-gray-600 dark:text-gray-400">{t('orders.bulk.selectedCount', { count: selectedIds.size })}</span>
    {#if statusFilter === 'ALL' || statusFilter === 'PENDING'}
      <button onclick={() => { bulkAction = { status: 'PAID', label: t('orders.bulk.pay') } }} disabled={bulkLoading} class="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md disabled:opacity-50">{t('orders.bulk.pay')}</button>
    {/if}
    {#if statusFilter === 'ALL' || statusFilter === 'PAID'}
      <button onclick={() => { bulkAction = { status: 'SHIPPED', label: t('orders.bulk.ship') } }} disabled={bulkLoading} class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md disabled:opacity-50">{t('orders.bulk.ship')}</button>
    {/if}
    {#if statusFilter === 'ALL' || statusFilter === 'SHIPPED'}
      <button onclick={() => { bulkAction = { status: 'DELIVERED', label: t('orders.bulk.deliver') } }} disabled={bulkLoading} class="px-3 py-1.5 text-sm bg-green-700 text-white rounded-md disabled:opacity-50">{t('orders.bulk.deliver')}</button>
    {/if}
    {#if statusFilter === 'ALL' || statusFilter === 'PENDING' || statusFilter === 'PAID'}
      <button onclick={() => { bulkAction = { status: 'CANCELLED', label: t('orders.bulk.cancel') } }} disabled={bulkLoading} class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md disabled:opacity-50">{t('orders.bulk.cancel')}</button>
    {/if}
  </div>
{/if}

{#if loading}
  <div class="space-y-3">
    {#each [1,2,3,4,5] as _}
      <div class="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
    {/each}
  </div>
{:else if orders.length === 0}
  <p class="text-gray-500 dark:text-gray-400">{t('orders.noOrders')}</p>
{:else}
  <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
        <tr>
          <th class="px-4 py-3 w-10">
            <input type="checkbox" checked={selectedIds.size === orders.length && orders.length > 0} onchange={toggleSelectAll} class="rounded dark:bg-gray-700" />
          </th>
          <th class="text-left px-4 py-3 font-medium dark:text-gray-300">{t('orders.table.order')}</th>
          <th class="text-left px-4 py-3 font-medium dark:text-gray-300">{t('orders.table.customer')}</th>
          <th class="text-left px-4 py-3 font-medium dark:text-gray-300">{t('orders.table.total')}</th>
          <th class="text-left px-4 py-3 font-medium dark:text-gray-300">{t('orders.table.status')}</th>
          <th class="text-left px-4 py-3 font-medium dark:text-gray-300">{t('orders.table.date')}</th>
          <th class="text-right px-4 py-3 font-medium dark:text-gray-300">{t('orders.table.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {#each orders as order}
          <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="px-4 py-3">
              <input type="checkbox" checked={selectedIds.has(order.id)} onchange={() => toggleSelect(order.id)} class="rounded dark:bg-gray-700" />
            </td>
            <td class="px-4 py-3 font-mono text-xs dark:text-gray-300">{order.id.slice(0, 12)}...</td>
            <td class="px-4 py-3 dark:text-gray-300">{order.user?.email?.split('@')[0] || '-'}</td>
            <td class="px-4 py-3 dark:text-gray-300">{formatPrice(order.total)}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1.5 font-medium {statusClass(order.status)}">
                <span class="w-1.5 h-1.5 rounded-full inline-block bg-current"></span>
                {statusLabel(order.status)}
              </span>
            </td>
            <td class="px-4 py-3 dark:text-gray-300">{new Date(order.createdAt).toLocaleDateString(localeMap[getLocale()] || 'pt-BR')}</td>
            <td class="px-4 py-3 text-right">
              <a href="/admin/orders/{order.id}" class="text-blue-600 dark:text-blue-400 hover:underline">{t('common.details')}</a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if totalPages > 1}
    <div class="flex items-center justify-center gap-2 mt-4">
      <button onclick={() => { currentPage = Math.max(1, currentPage - 1); load() }} disabled={currentPage <= 1} class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md disabled:opacity-50 dark:text-gray-300">{t('common.pagination.previous')}</button>
      <span class="text-sm text-gray-600 dark:text-gray-400">{t('common.pagination.page', { current: currentPage, total: totalPages })}</span>
      <button onclick={() => { currentPage = Math.min(totalPages, currentPage + 1); load() }} disabled={currentPage >= totalPages} class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md disabled:opacity-50 dark:text-gray-300">{t('common.pagination.next')}</button>
    </div>
  {/if}
{/if}
