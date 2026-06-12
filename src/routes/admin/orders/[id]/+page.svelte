<script lang="ts">
  import { onMount } from 'svelte'
  import { getOrder, updateOrderStatus } from '$lib/api/orders'
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'

  let id = $derived(page.params.id)
  let order = $state<any>(null)
  let loading = $state(true)

  onMount(async () => {
    try {
      order = await getOrder(id)
    } catch {
      toast.error('Pedido não encontrado')
    } finally { loading = false }
  })

  async function updateStatus(status: string) {
    try {
      await updateOrderStatus(id, status)
      order.status = status
      toast.success('Status atualizado')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`
  }
</script>

<h1 class="text-2xl font-bold mb-6">Pedido #{id?.slice(0, 8)}</h1>

{#if loading}
  <p class="text-gray-500">Carregando...</p>
{:else if !order}
  <p class="text-gray-500">Pedido não encontrado.</p>
{:else}
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-6">
      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h2 class="font-bold mb-4">Itens</h2>
        {#each order.items || [] as item}
          <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div>
              <p class="font-medium">{item.product?.name || item.productId}</p>
              <p class="text-sm text-gray-500">Qtd: {item.quantity} x {formatPrice(item.price)}</p>
            </div>
            <p class="font-medium">{formatPrice(item.price * item.quantity)}</p>
          </div>
        {/each}
        <div class="flex justify-between pt-4 font-bold">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h2 class="font-bold mb-4">Status</h2>
        <p class="text-lg font-medium mb-4">{order.status}</p>
        <div class="space-y-2">
          {#if order.status !== 'PAID'}
            <button onclick={() => updateStatus('PAID')} class="w-full py-2 px-4 bg-green-600 text-white rounded-md text-sm">Marcar como Pago</button>
          {/if}
          {#if order.status !== 'CANCELLED'}
            <button onclick={() => updateStatus('CANCELLED')} class="w-full py-2 px-4 bg-red-600 text-white rounded-md text-sm">Cancelar</button>
          {/if}
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h2 class="font-bold mb-4">Informações</h2>
        <p class="text-sm text-gray-500">Data: {new Date(order.createdAt).toLocaleString()}</p>
        <p class="text-sm text-gray-500">PaymentIntent: {order.stripePaymentIntentId}</p>
      </div>
    </div>
  </div>
{/if}
