<script lang="ts">
  import { onMount } from 'svelte'
  import { getStats } from '$lib/api/stats'
  import { listOrders } from '$lib/api/orders'
  import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js'
  import { t, getLocale } from '$lib/i18n/locale.svelte'

  Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

  let stats = $state<any>(null)
  let recentOrders = $state<any[]>([])
  let loading = $state(true)
  let chartCanvas: HTMLCanvasElement | undefined = $state()
  let chart: Chart | null = null

  const localeMap: Record<string, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }

  function formatPrice(cents: number) {
    const locale = localeMap[getLocale()] || 'pt-BR'
    return `R$ ${(cents / 100).toLocaleString(locale, { minimumFractionDigits: 2 })}`
  }

  function statusLabel(status: string) {
    return t(`dashboard.status.${status}`) || status
  }

  function statusClass(status: string) {
    if (status === 'PAID' || status === 'SHIPPED' || status === 'DELIVERED') return 'text-green-600'
    if (status === 'PENDING') return 'text-yellow-600'
    if (status === 'CANCELLED') return 'text-red-600'
    return 'text-gray-600'
  }

  const statusColors: Record<string, string> = {
    PENDING: '#eab308',
    PAID: '#22c55e',
    SHIPPED: '#3b82f6',
    DELIVERED: '#16a34a',
    CANCELLED: '#ef4444',
  }

  onMount(async () => {
    try {
      const [statsData, ordersData] = await Promise.all([
        getStats(),
        listOrders(),
      ])
      stats = statsData
      recentOrders = (ordersData.orders || []).slice(0, 5)
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      loading = false
    }
  })

  $effect(() => {
    if (chart) {
      chart.destroy()
      chart = null
    }

    if (!loading && stats && chartCanvas) {
      const statuses = stats.ordersByStatus || []
      chart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
          labels: statuses.map((s: any) => statusLabel(s.status)),
          datasets: [{
            data: statuses.map((s: any) => s.count),
            backgroundColor: statuses.map((s: any) => statusColors[s.status] || '#6b7280'),
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
          },
        },
      })
    }

    return () => {
      if (chart) {
        chart.destroy()
        chart = null
      }
    }
  })
</script>

<h1 class="text-2xl font-bold mb-6">{t('dashboard.title')}</h1>

{#if loading}
  <div class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each [1,2,3,4] as _}
        <div class="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div class="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
      {/each}
    </div>
  </div>
{:else if stats}
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <p class="text-sm text-gray-500">{t('dashboard.revenue')}</p>
      <p class="text-2xl font-bold mt-1">{formatPrice(stats.revenue.total)}</p>
    </div>
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <p class="text-sm text-gray-500">{t('dashboard.orders')}</p>
      <p class="text-2xl font-bold mt-1">{stats.totalOrders}</p>
    </div>
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <p class="text-sm text-gray-500">{t('dashboard.products')}</p>
      <p class="text-2xl font-bold mt-1">{stats.totalProducts}</p>
    </div>
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <p class="text-sm text-gray-500">{t('dashboard.customers')}</p>
      <p class="text-2xl font-bold mt-1">{stats.totalCustomers}</p>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <p class="text-sm text-gray-500 mb-1">{t('dashboard.revenueToday')}</p>
      <p class="text-xl font-bold">{formatPrice(stats.revenue.today)}</p>
    </div>
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <p class="text-sm text-gray-500 mb-1">{t('dashboard.revenueWeek')}</p>
      <p class="text-xl font-bold">{formatPrice(stats.revenue.week)}</p>
    </div>
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <p class="text-sm text-gray-500 mb-1">{t('dashboard.revenueMonth')}</p>
      <p class="text-xl font-bold">{formatPrice(stats.revenue.month)}</p>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h2 class="font-bold mb-4">{t('dashboard.ordersByStatus')}</h2>
      <div class="max-w-xs mx-auto">
        <canvas bind:this={chartCanvas}></canvas>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h2 class="font-bold mb-4">{t('dashboard.recentOrders')}</h2>
      {#if recentOrders.length === 0}
        <p class="text-sm text-gray-500">{t('dashboard.noOrders')}</p>
      {:else}
        <div class="space-y-3">
          {#each recentOrders as order}
            <a href="/admin/orders/{order.id}" class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded">
              <div>
                <p class="text-sm font-medium">#{order.id.slice(0, 8)}</p>
                <p class="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString(localeMap[getLocale()] || 'pt-BR')}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium">{formatPrice(order.total)}</p>
                <p class="text-xs font-medium {statusClass(order.status)}">{statusLabel(order.status)}</p>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}
