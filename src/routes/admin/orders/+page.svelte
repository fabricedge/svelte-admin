<script lang="ts">
  import { onMount } from 'svelte'
  import { listOrders } from '$lib/api/orders'

  let orders = $state<any[]>([])
  let loading = $state(true)

  onMount(async () => {
    try {
      const data = await listOrders()
      orders = data.orders || []
    } catch (err) { console.error('Erro ao carregar pedidos:', err) } finally { loading = false }
  })

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`
  }

  function statusClass(status: string) {
    if (status === 'PAID') return 'text-green-600'
    if (status === 'PENDING') return 'text-yellow-600'
    if (status === 'CANCELLED') return 'text-red-600'
    return 'text-gray-600'
  }
</script>

<h1 class="text-2xl font-bold mb-6">Pedidos</h1>

{#if loading}
  <p class="text-gray-500">Carregando...</p>
{:else if orders.length === 0}
  <p class="text-gray-500">Nenhum pedido encontrado.</p>
{:else}
  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="text-left px-4 py-3 font-medium">ID</th>
          <th class="text-left px-4 py-3 font-medium">Total</th>
          <th class="text-left px-4 py-3 font-medium">Status</th>
          <th class="text-left px-4 py-3 font-medium">Data</th>
          <th class="text-right px-4 py-3 font-medium">Ações</th>
        </tr>
      </thead>
      <tbody>
        {#each orders as order}
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 font-mono text-xs">{order.id.slice(0, 12)}...</td>
            <td class="px-4 py-3">{formatPrice(order.total)}</td>
            <td class="px-4 py-3 font-medium {statusClass(order.status)}">{order.status}</td>
            <td class="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
            <td class="px-4 py-3 text-right">
              <a href="/admin/orders/{order.id}" class="text-blue-600 hover:underline">Detalhes</a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
