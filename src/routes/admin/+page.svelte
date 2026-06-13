<script lang="ts">
  import { onMount } from 'svelte'
  import { listProducts } from '$lib/api/products'
  import { listOrders } from '$lib/api/orders'

  let stats = $state({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0 })
  let loading = $state(true)

  onMount(async () => {
    try {
      const [ordersData, productsData] = await Promise.all([
        listOrders(),
        listProducts()
      ])
      const allOrders = ordersData.orders || []
      const paidOrders = allOrders.filter((o: any) => o.status === 'PAID')
      const totalRevenue = paidOrders.reduce((s: number, o: any) => s + o.total, 0)

      stats = {
        totalRevenue,
        totalOrders: allOrders.length,
        totalProducts: productsData.count || 0,
        totalCustomers: 0
      }
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      loading = false
    }
  })
</script>

<h1 class="text-2xl font-bold mb-6">Dashboard</h1>

{#if loading}
  <p class="text-gray-500">Carregando...</p>
{:else}
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <p class="text-sm text-gray-500">Receita total</p>
      <p class="text-2xl font-bold mt-1">${(stats.totalRevenue / 100).toFixed(2)}</p>
    </div>
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <p class="text-sm text-gray-500">Pedidos</p>
      <p class="text-2xl font-bold mt-1">{stats.totalOrders}</p>
    </div>
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <p class="text-sm text-gray-500">Produtos</p>
      <p class="text-2xl font-bold mt-1">{stats.totalProducts}</p>
    </div>
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <p class="text-sm text-gray-500">Clientes</p>
      <p class="text-2xl font-bold mt-1">{stats.totalCustomers}</p>
    </div>
  </div>
{/if}
