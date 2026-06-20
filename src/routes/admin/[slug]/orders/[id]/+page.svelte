<script lang="ts">
  import { onMount } from 'svelte'
  import { getOrder, updateOrderStatus } from '$lib/api/orders'
  import { getShippingStatus, getShippingRates, createShippingLabel, getTracking } from '$lib/api/shipping'
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'

  let id = $derived(page.params.id!)
  let order = $state<any>(null)
  let loading = $state(true)

  let dhlConfigured = $state(false)
  let rates = $state<any[]>([])
  let ratesLoading = $state(false)
  let ratesError = $state('')
  let selectedProduct = $state('')
  let labelLoading = $state(false)
  let trackingData = $state<any>(null)
  let trackingLoading = $state(false)
  let weight = $state(0.5)
  let length = $state(20)
  let width = $state(15)
  let height = $state(10)

  function formatPrice(cents: number) {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }

  function statusLabel(status: string) {
    return t(`orders.statusLabels.${status}`) || status
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

  const nextStatuses: Record<string, { status: string; labelKey: string; class: string }[]> = {
    PENDING: [
      { status: 'PAID', labelKey: 'orders.bulk.pay', class: 'bg-green-600' },
      { status: 'CANCELLED', labelKey: 'orders.bulk.cancel', class: 'bg-red-600' },
    ],
    PAID: [
      { status: 'SHIPPED', labelKey: 'orders.bulk.ship', class: 'bg-blue-600' },
      { status: 'CANCELLED', labelKey: 'orders.bulk.cancel', class: 'bg-red-600' },
    ],
    SHIPPED: [
      { status: 'DELIVERED', labelKey: 'orders.bulk.deliver', class: 'bg-green-700' },
    ],
  }

  onMount(async () => {
    try {
      const [fetchedOrder, status] = await Promise.all([
        getOrder(id),
        getShippingStatus().catch(() => ({ configured: false })),
      ])
      order = fetchedOrder
      dhlConfigured = status.configured
      if (order.shippingWeight) weight = order.shippingWeight
      if (order.shippingLength) length = order.shippingLength
      if (order.shippingWidth) width = order.shippingWidth
      if (order.shippingHeight) height = order.shippingHeight
      if (order.trackingCode) {
        loadTracking(order.trackingCode)
      }
    } catch {
      toast.error(t('orders.detail.notFound'))
    } finally { loading = false }
  })

  async function updateStatus(status: string) {
    try {
      const updated = await updateOrderStatus(id, status)
      order = updated
      toast.success(t('orders.statusUpdated'))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function calculateRates() {
    ratesLoading = true
    ratesError = ''
    rates = []
    try {
      const data = await getShippingRates(id, weight, length, width, height)
      rates = data.products || []
      if (rates.length === 0) ratesError = t('orders.dhl.noProducts')
    } catch (err: any) {
      ratesError = err.message
    } finally { ratesLoading = false }
  }

  async function generateLabel() {
    if (!selectedProduct) {
      toast.error(t('orders.dhl.selectProduct'))
      return
    }
    labelLoading = true
    try {
      const result = await createShippingLabel(id, selectedProduct, weight, length, width, height)
      if (result.error) {
        toast.error(result.error)
      } else {
        order.trackingCode = result.shipmentTrackingNumber
        order.shippingLabelB64 = result.labelB64
        order.shippingProduct = selectedProduct
        toast.success(t('orders.dhl.labelGenerated'))
        loadTracking(result.shipmentTrackingNumber)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally { labelLoading = false }
  }

  async function loadTracking(code: string) {
    trackingLoading = true
    try {
      trackingData = await getTracking(code)
    } catch {
      trackingData = null
    } finally { trackingLoading = false }
  }

  function downloadLabel() {
    if (!order.shippingLabelB64) return
    const byteCharacters = atob(order.shippingLabelB64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i)
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `etiqueta-${order.id.slice(0, 8)}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }
</script>

<h1 class="text-2xl font-bold mb-6">{t('orders.detail.title', { id: id?.slice(0, 8) })}</h1>

{#if loading}
  <div class="space-y-4">
    <div class="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
    <div class="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
  </div>
{:else if !order}
  <p class="text-gray-500">{t('orders.detail.notFound')}</p>
{:else}
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-6">
      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h2 class="font-bold mb-4">{t('orders.detail.items')}</h2>
        {#each order.items || [] as item}
          <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div>
              <p class="font-medium">{item.product?.name || item.productId}</p>
              <p class="text-sm text-gray-500">{t('orders.detail.qty', { quantity: item.quantity, price: formatPrice(item.price) })}</p>
            </div>
            <p class="font-medium">{formatPrice(item.price * item.quantity)}</p>
          </div>
        {/each}
        <div class="flex justify-between pt-4 font-bold">
          <span>{t('orders.detail.total')}</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h2 class="font-bold mb-4">{t('orders.detail.history')}</h2>
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
          <p class="text-sm text-gray-500">{t('orders.detail.noEvents')}</p>
        {/if}
      </div>
    </div>

    <div class="space-y-6">
      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h2 class="font-bold mb-4">{t('orders.detail.status')}</h2>
        <p class="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 {statusBg(order.status)}">{statusLabel(order.status)}</p>
        <div class="space-y-2">
          {#each (nextStatuses[order.status] || []) as action}
            <button
              onclick={() => updateStatus(action.status)}
              class="w-full py-2 px-4 text-white rounded-md text-sm {action.class}"
            >
              {t(action.labelKey)}
            </button>
          {/each}
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h2 class="font-bold mb-4">{t('orders.detail.info')}</h2>
        <div class="space-y-2 text-sm">
          <p class="text-gray-500">{t('orders.detail.date')} {new Date(order.createdAt).toLocaleString()}</p>
          {#if order.user}
            <div class="pt-2 border-t border-gray-100">
              <p class="text-gray-500 mb-1">{t('orders.detail.customer')}</p>
              <p class="font-medium">{order.user.name || order.user.email}</p>
              <p class="text-gray-500 text-xs">{order.user.email}</p>
            </div>
          {/if}
          {#if order.stripePaymentIntentId}
            <div class="pt-2 border-t border-gray-100">
              <p class="text-gray-500">{t('orders.detail.paymentIntent')}</p>
              <p class="font-mono text-xs">{order.stripePaymentIntentId}</p>
            </div>
          {/if}
        </div>
      </div>

      {#if dhlConfigured}
        <div class="bg-white p-6 rounded-lg border border-gray-200">
          <h2 class="font-bold mb-4">
            <span class="text-red-600">DHL</span> {t('orders.dhl.title')}
          </h2>

          {#if order.trackingCode}
            <div class="space-y-3 text-sm">
              <div>
                <p class="text-gray-500 text-xs">{t('orders.dhl.trackingCode')}</p>
                <p class="font-mono text-sm">{order.trackingCode}</p>
              </div>
              {#if order.shippingLabelB64}
                <button
                  onclick={downloadLabel}
                  class="w-full py-2 px-4 bg-blue-600 text-white rounded-md text-sm"
                >
                  {t('orders.dhl.downloadLabel')}
                </button>
              {/if}
              {#if trackingData}
                <div class="pt-2 border-t border-gray-100">
                  <p class="text-gray-500 text-xs mb-1">{t('orders.dhl.status')} {trackingData.status}</p>
                  <div class="space-y-2 max-h-40 overflow-y-auto">
                    {#each trackingData.events as event}
                      <div class="border-l-2 border-gray-200 pl-3 py-1">
                        <p class="text-xs font-medium">{event.description}</p>
                        <p class="text-xs text-gray-400">{event.location} - {new Date(event.timestamp).toLocaleString('pt-BR')}</p>
                      </div>
                    {/each}
                  </div>
                </div>
              {:else if trackingLoading}
                <p class="text-xs text-gray-400">{t('orders.dhl.loading')}</p>
              {/if}
            </div>
          {:else}
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">{t('orders.dhl.weight')}</label>
                  <input type="number" step="0.1" min="0.1" bind:value={weight} class="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">{t('orders.dhl.length')}</label>
                  <input type="number" step="1" min="1" bind:value={length} class="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">{t('orders.dhl.width')}</label>
                  <input type="number" step="1" min="1" bind:value={width} class="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">{t('orders.dhl.height')}</label>
                  <input type="number" step="1" min="1" bind:value={height} class="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                </div>
              </div>

              <button
                onclick={calculateRates}
                disabled={ratesLoading}
                class="w-full py-2 px-4 bg-yellow-500 text-white rounded-md text-sm disabled:opacity-50"
              >
                {ratesLoading ? t('orders.dhl.calculating') : t('orders.dhl.calculate')}
              </button>

              {#if ratesError}
                <p class="text-xs text-red-600">{ratesError}</p>
              {/if}

              {#if rates.length > 0}
                <div class="space-y-2 pt-2 border-t border-gray-100">
                  <p class="text-xs text-gray-500">{t('orders.dhl.availableProducts')}</p>
                  {#each rates as rate}
                    <label class="flex items-center gap-2 p-2 rounded border {selectedProduct === rate.productCode ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'} cursor-pointer">
                      <input type="radio" name="product" value={rate.productCode} bind:group={selectedProduct} />
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium truncate">{rate.productName}</p>
                        <p class="text-xs text-gray-500">
                          {rate.deliveryType} - {formatPrice(Math.round(rate.totalPrice * 100))}
                        </p>
                      </div>
                    </label>
                  {/each}
                  <button
                    onclick={generateLabel}
                    disabled={labelLoading || !selectedProduct}
                    class="w-full py-2 px-4 bg-red-600 text-white rounded-md text-sm disabled:opacity-50"
                  >
                    {labelLoading ? t('orders.dhl.generating') : t('orders.dhl.generate')}
                  </button>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}
