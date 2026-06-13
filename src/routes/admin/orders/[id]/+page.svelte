<script lang="ts">
  import { onMount } from 'svelte'
  import { getOrder, updateOrderStatus } from '$lib/api/orders'
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'

  let id = $derived(page.params.id!)
  let order = $state<any>(null)
  let loading = $state(true)

  function formatPrice(cents: number) {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }

  function statusLabel(status: string) {
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      PAID: 'Pago',
      SHIPPED: 'Enviado',
      DELIVERED: 'Entregue',
      CANCELLED: 'Cancelado',
    }
    return labels[status] || status
  }

  function statusColor(status: string) {
    if (status === 'PAID' || status === 'SHIPPED' || status === 'DELIVERED') return 'text-green-600'
    if (status === 'PENDING') return 'text-yellow-600'
    if (status === 'CANCELLED') return 'text-red-600'
    return 'text-gray-600'
  }

  function statusBg(status: string) {
    if (status === 'PAID' || status === 'SHIPPED' || status === 'DELIVERED') return 'bg-green-100 text-green-700'
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700'
    if (status === 'CANCELLED') return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-700'
  }

  const nextStatuses: Record<string, { status: string; label: string; class: string }[]> = {
    PENDING: [
      { status: 'PAID', label: 'Marcar como Pago', class: 'bg-green-600' },
      { status: 'CANCELLED', label: 'Cancelar', class: 'bg-red-600' },
    ],
    PAID: [
      { status: 'SHIPPED', label: 'Marcar como Enviado', class: 'bg-blue-600' },
      { status: 'CANCELLED', label: 'Cancelar', class: 'bg-red-600' },
    ],
    SHIPPED: [
      { status: 'DELIVERED', label: 'Marcar como Entregue', class: 'bg-green-700' },
    ],
  }

  onMount(async () => {
    try {
      order = await getOrder(id)
    } catch {
      toast.error('Pedido não encontrado')
    } finally { loading = false }
  })

  async function updateStatus(status: string) {
    try {
      const updated = await updateOrderStatus(id, status)
      order = updated
      toast.success('Status atualizado')
    } catch (err: any) {
      toast.error(err.message)
    }
  }
</script>

<h1 class="text-2xl font-bold mb-6">Pedido #{id?.slice(0, 8)}</h1>

{#if loading}
  <div class="space-y-4">
    <div class="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
    <div class="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
  </div>
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

      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h2 class="font-bold mb-4">Histórico</h2>
        {#if order.events && order.events.length > 0}
          <div class="relative pl-6 before:absolute before:left-2 before:top-1 before:bottom-1 before:w-0.5 before:bg-gray-200">
            {#each order.events as event}
              <div class="relative pb-5 last:pb-0">
                <div class="absolute -left-[18px] w-3 h-3 rounded-full border-2 border-gray-300 bg-white mt-1.5 {event.toStatus === order.status ? 'border-green-500 bg-green-500' : ''}"></div>
                <p class="text-sm font-medium">{statusLabel(event.toStatus)}</p>
                <p class="text-xs text-gray-500">
                  {event.fromStatus ? `${statusLabel(event.fromStatus)} → ` : ''}
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-sm text-gray-500">Nenhum evento registrado.</p>
        {/if}
      </div>
    </div>

    <div class="space-y-6">
      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h2 class="font-bold mb-4">Status</h2>
        <p class="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 {statusBg(order.status)}">{statusLabel(order.status)}</p>
        <div class="space-y-2">
          {#each (nextStatuses[order.status] || []) as action}
            <button
              onclick={() => updateStatus(action.status)}
              class="w-full py-2 px-4 text-white rounded-md text-sm {action.class}"
            >
              {action.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h2 class="font-bold mb-4">Informações</h2>
        <div class="space-y-2 text-sm">
          <p class="text-gray-500">Data: {new Date(order.createdAt).toLocaleString()}</p>
          {#if order.user}
            <div class="pt-2 border-t border-gray-100">
              <p class="text-gray-500 mb-1">Cliente</p>
              <p class="font-medium">{order.user.name || order.user.email}</p>
              <p class="text-gray-500 text-xs">{order.user.email}</p>
            </div>
          {/if}
          {#if order.stripePaymentIntentId}
            <div class="pt-2 border-t border-gray-100">
              <p class="text-gray-500">PaymentIntent</p>
              <p class="font-mono text-xs">{order.stripePaymentIntentId}</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
