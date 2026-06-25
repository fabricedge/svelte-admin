<script lang="ts">
  import { onMount } from 'svelte'
  import { getSettings, updateSettings } from '$lib/api/settings'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'

  let settings: Record<string, string> = $state({})
  let loading = $state(true)
  let saving = $state<Record<string, boolean>>({})
  let loaded = $state(new Set<string>())
  let activeSection = $state('general')

  const sections = [
    { id: 'general', label: () => t('settings.sections.general') },
    { id: 'shipping', label: () => t('settings.sections.shipping') },
    { id: 'branding', label: () => t('settings.sections.branding') },
  ]

  const generalKeys = ['store_name', 'store_email', 'store_currency', 'store_locale']
  const shippingKeys = ['easyship_client_id', 'easyship_client_secret']
  const brandingKeys = ['branding_primary_color', 'branding_secondary_color', 'branding_logo_url', 'branding_favicon_url', 'branding_font_family']

  function load(id: string) {
    if (!loaded.has(id)) loaded = new Set([...loaded, id])
  }

  onMount(async () => {
    try {
      const data = await getSettings()
      settings = data.settings || {}
      load('general')
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
    } finally {
      loading = false
    }
  })

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
      toast.success(t('settings.saved'))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      saving = { ...saving, [sectionId]: false }
    }
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
      const data = await res.json()
      return data.url
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

  let shippingConfigured = $derived(!!settings['easyship_client_id'] && !!settings['easyship_client_secret'])

  function brandingVal(key: string, fallback: string): string {
    return settings[`branding_${key}`] || fallback
  }
</script>

<nav class="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 mb-8">
  <div class="flex gap-1 overflow-x-auto">
    {#each sections as section}
      <button
        onclick={() => switchTab(section.id)}
        class="shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors {activeSection === section.id ? 'border-black dark:border-white text-gray-900 dark:text-gray-100' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}"
      >
        {section.label()}
      </button>
    {/each}
  </div>
</nav>

{#if loading}
  <div class="space-y-4">
    {#each [1,2,3] as _}
      <div class="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
    {/each}
  </div>
{:else if activeSection === 'general'}
  <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('settings.sections.general')}</h2>

    {#if loaded.has('general')}
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.fieldLabels.store_name')}</label>
          <input type="text" value={getValue('store_name')} oninput={(e) => setValue('store_name', (e.target as HTMLInputElement).value)} class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.fieldLabels.store_email')}</label>
          <input type="email" value={getValue('store_email')} oninput={(e) => setValue('store_email', (e.target as HTMLInputElement).value)} class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.fieldLabels.store_currency')}</label>
          <select value={getValue('store_currency')} onchange={(e) => setValue('store_currency', (e.target as HTMLSelectElement).value)} class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
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
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.fieldLabels.store_locale')}</label>
          <select value={getValue('store_locale')} onchange={(e) => setValue('store_locale', (e.target as HTMLSelectElement).value)} class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <option value="" disabled>{t('common.select')}</option>
            <option value="pt">Português</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
        <div class="flex justify-end pt-2">
          <button onclick={() => handleSubmit(generalKeys, 'general')} disabled={isSaving('general')} class="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
            {isSaving('general') ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    {/if}
  </div>

{:else if activeSection === 'shipping'}
  <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
    <div class="flex items-center gap-3 mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.sections.shipping')}</h2>
      <span class="inline-block h-2.5 w-2.5 rounded-full {shippingConfigured ? 'bg-green-500' : 'bg-red-400'}" title={shippingConfigured ? 'Configurado' : 'Não configurado'}></span>
    </div>

    {#if loaded.has('shipping')}
      <div class="space-y-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">{t('settings.shipping.description')}</p>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.fieldLabels.easyship_client_id')}</label>
          <input type="text" value={getValue('easyship_client_id')} oninput={(e) => setValue('easyship_client_id', (e.target as HTMLInputElement).value)} placeholder="seu_client_id" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.fieldLabels.easyship_client_secret')}</label>
          <input type="password" value={getValue('easyship_client_secret')} oninput={(e) => setValue('easyship_client_secret', (e.target as HTMLInputElement).value)} placeholder="••••••••" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
        </div>
        <div class="flex justify-end pt-2">
          <button onclick={() => handleSubmit(shippingKeys, 'shipping')} disabled={isSaving('shipping')} class="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
            {isSaving('shipping') ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    {/if}
  </div>

{:else if activeSection === 'branding'}
  <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('settings.sections.branding')}</h2>

    {#if loaded.has('branding')}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.branding.primaryColor')}</label>
            <div class="flex gap-3 items-center">
              <input type="color" value={brandingVal('primary_color', '#18181b')} oninput={(e) => setValue('branding_primary_color', (e.target as HTMLInputElement).value)} class="h-10 w-16 rounded border border-gray-300 dark:border-gray-600 cursor-pointer" />
              <input type="text" value={brandingVal('primary_color', '#18181b')} oninput={(e) => setValue('branding_primary_color', (e.target as HTMLInputElement).value)} placeholder="#18181b" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.branding.secondaryColor')}</label>
            <div class="flex gap-3 items-center">
              <input type="color" value={brandingVal('secondary_color', '#f4f4f5')} oninput={(e) => setValue('branding_secondary_color', (e.target as HTMLInputElement).value)} class="h-10 w-16 rounded border border-gray-300 dark:border-gray-600 cursor-pointer" />
              <input type="text" value={brandingVal('secondary_color', '#f4f4f5')} oninput={(e) => setValue('branding_secondary_color', (e.target as HTMLInputElement).value)} placeholder="#f4f4f5" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
            </div>
          </div>

          <div>
            <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" bind:checked={compressEnabled} class="rounded border-gray-300 dark:border-gray-600" />
              {t('common.imageCompression')}
            </label>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.branding.logo')}</label>
            <div class="flex gap-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onchange={handleUploadLogo}
                bind:this={logoFileInput}
                class="hidden"
              />
              <button
                onclick={() => logoFileInput.click()}
                disabled={uploading.logo}
                class="shrink-0 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {uploading.logo ? t('common.uploading') : t('common.upload')}
              </button>
              <input type="url" value={brandingVal('logo_url', '')} oninput={(e) => setValue('branding_logo_url', (e.target as HTMLInputElement).value)} placeholder="https://..." class="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
            </div>
            {#if brandingVal('logo_url', '')}
              <div class="mt-2">
                <img src={brandingVal('logo_url', '')} alt="Logo preview" onerror={(e) => (e.target as HTMLImageElement).style.display = 'none'} onload={(e) => (e.target as HTMLImageElement).style.display = 'block'} class="max-h-20 max-w-48 rounded border border-gray-200 dark:border-gray-700 p-1 bg-white" />
              </div>
            {/if}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.branding.favicon')}</label>
            <div class="flex gap-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onchange={handleUploadFavicon}
                bind:this={faviconFileInput}
                class="hidden"
              />
              <button
                onclick={() => faviconFileInput.click()}
                disabled={uploading.favicon}
                class="shrink-0 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {uploading.favicon ? t('common.uploading') : t('common.upload')}
              </button>
              <input type="url" value={brandingVal('favicon_url', '')} oninput={(e) => setValue('branding_favicon_url', (e.target as HTMLInputElement).value)} placeholder="https://..." class="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
            </div>
            {#if brandingVal('favicon_url', '')}
              <div class="mt-2">
                <img src={brandingVal('favicon_url', '')} alt="Favicon preview" onerror={(e) => (e.target as HTMLImageElement).style.display = 'none'} onload={(e) => (e.target as HTMLImageElement).style.display = 'block'} class="h-8 w-8 rounded border border-gray-200 dark:border-gray-700 p-0.5 bg-white" />
              </div>
            {/if}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.branding.font')}</label>
            <input type="text" value={brandingVal('font_family', '')} oninput={(e) => setValue('branding_font_family', (e.target as HTMLInputElement).value)} placeholder="Inter, sans-serif" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
            {#if settings['branding_font_family']}
              <p class="mt-2 text-sm bg-gray-50 dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700" style="font-family: {settings['branding_font_family']}">
                The quick brown fox jumps over the lazy dog — 1234567890
              </p>
            {/if}
          </div>

          <div class="flex justify-end pt-2">
            <button onclick={() => handleSubmit(brandingKeys, 'branding')} disabled={isSaving('branding')} class="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
              {isSaving('branding') ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>

        <div class="lg:sticky lg:top-32 self-start">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('settings.branding.preview')}</p>
          <div class="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden" style="font-family: {settings['branding_font_family'] || 'Inter, sans-serif'}">
            <div class="flex items-center justify-between px-5 py-3" style="background: {settings['branding_primary_color'] || '#18181b'}">
              <div class="text-white font-bold text-lg">
                {#if settings['branding_logo_url']}
                  <img src={settings['branding_logo_url']} alt="Logo" class="h-7 object-contain" onerror={(e) => { (e.target as HTMLImageElement).style.display = 'none'; ((e.target as HTMLImageElement).nextElementSibling as HTMLElement).style.display = 'block' }} />
                  <span class="hidden text-white font-bold text-lg">LOGO</span>
                {:else}
                  <span class="text-white font-bold text-lg">LOGO</span>
                {/if}
              </div>
              <div class="flex gap-3">
                <svg class="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <svg class="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
              </div>
            </div>
            <div class="p-5 space-y-3 bg-white dark:bg-gray-900">
              <h3 class="text-xl font-bold" style="color: {settings['branding_secondary_color'] || '#f4f4f5'}">{t('settings.branding.previewHeading')}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('settings.branding.previewText')}</p>
              <button class="px-5 py-2 rounded-lg text-sm font-medium text-white" style="background: {settings['branding_primary_color'] || '#18181b'}">
                {t('settings.branding.previewButton')}
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
