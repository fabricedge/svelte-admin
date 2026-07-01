<script lang="ts">
  import { onMount } from 'svelte'
  import { getSettings, updateSettings, revealSetting } from '$lib/api/settings'
  import { get, post, put } from '$lib/api'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'
  import { getStoreContext } from '$lib/stores/store-context.svelte'

  let settings: Record<string, string> = $state({})
  let loading = $state(true)
  let saving = $state<Record<string, boolean>>({})
  let loaded = $state(new Set<string>())
  let activeSection = $state('general')

  let savedSnapshot = $state<Record<string, string>>({})
  let hasUnsaved = $derived(
    JSON.stringify(
      Object.fromEntries(
        currentSectionKeys().map(k => [k, settings[k] ?? ''])
      )
    ) !== JSON.stringify(
      Object.fromEntries(
        currentSectionKeys().map(k => [k, savedSnapshot[k] ?? ''])
      )
    )
  )

  const ctx = getStoreContext()

  const sections = [
    { id: 'general',  label: () => t('settings.sections.general'),  icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"/>` },
    { id: 'domain',   label: () => t('settings.sections.domain'),   icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/>` },
    { id: 'plan',     label: () => t('settings.sections.plan'),     icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/>` },
    { id: 'checkout', label: () => t('settings.sections.checkout'), icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>` },
    { id: 'payment',  label: () => t('settings.sections.payment'),  icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>` },
    { id: 'shipping', label: () => t('settings.sections.shipping'), icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>` },
    { id: 'branding', label: () => t('settings.sections.branding'), icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"/>` },
  ]

  const generalKeys  = ['store_name','store_email','store_currency','store_locale','store_description','instagram_url','tiktok_url','facebook_url','store_timezone']
  const domainKeys   = ['store_domain']
  const planKeys     = ['store_plan']
  const checkoutKeys = ['payment_method_types']
  const paymentKeys  = ['payment_balance']
  const shippingKeys = ['easyship_api_token','origin_zip','origin_city','origin_state','origin_country']
  const brandingKeys = ['branding_primary_color','branding_secondary_color','branding_logo_url','branding_favicon_url','branding_font_family']

  function currentSectionKeys(): string[] {
    return { general: generalKeys, domain: domainKeys, plan: planKeys, checkout: checkoutKeys, payment: paymentKeys, shipping: shippingKeys, branding: brandingKeys }[activeSection] ?? []
  }

  function load(id: string) {
    if (!loaded.has(id)) loaded = new Set([...loaded, id])
  }

  function snapshotCurrent() {
    const keys = currentSectionKeys()
    const snap: Record<string, string> = {}
    for (const k of keys) snap[k] = settings[k] ?? ''
    savedSnapshot = { ...savedSnapshot, ...snap }
  }

  onMount(async () => {
    try {
      const data = await getSettings()
      settings = data.settings || {}
      savedSnapshot = { ...settings }
      load('general')
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
    } finally {
      loading = false
    }
  })

  const inputVal = (e: Event) => (e.target as HTMLInputElement).value
  const selectVal = (e: Event) => (e.target as HTMLSelectElement).value
  const textareaVal = (e: Event) => (e.target as HTMLTextAreaElement).value

  function getValue(key: string) { return settings[key] ?? '' }
  function setValue(key: string, value: string) { settings = { ...settings, [key]: value } }
  function isSaving(id: string) { return saving[id] ?? false }

  async function handleSubmit(keys: string[], sectionId: string) {
    saving = { ...saving, [sectionId]: true }
    try {
      const payload: Record<string, string> = {}
      for (const key of keys) {
        if (settings[key] !== undefined) payload[key] = settings[key]
      }
      await updateSettings(payload)
      snapshotCurrent()
      toast.success(t('settings.saved'))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      saving = { ...saving, [sectionId]: false }
    }
  }

  async function checkShipping() {
    checkingShipping = true
    shippingCheckResult = null
    try {
      const data = await post('/shipping/check')
      shippingCheckResult = data
      if (data.status) setValue('easyship_status', data.status)
      if (data.message) setValue('easyship_status_msg', data.message)
      setValue('easyship_status_at', new Date().toISOString())
    } catch (err: any) {
      shippingCheckResult = { status: 'error', message: err.message }
    } finally {
      checkingShipping = false
    }
  }

  function formatTimeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'agora'
    if (min < 60) return `${min}min atrás`
    const h = Math.floor(min / 60)
    return `${h}h${min % 60 > 0 ? `${min % 60}min` : ''} atrás`
  }

  function switchTab(id: string) {
    activeSection = id
    load(id)
  }

  let uploading = $state<Record<string, boolean>>({})
  let compressEnabled = $state(false)
  let logoFileInput: HTMLInputElement
  let faviconFileInput: HTMLInputElement

  async function uploadFile(file: File, folder: string, compress?: boolean): Promise<string | null> {
    const form = new FormData()
    form.append('file', file)
    try {
      const token = localStorage.getItem('token')
      const storeId = localStorage.getItem('selectedStoreId')
      const url = `/api/upload?folder=${folder}${compress ? '&compress=true' : ''}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'X-Store-Id': storeId || '' },
        body: form,
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed')
      return (await res.json()).url
    } catch (err: any) {
      toast.error(err.message)
      return null
    }
  }

  async function handleUploadLogo(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input?.files?.[0]
    if (!file) return
    uploading = { ...uploading, logo: true }
    const url = await uploadFile(file, 'branding/logo', compressEnabled)
    if (url) setValue('branding_logo_url', url)
    uploading = { ...uploading, logo: false }
    input.value = ''
  }

  async function handleUploadFavicon(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input?.files?.[0]
    if (!file) return
    uploading = { ...uploading, favicon: true }
    const url = await uploadFile(file, 'branding/favicon', compressEnabled)
    if (url) setValue('branding_favicon_url', url)
    uploading = { ...uploading, favicon: false }
    input.value = ''
  }

  let showApiToken     = $state(false)
  let checkingShipping = $state(false)
  let shippingCheckResult = $state<{ status?: string; message?: string } | null>(null)
  let dnsTab = $state<'cname' | 'ns'>('cname')
  let dnsStatus = $state<{ verified: boolean; ssl: boolean; configured: boolean; message: string } | null>(null)
  let checkingDns = $state(false)
  let copied = $state<string | null>(null)

  function maskToken(token: string): string {
    if (!token || token === '__SET__') return '••••••••••'
    if (token.length <= 8) return token.slice(0, 4) + '...'
    const prefix = token.startsWith('sand_') || token.startsWith('prod_') ? token.slice(0, 5) : token.slice(0, 8)
    return prefix + '...'
  }

  let shippingConfigured = $derived(!!settings['easyship_api_token'])

  function brandingVal(key: string, fallback: string): string {
    return settings[`branding_${key}`] || fallback
  }

  async function revealKey(key: string) {
    const password = window.prompt('Digite sua senha para revelar o valor:')
    if (!password) return
    try {
      const result = await revealSetting(key, password)
      setValue(key, result.value)
    } catch (err: any) {
      toast.error(err.message || 'Senha incorreta')
    }
  }

  const cnameTarget = 'cname.vercel-dns.com'

  async function checkDns() {
    const domain = settings['store_domain'] || ctx.currentStore?.slug + '.fskk.site'
    if (!domain) { toast.error('Salve um domínio primeiro'); return }
    checkingDns = true
    dnsStatus = null
    try {
      const token = localStorage.getItem('token')
      const storeId = localStorage.getItem('selectedStoreId')
      const res = await fetch(`/api/stores/check-domain?domain=${encodeURIComponent(domain)}`, {
        headers: { Authorization: `Bearer ${token}`, 'X-Store-Id': storeId || '' },
      })
      dnsStatus = await res.json()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      checkingDns = false
    }
  }

  async function copyVal(val: string, label: string) {
    try {
      await navigator.clipboard.writeText(val)
      copied = label
      setTimeout(() => copied = null, 2000)
    } catch { prompt('Copie manualmente:', val) }
  }

  // ─── Plan ───
  let planUsage = $state<{ plan: string; storeCount: number; limit: number | null } | null>(null)
  let loadingPlan = $state(true)

  onMount(async () => {
    try {
      planUsage = await get('/stores/my-usage')
    } catch {} finally { loadingPlan = false }
  })

  function planLabel(p: string): string {
    if (p === 'FREE') return 'Free'
    if (p === 'MONTHLY') return 'Monthly (R$ 29/mês)'
    if (p === 'CUSTOM') return 'Custom'
    return p
  }

  // ─── Checkout ───
  let checkoutPaymentMethods = $state<string[]>([])
  let loadingCheckout = $state(true)

  $effect(() => {
    const stored = settings['payment_method_types']
    if (stored) checkoutPaymentMethods = JSON.parse(stored)
    loadingCheckout = false
  })

  function togglePaymentMethod(method: string) {
    const set = new Set(checkoutPaymentMethods)
    if (set.has(method)) set.delete(method)
    else set.add(method)
    checkoutPaymentMethods = [...set]
  }

  async function saveCheckout() {
    saving = { ...saving, checkout: true }
    try {
      await updateSettings({ payment_method_types: JSON.stringify(checkoutPaymentMethods) })
      toast.success(t('settings.saved'))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      saving = { ...saving, checkout: false }
    }
  }

  // ─── Payment gateway ───
  let balance = $state(0)
  let transactions = $state<any[]>([])
  let payouts = $state<any[]>([])
  let pixKey = $state<{ pixKey: string; pixKeyType: string; holderName: string; holderDocument: string } | null>(null)
  let pixForm = $state({ pixKey: '', pixKeyType: 'EMAIL', holderName: '', holderDocument: '' })
  let loadingPayment = $state(false)
  let paymentDataLoaded = $state(false)
  let savingPix = $state(false)
  let requestingPayout = $state(false)
  let showPixForm = $state(false)

  async function loadPaymentData() {
    loadingPayment = true
    try {
      const [balData, txData, payoutData, pixData] = await Promise.all([
        get('/payments/balance'),
        get('/payments/transactions'),
        get('/payments/payouts'),
        get('/payments/pix-key'),
      ])
      if (balData) balance = balData.balance
      if (txData) transactions = txData
      if (payoutData) payouts = payoutData
      if (pixData) pixKey = pixData
      paymentDataLoaded = true
    } catch {} finally { loadingPayment = false }
  }

  async function savePix() {
    if (!pixForm.pixKey || !pixForm.pixKeyType || !pixForm.holderName || !pixForm.holderDocument) {
      toast.error('Preencha todos os campos')
      return
    }
    savingPix = true
    try {
      pixKey = await put('/payments/pix-key', pixForm)
      showPixForm = false
      toast.success('Chave PIX salva')
    } catch (err: any) {
      toast.error(err.message)
    } finally { savingPix = false }
  }

  async function requestPayout() {
    if (!confirm(`Solicitar saque de R$ ${(balance / 100).toFixed(2)}?`)) return
    requestingPayout = true
    try {
      await post('/payments/request-payout')
      toast.success('Saque solicitado!')
      await loadPaymentData()
    } catch (err: any) {
      toast.error(err.message)
    } finally { requestingPayout = false }
  }

  function fmtCents(cents: number): string {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function payoutStatusLabel(s: string): string {
    if (s === 'COMPLETED') return 'Concluído'
    if (s === 'PENDING') return 'Pendente'
    if (s === 'FAILED') return 'Falhou'
    return s
  }

  function payoutStatusClass(s: string): string {
    if (s === 'COMPLETED') return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20'
    if (s === 'PENDING') return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20'
    return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
  }

  // Load payment data when tab becomes active
  $effect(() => {
    if (activeSection === 'payment' && !loadingPayment && !paymentDataLoaded) {
      loadPaymentData()
    }
  })
</script>

<!-- Page header -->
<div class="mb-8">
  <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">{t('settings.title') || 'Configurações'}</h1>
  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('settings.subtitle') || 'Gerencie as preferências da sua loja.'}</p>
</div>

<div class="flex gap-8">

  <!-- ──────────────────── SIDEBAR NAV -->
      <aside class="hidden md:block w-52 shrink-0">
        <nav class="sticky top-8 space-y-0.5">
          {#each sections as s}
            {@const isActive = activeSection === s.id}
            <button
              onclick={() => switchTab(s.id)}
              class="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                {isActive
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800/60 hover:text-gray-700 dark:hover:text-gray-200'}"
            >
              <svg
                class="h-4 w-4 shrink-0 transition-colors {isActive ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500'}"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                {#if s.id === 'general'}<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"/>{:else if s.id === 'domain'}<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/>{:else if s.id === 'plan'}<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/>{:else if s.id === 'checkout'}<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>{:else if s.id === 'payment'}<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>{:else if s.id === 'shipping'}<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>{:else if s.id === 'branding'}<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"/>{/if}
              </svg>
              <span class="truncate">{s.label()}</span>

              {#if s.id === 'shipping'}
                <span class="ml-auto h-1.5 w-1.5 rounded-full shrink-0 {shippingConfigured ? 'bg-emerald-500' : 'bg-amber-400'}"></span>
              {/if}
            </button>
          {/each}
        </nav>
      </aside>

      <!-- ──────────────────── MOBILE TAB BAR -->
      <div class="md:hidden -mx-4 mb-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <div class="flex min-w-max px-4">
          {#each sections as s}
            <button
              onclick={() => switchTab(s.id)}
              class="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                {activeSection === s.id
                  ? 'border-gray-900 dark:border-gray-50 text-gray-900 dark:text-gray-50'
                  : 'border-transparent text-gray-500 dark:text-gray-400'}"
            >
              {s.label()}
            </button>
          {/each}
        </div>
      </div>

      <!-- ──────────────────── CONTENT AREA -->
      <main class="flex-1 min-w-0">

        {#if loading}
          <div class="space-y-4">
            {#each [1,2,3] as _}
              <div class="h-40 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse"></div>
            {/each}
          </div>

        {:else if activeSection === 'general'}
          <div class="space-y-6">
            <!-- Card: loja -->
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              <div class="px-6 py-4">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{t('settings.sections.general')}</h2>
              </div>
              <div class="px-6 py-5 space-y-5">
                <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fieldLabels.store_name')}</label>
<input type="text" value={getValue('store_name')} oninput={(e) => setValue('store_name', inputVal(e))} class={inputCls} />
  </div>
                <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fieldLabels.store_email')}</label>
<input type="email" value={getValue('store_email')} oninput={(e) => setValue('store_email', inputVal(e))} class={inputCls} />
  </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fieldLabels.store_currency')}</label>
<select value={getValue('store_currency')} onchange={(e) => setValue('store_currency', selectVal(e))} class={inputCls}>
                      <option value="" disabled>{t('common.select')}</option>
                      <option value="BRL">BRL (R$)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="ARS">ARS ($)</option>
                      <option value="MXN">MXN ($)</option>
                    </select>
  </div>
                  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fieldLabels.store_locale')}</label>
<select value={getValue('store_locale')} onchange={(e) => setValue('store_locale', selectVal(e))} class={inputCls}>
                      <option value="" disabled>{t('common.select')}</option>
                      <option value="pt">Português</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
  </div>
                </div>
                <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fieldLabels.store_timezone')}</label>
<select value={getValue('store_timezone')} onchange={(e) => setValue('store_timezone', selectVal(e))} class={inputCls}>
                    <option value="" disabled>{t('common.select')}</option>
                    <option value="America/Sao_Paulo">America/Sao_Paulo (UTC-3)</option>
                    <option value="America/New_York">America/New_York (UTC-5)</option>
                    <option value="America/Chicago">America/Chicago (UTC-6)</option>
                    <option value="America/Denver">America/Denver (UTC-7)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                    <option value="America/Mexico_City">America/Mexico_City (UTC-6)</option>
                    <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires (UTC-3)</option>
                    <option value="America/Santiago">America/Santiago (UTC-4)</option>
                    <option value="America/Bogota">America/Bogota (UTC-5)</option>
                    <option value="America/Lima">America/Lima (UTC-5)</option>
                  </select>
  </div>
                <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fieldLabels.store_description')}</label>
<textarea value={getValue('store_description')} oninput={(e) => setValue('store_description', textareaVal(e))} rows="3" class={inputCls}></textarea>
  </div>
              </div>
            </div>

            <!-- Card: redes sociais -->
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              <div class="px-6 py-4">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{t('common.social')}</h2>
              </div>
              <div class="px-6 py-5 space-y-5">
                <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fieldLabels.instagram_url')}</label>
<div class="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 dark:focus-within:ring-gray-400 focus-within:border-transparent">
                    <span class="inline-flex items-center px-3 bg-gray-50 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 text-gray-400 text-xs font-medium">instagram.com/</span>
                    <input type="text" value={getValue('instagram_url').replace('https://instagram.com/', '')} oninput={(e) => setValue('instagram_url', 'https://instagram.com/' + inputVal(e))} class="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none" placeholder="sua_loja" />
                  </div>
  </div>
                <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fieldLabels.tiktok_url')}</label>
<div class="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 dark:focus-within:ring-gray-400 focus-within:border-transparent">
                    <span class="inline-flex items-center px-3 bg-gray-50 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 text-gray-400 text-xs font-medium">tiktok.com/@</span>
                    <input type="text" value={getValue('tiktok_url').replace('https://tiktok.com/@', '')} oninput={(e) => setValue('tiktok_url', 'https://tiktok.com/@' + inputVal(e))} class="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none" placeholder="sua_loja" />
                  </div>
  </div>
                <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fieldLabels.facebook_url')}</label>
<div class="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 dark:focus-within:ring-gray-400 focus-within:border-transparent">
                    <span class="inline-flex items-center px-3 bg-gray-50 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 text-gray-400 text-xs font-medium">facebook.com/</span>
                    <input type="text" value={getValue('facebook_url').replace('https://facebook.com/', '')} oninput={(e) => setValue('facebook_url', 'https://facebook.com/' + inputVal(e))} class="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none" placeholder="sua_loja" />
                  </div>
  </div>
              </div>
            </div>

            <div class="flex justify-end pt-2">
        <button
          onclick={() => handleSubmit(generalKeys, 'general')}
          disabled={isSaving('general')}
          class={btnPrimary}
        >
          {isSaving('general') ? t('common.saving') : t('common.save')}
        </button>
      </div>
          </div>

        {:else if activeSection === 'domain'}
          <div class="space-y-6">
            <!-- Deployment status -->
            {#if ctx.currentStore?.deploymentStatus}
              {@const st = ctx.currentStore.deploymentStatus}
              <div class="flex items-center gap-3 px-5 py-4 rounded-xl border {st === 'READY' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : st === 'FAILED' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}">
                <span class="h-2.5 w-2.5 rounded-full shrink-0 {st === 'READY' ? 'bg-emerald-500' : st === 'FAILED' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'}"></span>
                <div>
                  <p class="text-sm font-medium {st === 'READY' ? 'text-emerald-800 dark:text-emerald-200' : st === 'FAILED' ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}">
                    {st === 'READY' ? t('storeRequests.deployReady') : st === 'FAILED' ? t('storeRequests.deployFailed') : t('storeRequests.deployDeploying')}
                  </p>
                  {#if ctx.currentStore?.deploymentUrl}
                    <a href={ctx.currentStore.deploymentUrl} target="_blank" class="text-xs text-gray-500 hover:underline break-all">{ctx.currentStore.deploymentUrl}</a>
                  {/if}
                </div>
              </div>
            {/if}

            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              <div class="px-6 py-4">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{t('settings.sections.domain')}</h2>
              </div>

              <!-- URL + Domain input -->
              <div class="px-6 py-5 space-y-5">
                <div>
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('storeRequests.deploymentUrl')}</p>
                  <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <svg class="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                    <code class="text-sm text-gray-700 dark:text-gray-300 font-mono">{ctx.currentStore?.slug || 'loja'}.fskk.site</code>
                    <button onclick={() => copyVal(`https://${ctx.currentStore?.slug || 'loja'}.fskk.site`, 'url')}
                      class="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0">
                      {#if copied === 'url'}
                        <span class="text-xs text-emerald-600">{t('storeRequests.copied')}</span>
                      {:else}
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      {/if}
                    </button>
                  </div>
                </div>

                <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fieldLabels.store_domain')}</label>
<input type="text" value={getValue('store_domain')} oninput={(e) => setValue('store_domain', inputVal(e))} placeholder="loja.meusite.com" class={inputCls} />
    {#if ctx.currentStore?.name}
      <p class="mt-1 text-xs text-gray-400">{t('settings.fieldLabels.domainForStore', { name: ctx.currentStore.name })}</p>
    {/if}
  </div>
              </div>

              <!-- DNS configuration -->
              <div class="px-6 py-5">
                <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">DNS</p>

                <!-- Tab switcher -->
                <div class="flex gap-1 mb-5 p-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 w-fit">
                  <button onclick={() => dnsTab = 'cname'}
                    class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors {dnsTab === 'cname' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}">
                    {t('storeRequests.dns.tabCname')}
                  </button>
                  <button onclick={() => dnsTab = 'ns'}
                    class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors {dnsTab === 'ns' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}">
                    {t('storeRequests.dns.tabNs')}
                  </button>
                </div>

                <!-- Steps -->
                <div class="space-y-4">
                  <!-- Step 1 -->
                  <div class="flex gap-3">
                    <span class="flex items-center justify-center h-6 w-6 rounded-full bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 text-xs font-bold shrink-0 mt-0.5">1</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{t('storeRequests.dns.step1')}</p>
                      {#if dnsTab === 'cname'}
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('storeRequests.dns.step1CnameDesc')}</p>
                        <div class="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <code class="text-xs font-mono text-gray-700 dark:text-gray-300 flex-1 min-w-0 break-all">
                            {getValue('store_domain') || 'seudominio.com'} → {cnameTarget}
                          </code>
                          <button onclick={() => copyVal(cnameTarget, 'cname')}
                            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0">
                            {#if copied === 'cname'}
                              <span class="text-xs text-emerald-600">{t('storeRequests.copied')}</span>
                            {:else}
                              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                            {/if}
                          </button>
                        </div>
                      {:else}
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('storeRequests.dns.step1NsDesc')}</p>
                        <div class="mt-2 space-y-1">
                          {#each (t('storeRequests.dnsNsValue') || '').split('\n') as ns}
                            <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                              <code class="text-xs font-mono text-gray-700 dark:text-gray-300 flex-1">{ns}</code>
                              <button onclick={() => copyVal(ns, 'ns')}
                                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0">
                                {#if copied === 'ns'}
                                  <span class="text-xs text-emerald-600">{t('storeRequests.copied')}</span>
                                {:else}
                                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                {/if}
                              </button>
                            </div>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>

                  <!-- Divider -->
                  <div class="border-l-2 border-gray-200 dark:border-gray-700 ml-3 h-4"></div>

                  <!-- Step 2 -->
                  <div class="flex gap-3">
                    <span class="flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-bold shrink-0 mt-0.5">2</span>
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{t('storeRequests.dns.step2')}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('storeRequests.dns.step2Desc')}</p>
                    </div>
                  </div>

                  <!-- Divider -->
                  <div class="border-l-2 border-gray-200 dark:border-gray-700 ml-3 h-4"></div>

                  <!-- Step 3 -->
                  <div class="flex gap-3">
                    <span class="flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold shrink-0 mt-0.5">3</span>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{t('storeRequests.dns.step3')}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('storeRequests.dns.step3Desc')}</p>

                      <!-- DNS status -->
                      {#if dnsStatus}
                        <div class="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg {dnsStatus.verified ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}">
                          <span class="h-2 w-2 rounded-full shrink-0 {dnsStatus.verified ? 'bg-emerald-500' : 'bg-amber-400'}"></span>
                          <div class="flex-1 min-w-0">
                            <p class="text-xs font-medium {dnsStatus.verified ? 'text-emerald-800 dark:text-emerald-200' : 'text-amber-800 dark:text-amber-200'}">
                              {dnsStatus.verified ? t('storeRequests.dns.verified') : (dnsStatus.message || t('storeRequests.dns.pending'))}
                            </p>
                            {#if dnsStatus.ssl}
                              <p class="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">🔒 {t('storeRequests.dns.sslActive')}</p>
                            {/if}
                          </div>
                        </div>
                      {/if}

                      <button onclick={checkDns} disabled={checkingDns}
                        class="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                        {#if checkingDns}
                          <svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        {/if}
                        {checkingDns ? t('storeRequests.dns.verifying') : t('storeRequests.dns.verify')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="px-6 py-4 flex items-center justify-between">
                <a href={`/admin/${ctx.currentStore?.slug || 'loja'}/custom-storefront`} class="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  {t('customStorefront.title')}
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </a>
                <button
        onclick={() => handleSubmit(domainKeys, 'domain')}
        disabled={isSaving('domain')}
        class={btnPrimary}
      >
        {isSaving('domain') ? t('common.saving') : t('common.save')}
      </button>
              </div>
            </div>
          </div>

        {:else if activeSection === 'plan'}
          <div class="space-y-6">
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              <div class="px-6 py-4">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{t('settings.sections.plan')}</h2>
              </div>
              <div class="px-6 py-5">
                {#if loadingPlan}
                  <div class="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                {:else if planUsage}
                  <div class="flex items-center justify-between mb-5">
                    <div>
                      <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{planLabel(planUsage.plan)}</p>
                      <p class="text-sm text-gray-500 dark:text-gray-400">{planUsage.storeCount} de {planUsage.limit ?? '∞'} {t('storeRequests.storeLabel', { count: planUsage.limit ?? 0 })}</p>
                    </div>
                    {#if planUsage.plan !== 'CUSTOM'}
                      <a href={`/admin/${ctx.currentStore?.slug || 'loja'}/custom-storefront`} class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors">
                        {t('billing.upgradeLabel') || 'Fazer upgrade'}
                      </a>
                    {/if}
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div class="bg-gray-900 dark:bg-gray-50 h-2 rounded-full transition-all" style="width: {planUsage.limit ? Math.min((planUsage.storeCount / planUsage.limit) * 100, 100) : 0}%"></div>
                  </div>
                {/if}
              </div>
            </div>
          </div>

        {:else if activeSection === 'checkout'}
          <div class="space-y-6">
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              <div class="px-6 py-4">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{t('settings.sections.checkout')}</h2>
              </div>
              <div class="px-6 py-5 space-y-5">
                <div>
                  <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('settings.payments.paymentMethods')}</p>
                  <div class="space-y-2">
                    <label class="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer opacity-60">
                      <input type="checkbox" checked disabled class="h-4 w-4 rounded border-gray-300 text-gray-900">
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{t('settings.payments.creditCard')}</p>
                        <p class="text-xs text-gray-500">{t('settings.payments.alwaysActive')}</p>
                      </div>
                    </label>
                    <label class="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                      <input type="checkbox" checked={checkoutPaymentMethods.includes('boleto')} onchange={() => togglePaymentMethod('boleto')} class="h-4 w-4 rounded border-gray-300 text-gray-900">
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Boleto</p>
                        <p class="text-xs text-gray-500">{t('settings.payments.boletoDesc')}</p>
                      </div>
                    </label>
                    <label class="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                      <input type="checkbox" checked={checkoutPaymentMethods.includes('pix')} onchange={() => togglePaymentMethod('pix')} class="h-4 w-4 rounded border-gray-300 text-gray-900">
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">PIX</p>
                        <p class="text-xs text-gray-500">{t('settings.payments.pixDesc')}</p>
                        <p class="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Em breve: configurar chave PIX para recebimentos</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              <div class="px-6 py-4 flex justify-end">
                <button onclick={saveCheckout} disabled={isSaving('checkout')} class={btnPrimary}>
                  {isSaving('checkout') ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>
          </div>

        {:else if activeSection === 'payment'}
          <div class="space-y-6">
            {#if loadingPayment}
              <div class="h-40 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse"></div>
            {:else}
              <!-- Balance card -->
              <div class="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-700 px-6 py-5">
                <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">{t('settings.payment.sectionTitle') || 'Saldo'}</p>
                <p class="text-3xl font-bold text-white mt-1">{fmtCents(balance)}</p>
                <div class="mt-4 flex gap-3">
                  {#if pixKey}
                    <button onclick={requestPayout} disabled={requestingPayout || balance < 100}
                      class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-50 transition-colors">
                      {requestingPayout ? t('common.loading') : 'Solicitar Saque'}
                    </button>
                  {/if}
                  <button onclick={() => { showPixForm = !showPixForm; if (!pixKey && !showPixForm) { pixForm = { pixKey: '', pixKeyType: 'EMAIL', holderName: '', holderDocument: '' }; showPixForm = true } }}
                    class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-500 text-gray-300 hover:bg-gray-700 transition-colors">
                    {pixKey ? 'Editar Chave PIX' : 'Cadastrar Chave PIX'}
                  </button>
                </div>
              </div>

              <!-- PIX form -->
              {#if showPixForm}
                <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                  <div class="px-6 py-4">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Chave PIX</h3>
                  </div>
                  <div class="px-6 py-5 space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de Chave</label>
                      <select bind:value={pixForm.pixKeyType} class={inputCls}>
                        <option value="CPF">CPF</option>
                        <option value="CNPJ">CNPJ</option>
                        <option value="EMAIL">Email</option>
                        <option value="PHONE">Telefone</option>
                        <option value="RANDOM">Chave aleatória</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chave</label>
                      <input type="text" bind:value={pixForm.pixKey} placeholder="admin@exemplo.com" class={inputCls} />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Titular</label>
                      <input type="text" bind:value={pixForm.holderName} placeholder="João Silva" class={inputCls} />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">CPF / CNPJ</label>
                      <input type="text" bind:value={pixForm.holderDocument} placeholder="123.456.789-00" class={inputCls} />
                    </div>
                    <div class="flex justify-end gap-2">
                      <button onclick={() => showPixForm = false} class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancelar</button>
                      <button onclick={savePix} disabled={savingPix} class={btnPrimary}>
                        {savingPix ? t('common.saving') : 'Salvar'}
                      </button>
                    </div>
                  </div>
                </div>
              {/if}

              <!-- Payouts -->
              {#if payouts.length > 0}
                <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                  <div class="px-6 py-4">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{t('settings.payment.sectionTitle') || 'Saques'}</h3>
                  </div>
                  <div class="px-6 py-3">
                    {#each payouts as p}
                      <div class="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div>
                          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{fmtCents(p.amount)}</p>
                          <p class="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <span class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full {payoutStatusClass(p.status)}">{payoutStatusLabel(p.status)}</span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Transactions -->
              {#if transactions.length > 0}
                <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                  <div class="px-6 py-4">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{t('settings.payment.sectionTitle') || 'Extrato'}</h3>
                  </div>
                  <div class="px-6 py-3">
                    {#each transactions as tx}
                      <div class="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{tx.description}</p>
                          <p class="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div class="text-right ml-4">
                          <p class="text-sm font-semibold {tx.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">
                            {tx.amount >= 0 ? '+' : ''}{fmtCents(tx.amount)}
                          </p>
                          <p class="text-xs text-gray-400">{fmtCents(tx.balanceAfter)}</p>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {:else}
                <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-10 text-center">
                  <p class="text-sm text-gray-500">Nenhuma transação ainda. As vendas aparecerão aqui após o primeiro pedido pago.</p>
                </div>
              {/if}
            {/if}
          </div>

        {:else if activeSection === 'shipping'}
          <div class="space-y-6">
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              <div class="px-6 py-4 flex items-center justify-between">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{t('settings.sections.shipping')}</h2>
                <span class="inline-flex items-center gap-1.5 text-xs font-medium {shippingConfigured ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}">
                  <span class="h-1.5 w-1.5 rounded-full {shippingConfigured ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}"></span>
                  {shippingConfigured ? 'Configurado' : 'Não configurado'}
                </span>
              </div>

              <div class="px-6 py-5 space-y-5">
                <p class="text-sm text-gray-500 dark:text-gray-400">{t('settings.shipping.description')}</p>

                {#if getValue('origin_country') === 'US'}
                  <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-start gap-3">
                    <span class="text-xl shrink-0">🇺🇸</span>
                    <div>
                      <p class="text-sm font-medium text-green-800 dark:text-green-200">EasyShip ativo — rotas domésticas US</p>
                      <p class="text-xs text-green-700 dark:text-green-300 mt-0.5">Esta loja atende o público americano. O EasyShip está configurado exclusivamente para entregas dentro dos Estados Unidos.</p>
                    </div>
                  </div>
                {/if}
                {#if getValue('origin_country') && getValue('origin_country') !== 'US'}
                  <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md flex items-start gap-3">
                    <span class="text-xl shrink-0">🌎</span>
                    <div>
                      <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">EasyShip indisponível para {getValue('origin_country')}</p>
                      <p class="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">O EasyShip atualmente só suporta rotas domésticas nos Estados Unidos. Altere o país de origem para US se quiser usar o EasyShip.</p>
                    </div>
                  </div>
                {/if}

                <!-- API token -->
                <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fieldLabels.easyship_api_token')}</label>
<div class="relative">
                    <input
                      type={showApiToken ? 'text' : 'password'}
                      value={showApiToken ? getValue('easyship_api_token') : maskToken(getValue('easyship_api_token'))}
                      oninput={(e) => setValue('easyship_api_token', inputVal(e))}
                      placeholder="sand_... ou prod_..."
                      class="{inputCls} pr-10"
                    />
                    <button
                      onclick={async () => {
                        if (!showApiToken && getValue('easyship_api_token') === '__SET__') {
                          await revealKey('easyship_api_token')
                        }
                        showApiToken = !showApiToken
                      }}
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {#if showApiToken}
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
    {:else}
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
    {/if}
                    </button>
                  </div>
    {#if t('settings.shipping.apiTokenHint')}
                      <p class="mt-1 text-xs text-gray-400">{t('settings.shipping.apiTokenHint')}</p>
                    {/if}
  </div>

                <!-- Connection status -->
                <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('settings.shipping.connectionStatus')}</p>
                  <div class="flex items-center gap-2">
                    {#if shippingCheckResult || settings['easyship_status']}
                      {@const st = shippingCheckResult?.status || settings['easyship_status']}
                      {@const msg = shippingCheckResult?.message || settings['easyship_status_msg'] || ''}
                      <span class="h-2 w-2 rounded-full {st === 'ok' ? 'bg-emerald-500' : st === 'usage_limit' ? 'bg-amber-500' : 'bg-red-400'}"></span>
                      <span class="text-sm text-gray-700 dark:text-gray-300">{msg}</span>
                    {:else}
                      <span class="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                      <span class="text-sm text-gray-400">{t('settings.shipping.notTested')}</span>
                    {/if}
                  </div>
                  {#if settings['easyship_status_at']}
                    <p class="text-xs text-gray-400">{t('settings.shipping.lastCheck')}: {formatTimeAgo(settings['easyship_status_at'])}</p>
                  {/if}
                  <button onclick={checkShipping} disabled={checkingShipping} class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                    {#if checkingShipping}
                      <svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    {/if}
                    {checkingShipping ? t('settings.shipping.checking') : t('settings.shipping.checkButton')}
                  </button>
                </div>

              </div>

              <!-- Origin address -->
              <div class="px-6 py-5 space-y-5">
                <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('settings.shipping.originAddress')}</p>
                <div class="grid grid-cols-2 gap-4">
                  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fieldLabels.origin_zip')}</label>
<input type="text" value={getValue('origin_zip')} oninput={(e) => setValue('origin_zip', inputVal(e))} placeholder="01001000" class={inputCls} />
  </div>
                  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fieldLabels.origin_state')}</label>
<input type="text" value={getValue('origin_state')} oninput={(e) => setValue('origin_state', inputVal(e))} placeholder="SP" class={inputCls} />
  </div>
                </div>
                <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fieldLabels.origin_city')}</label>
<input type="text" value={getValue('origin_city')} oninput={(e) => setValue('origin_city', inputVal(e))} placeholder="São Paulo" class={inputCls} />
  </div>
                <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.fieldLabels.origin_country')}</label>
<select value={getValue('origin_country')} onchange={(e) => setValue('origin_country', selectVal(e))} class={inputCls}>
                    <option value="" disabled>{t('common.select')}</option>
                    <option value="BR">Brasil (BR)</option>
                    <option value="US">Estados Unidos (US)</option>
                    <option value="AR">Argentina (AR)</option>
                    <option value="MX">México (MX)</option>
                    <option value="CL">Chile (CL)</option>
                    <option value="CO">Colômbia (CO)</option>
                    <option value="PE">Peru (PE)</option>
                    <option value="ES">Espanha (ES)</option>
                    <option value="PT">Portugal (PT)</option>
                  </select>
  </div>
              </div>

              <div class="px-6 py-4 flex justify-end">
                <button
        onclick={() => handleSubmit(shippingKeys, 'shipping')}
        disabled={isSaving('shipping')}
        class={btnPrimary}
      >
        {isSaving('shipping') ? t('common.saving') : t('common.save')}
      </button>
              </div>
            </div>
          </div>

        {:else if activeSection === 'branding'}
          <div class="space-y-6">
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              <div class="px-6 py-4">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{t('settings.sections.branding')}</h2>
              </div>

              <div class="px-6 py-5">
                <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                  <!-- Controls -->
                  <div class="space-y-6">
                    <!-- Colors -->
                    <div class="space-y-4">
                      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cores</p>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.branding.primaryColor')}</label>
<div class="flex gap-2 items-center">
                            <input type="color" value={brandingVal('primary_color', '#18181b')} oninput={(e) => setValue('branding_primary_color', inputVal(e))} class="h-9 w-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5 bg-white dark:bg-gray-800" />
                            <input type="text" value={brandingVal('primary_color', '#18181b')} oninput={(e) => setValue('branding_primary_color', inputVal(e))} placeholder="#18181b" class="{inputCls} font-mono text-xs flex-1" />
                          </div>
  </div>
                        <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.branding.secondaryColor')}</label>
<div class="flex gap-2 items-center">
                            <input type="color" value={brandingVal('secondary_color', '#f4f4f5')} oninput={(e) => setValue('branding_secondary_color', inputVal(e))} class="h-9 w-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5 bg-white dark:bg-gray-800" />
                            <input type="text" value={brandingVal('secondary_color', '#f4f4f5')} oninput={(e) => setValue('branding_secondary_color', inputVal(e))} placeholder="#f4f4f5" class="{inputCls} font-mono text-xs flex-1" />
                          </div>
  </div>
                      </div>
                    </div>

                    <!-- Logo + Favicon -->
                    <div class="space-y-4">
                      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Imagens</p>
                      <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                        <input type="checkbox" bind:checked={compressEnabled} class="rounded border-gray-300 dark:border-gray-600" />
                        {t('common.imageCompression')}
                      </label>

                      <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.branding.logo')}</label>
<input type="file" accept="image/jpeg,image/png,image/webp" onchange={handleUploadLogo} bind:this={logoFileInput} class="hidden" />
                        <div class="flex gap-2">
                          <button onclick={() => logoFileInput.click()} disabled={uploading.logo} class="{btnSecondary} shrink-0">
                            {uploading.logo ? t('common.uploading') : t('common.upload')}
                          </button>
                          <input type="url" value={brandingVal('logo_url', '')} oninput={(e) => setValue('branding_logo_url', inputVal(e))} placeholder="https://..." class="{inputCls} flex-1 min-w-0" />
                        </div>
                        {#if brandingVal('logo_url', '')}
                          <div class="mt-2 inline-block p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <img src={brandingVal('logo_url', '')} alt="Logo" onerror={(e) => (e.target as HTMLImageElement).style.display='none'} class="max-h-16 max-w-40 object-contain" />
                          </div>
                        {/if}
  </div>

                      <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.branding.favicon')}</label>
<input type="file" accept="image/jpeg,image/png,image/webp" onchange={handleUploadFavicon} bind:this={faviconFileInput} class="hidden" />
                        <div class="flex gap-2">
                          <button onclick={() => faviconFileInput.click()} disabled={uploading.favicon} class="{btnSecondary} shrink-0">
                            {uploading.favicon ? t('common.uploading') : t('common.upload')}
                          </button>
                          <input type="url" value={brandingVal('favicon_url', '')} oninput={(e) => setValue('branding_favicon_url', inputVal(e))} placeholder="https://..." class="{inputCls} flex-1 min-w-0" />
                        </div>
                        {#if brandingVal('favicon_url', '')}
                          <div class="mt-2 inline-block p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <img src={brandingVal('favicon_url', '')} alt="Favicon" onerror={(e) => (e.target as HTMLImageElement).style.display='none'} class="h-8 w-8 object-contain" />
                          </div>
                        {/if}
  </div>
                    </div>

                    <!-- Font -->
                    <div class="space-y-4">
                      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipografia</p>
                      <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.branding.font')}</label>
<input type="text" value={brandingVal('font_family', '')} oninput={(e) => setValue('branding_font_family', inputVal(e))} placeholder="Inter, sans-serif" class={inputCls} />
                        {#if settings['branding_font_family']}
                          <p class="mt-2 px-3 py-2.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" style="font-family: {settings['branding_font_family']}">
                            The quick brown fox jumps over the lazy dog — 1234567890
                          </p>
                        {/if}
  </div>
                    </div>
                  </div>

                  <!-- Live preview -->
                  <div class="lg:sticky lg:top-8 self-start">
                    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('settings.branding.preview')}</p>
                    <div class="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm" style="font-family: {settings['branding_font_family'] || 'Inter, sans-serif'}">
                      <!-- Store nav -->
                      <div class="flex items-center justify-between px-4 py-3" style="background-color: {settings['branding_primary_color'] || '#18181b'}">
                        <div>
                          {#if settings['branding_logo_url']}
                            <img src={settings['branding_logo_url']} alt="Logo" class="h-6 object-contain" onerror={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
                          {:else}
                            <span class="text-base font-bold text-white">LOGO</span>
                          {/if}
                        </div>
                        <div class="flex gap-3">
                          <svg class="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                          <svg class="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
                        </div>
                      </div>
                      <!-- Product card -->
                      <div class="p-4 bg-white dark:bg-gray-900 space-y-3">
                        <div class="aspect-[4/3] rounded-lg" style="background-color: {settings['branding_secondary_color'] || '#f4f4f5'}"></div>
                        <p class="text-xs font-medium text-gray-900 dark:text-gray-100">{t('settings.branding.previewHeading')}</p>
                        <p class="text-xs text-gray-400 leading-relaxed">{t('settings.branding.previewText')}</p>
                        <button class="w-full py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90" style="background-color: {settings['branding_primary_color'] || '#18181b'}">
                          {t('settings.branding.previewButton')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="px-6 py-4 flex justify-end">
                <button
        onclick={() => handleSubmit(brandingKeys, 'branding')}
        disabled={isSaving('branding')}
        class={btnPrimary}
      >
        {isSaving('branding') ? t('common.saving') : t('common.save')}
      </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Unsaved changes floating bar -->
        {#if hasUnsaved && !loading}
          <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3 rounded-xl bg-gray-900 dark:bg-gray-50 shadow-xl ring-1 ring-black/10 dark:ring-white/10">
            <span class="text-sm text-white dark:text-gray-900 font-medium">Há alterações não salvas</span>
            <button
              onclick={() => {
                const keys = currentSectionKeys()
                const snap: Record<string,string> = {}
                for (const k of keys) snap[k] = savedSnapshot[k] ?? ''
                settings = { ...settings, ...snap }
              }}
              class="text-sm text-white/60 dark:text-gray-900/60 hover:text-white dark:hover:text-gray-900 transition-colors"
            >Descartar</button>
            <button
              onclick={() => handleSubmit(currentSectionKeys(), activeSection)}
              disabled={isSaving(activeSection)}
              class="px-4 py-1.5 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-semibold disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isSaving(activeSection) ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        {/if}

      </main>
    </div>

<!-- ═══════════════════════════════════════════════════════ STYLE CONSTANTS -->
<script module>
  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-shadow placeholder:text-gray-400'
  const btnPrimary = 'inline-flex items-center justify-center px-5 py-2 rounded-lg bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-white disabled:opacity-50 transition-colors'
  const btnSecondary = 'inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors'
</script>
