<script lang="ts">
  import { onMount } from 'svelte'
  import { getUser, updateUserRole } from '$lib/api/users'
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'

  let id = $derived(page.params.id!)
  let userData = $state<any>(null)
  let loading = $state(true)

  function formatPrice(cents: number) {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }

  function statusClass(status: string) {
    if (status === 'PAID' || status === 'SHIPPED' || status === 'DELIVERED') return 'text-green-600'
    if (status === 'PENDING') return 'text-yellow-600'
    if (status === 'CANCELLED') return 'text-red-600'
    return 'text-gray-600'
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

  onMount(async () => {
    try {
      userData = await getUser(id)
    } catch {
      toast.error(t('customers.detail.notFound'))
    } finally {
      loading = false
    }
  })
</script>

<h1 class="text-2xl font-bold mb-6">{t('customers.detail.title')}</h1>

{#if loading}
  <div class="space-y-4">
    <div class="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
    <div class="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
  </div>
{:else if !userData}
  <p class="text-gray-500">{t('customers.detail.notFound')}</p>
{:else}
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h2 class="font-bold mb-4">{t('customers.detail.info')}</h2>
      <div class="space-y-3 text-sm">
        <div>
          <p class="text-gray-500">{t('customers.detail.email')}</p>
          <p class="font-medium">{userData.user.email}</p>
        </div>
        <div>
          <p class="text-gray-500">{t('customers.detail.name')}</p>
          <p class="font-medium">{userData.user.name || '-'}</p>
        </div>
        <div>
          <p class="text-gray-500">{t('customers.detail.role')}</p>
          <div class="flex items-center gap-2 mt-1">
            <span class="inline-block px-2 py-0.5 text-xs font-medium rounded {userData.user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}">
              {userData.user.role}
            </span>
            {#if userData.user.role === 'CUSTOMER'}
              <button
                onclick={async () => {
                  try {
                    await updateUserRole(userData.user.id, 'ADMIN')
                    userData.user.role = 'ADMIN'
                    toast.success(t('customers.detail.promoted'))
                  } catch (err: any) { toast.error(err.message) }
                }}
                class="text-xs text-blue-600 hover:underline"
              >{t('customers.detail.promote')}</button>
            {:else}
              <button
                onclick={async () => {
                  try {
                    await updateUserRole(userData.user.id, 'CUSTOMER')
                    userData.user.role = 'CUSTOMER'
                    toast.success(t('customers.detail.demoted'))
                  } catch (err: any) { toast.error(err.message) }
                }}
                class="text-xs text-red-600 hover:underline"
              >{t('customers.detail.demote')}</button>
            {/if}
          </div>
        </div>
        <div>
          <p class="text-gray-500">{t('customers.detail.memberSince')}</p>
          <p class="font-medium">{new Date(userData.user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h2 class="font-bold mb-4">{t('customers.detail.summary')}</h2>
      <div class="space-y-3 text-sm">
        <div>
          <p class="text-gray-500">{t('customers.detail.totalOrders')}</p>
          <p class="text-2xl font-bold mt-1">{userData.totalOrders}</p>
        </div>
        <div>
          <p class="text-gray-500">{t('customers.detail.totalSpent')}</p>
          <p class="text-2xl font-bold mt-1">{formatPrice(userData.totalSpent)}</p>
        </div>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200">
      <h2 class="font-bold">{t('customers.detail.orderHistory')}</h2>
    </div>
    {#if userData.orders.length === 0}
      <div class="p-6 text-sm text-gray-500">{t('customers.detail.noOrders')}</div>
    {:else}
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-6 py-3 font-medium">{t('customers.detail.table.id')}</th>
            <th class="text-left px-6 py-3 font-medium">{t('customers.detail.table.total')}</th>
            <th class="text-left px-6 py-3 font-medium">{t('customers.detail.table.status')}</th>
            <th class="text-left px-6 py-3 font-medium">{t('customers.detail.table.date')}</th>
            <th class="text-right px-6 py-3 font-medium">{t('customers.detail.table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {#each userData.orders as order}
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-6 py-3 font-mono text-xs">{order.id.slice(0, 12)}...</td>
              <td class="px-6 py-3">{formatPrice(order.total)}</td>
              <td class="px-6 py-3 font-medium {statusClass(order.status)}">{statusLabel(order.status)}</td>
              <td class="px-6 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
              <td class="px-6 py-3 text-right">
                <a href="/admin/orders/{order.id}" class="text-blue-600 hover:underline">{t('customers.detail.details')}</a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
{/if}
