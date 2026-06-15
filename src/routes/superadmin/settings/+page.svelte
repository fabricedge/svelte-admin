<script lang="ts">
  import { onMount } from 'svelte'
  import { getSettings, updateSettings, getMultiStore, updateMultiStore } from '$lib/api/settings'
  import { getStoreContext } from '$lib/stores/store-context.svelte'
  import { updateBranding, updateStoreDomain } from '$lib/api/stores'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'

  const ctx = getStoreContext()

  let settings: Record<string, string> = $state({})
  let loading = $state(true)
  let saving = $state(false)
  let multiStoreEnabled = $state(false)
  let togglingMultiStore = $state(false)
  let storeDomain = $state('')

  let branding = $state({
    primary_color: '#18181b',
    secondary_color: '#f4f4f5',
    logo_url: '',
    favicon_url: '',
    font_family: 'Inter, sans-serif',
  })

  const defaultSettings = [
    { key: 'store_name', label: t('settings.fieldLabels.store_name'), type: 'text' },
    { key: 'store_email', label: t('settings.fieldLabels.store_email'), type: 'email' },
    { key: 'store_currency', label: t('settings.fieldLabels.store_currency'), type: 'text' },
    { key: 'store_locale', label: t('settings.fieldLabels.store_locale'), type: 'text' },
  ]

  onMount(async () => {
    try {
      const data = await getSettings()
      settings = data.settings || {}
      branding = {
        primary_color: settings['branding_primary_color'] || '#18181b',
        secondary_color: settings['branding_secondary_color'] || '#f4f4f5',
        logo_url: settings['branding_logo_url'] || '',
        favicon_url: settings['branding_favicon_url'] || '',
        font_family: settings['branding_font_family'] || 'Inter, sans-serif',
      }

      if (ctx.currentStore?.domain) storeDomain = ctx.currentStore.domain

      try {
        const ms = await getMultiStore()
        multiStoreEnabled = ms.multi_store_enabled
        ctx.multiStoreEnabled = multiStoreEnabled
      } catch {}
    } catch (err) {
      console.error(t('common.error'), err)
    } finally {
      loading = false
    }
  })

  function getValue(key: string) { return settings[key] ?? '' }
  function setValue(key: string, value: string) { settings = { ...settings, [key]: value } }

  async function handleGeneralSubmit(e: Event) {
    e.preventDefault()
    saving = true
    try {
      await updateSettings(settings)
      toast.success(t('superadmin.settingsPage.saved'))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      saving = false
    }
  }

  async function handleMultiStoreToggle() {
    togglingMultiStore = true
    try {
      const result = await updateMultiStore(!multiStoreEnabled)
      multiStoreEnabled = result.multi_store_enabled
      ctx.multiStoreEnabled = multiStoreEnabled
      toast.success(multiStoreEnabled ? t('superadmin.settingsPage.multiStoreEnabled') : t('superadmin.settingsPage.multiStoreDisabled'))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      togglingMultiStore = false
    }
  }

  async function handleDomainSubmit(e: Event) {
    e.preventDefault()
    if (!ctx.currentStore) return
    saving = true
    try {
      await updateStoreDomain(ctx.currentStore.id, storeDomain)
      ctx.currentStore.domain = storeDomain || null
      toast.success(t('superadmin.settingsPage.domainFields.saved'))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      saving = false
    }
  }

  async function handleBrandingSubmit(e: Event) {
    e.preventDefault()
    if (!ctx.currentStore) return
    saving = true
    try {
      await updateBranding(ctx.currentStore.id, branding)
      await updateSettings({
        'branding_primary_color': branding.primary_color,
        'branding_secondary_color': branding.secondary_color,
        'branding_logo_url': branding.logo_url,
        'branding_favicon_url': branding.favicon_url,
        'branding_font_family': branding.font_family,
      })
      toast.success(t('superadmin.settingsPage.saved'))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      saving = false
    }
  }
</script>

<h1 class="text-2xl font-bold mb-6">{t('superadmin.settingsPage.title')}</h1>

{#if loading}
  <div class="space-y-3 max-w-lg">
    {#each [1,2,3,4] as _}
      <div class="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
    {/each}
  </div>
{:else}
  <div class="space-y-10 max-w-lg">
    <!-- Multi-Store -->
    <section>
      <h2 class="text-lg font-semibold mb-4">{t('superadmin.settingsPage.multiStore')}</h2>
      <div class="rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{t('superadmin.settingsPage.multiStore')}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('superadmin.settingsPage.multiStoreDesc')}
            </p>
          </div>
          <button
            onclick={handleMultiStoreToggle}
            disabled={togglingMultiStore}
            class="relative h-6 w-11 rounded-full transition-colors disabled:opacity-50"
            class:bg-black={multiStoreEnabled}
            class:bg-gray-300={!multiStoreEnabled}
          >
            <span
              class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
              class:translate-x-5={multiStoreEnabled}
            />
          </button>
        </div>
      </div>
    </section>

    <!-- Geral -->
    <section>
      <h2 class="text-lg font-semibold mb-4">{t('superadmin.settingsPage.general')}</h2>
      <form onsubmit={handleGeneralSubmit} class="space-y-5">
        {#each defaultSettings as field}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <input
              type={field.type}
              value={getValue(field.key)}
              oninput={(e) => setValue(field.key, (e.target as HTMLInputElement).value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        {/each}
        <button type="submit" disabled={saving} class="px-6 py-2.5 bg-black text-white rounded-md text-sm disabled:opacity-50">
          {saving ? t('common.saving') : t('superadmin.settingsPage.generalSave')}
        </button>
      </form>
    </section>

    <!-- Branding -->
    <section>
      <h2 class="text-lg font-semibold mb-4">{t('superadmin.settingsPage.branding')}</h2>
      <p class="text-xs text-gray-500 mb-3">{t('superadmin.settingsPage.brandingDesc', { storeName: ctx.currentStore?.name || '-' })}</p>
      <form onsubmit={handleBrandingSubmit} class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{t('superadmin.settingsPage.brandingFields.primaryColor')}</label>
          <div class="flex gap-3 items-center">
            <input
              type="color"
              bind:value={branding.primary_color}
              class="h-10 w-16 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              bind:value={branding.primary_color}
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{t('superadmin.settingsPage.brandingFields.secondaryColor')}</label>
          <div class="flex gap-3 items-center">
            <input
              type="color"
              bind:value={branding.secondary_color}
              class="h-10 w-16 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              bind:value={branding.secondary_color}
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{t('superadmin.settingsPage.brandingFields.logoUrl')}</label>
          <input
            type="url"
            bind:value={branding.logo_url}
            placeholder={t('superadmin.settingsPage.brandingFields.urlPlaceholder')}
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{t('superadmin.settingsPage.brandingFields.faviconUrl')}</label>
          <input
            type="url"
            bind:value={branding.favicon_url}
            placeholder={t('superadmin.settingsPage.brandingFields.urlPlaceholder')}
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{t('superadmin.settingsPage.brandingFields.font')}</label>
          <input
            type="text"
            bind:value={branding.font_family}
            placeholder={t('superadmin.settingsPage.brandingFields.fontPlaceholder')}
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <button type="submit" disabled={saving} class="px-6 py-2.5 bg-black text-white rounded-md text-sm disabled:opacity-50">
          {saving ? t('common.saving') : t('superadmin.settingsPage.brandingFields.save')}
        </button>
      </form>
    </section>

    <!-- DHL -->
    <section>
      <h2 class="text-lg font-semibold mb-4">
        <span class="text-red-600">DHL</span> {t('superadmin.settingsPage.dhl')}
      </h2>
      <p class="text-xs text-gray-500 mb-3">{t('superadmin.settingsPage.dhlDesc')}</p>
      <form onsubmit={handleGeneralSubmit} class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{t('superadmin.settingsPage.dhlFields.originZip')}</label>
          <input
            type="text"
            value={getValue('dhl_origin_zip')}
            oninput={(e) => setValue('dhl_origin_zip', (e.target as HTMLInputElement).value)}
            placeholder={t('superadmin.settingsPage.dhlFields.zipPlaceholder')}
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{t('superadmin.settingsPage.dhlFields.originCity')}</label>
          <input
            type="text"
            value={getValue('dhl_origin_city')}
            oninput={(e) => setValue('dhl_origin_city', (e.target as HTMLInputElement).value)}
            placeholder={t('superadmin.settingsPage.dhlFields.cityPlaceholder')}
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{t('superadmin.settingsPage.dhlFields.originAddress')}</label>
          <input
            type="text"
            value={getValue('dhl_origin_address')}
            oninput={(e) => setValue('dhl_origin_address', (e.target as HTMLInputElement).value)}
            placeholder={t('superadmin.settingsPage.dhlFields.addressPlaceholder')}
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </form>
    </section>

    <!-- Domínio -->
    <section>
      <h2 class="text-lg font-semibold mb-4">{t('superadmin.settingsPage.domain')}</h2>
      <p class="text-xs text-gray-500 mb-3">{t('superadmin.settingsPage.domainDesc', { storeName: ctx.currentStore?.name || '-' })}</p>
      <form onsubmit={handleDomainSubmit} class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{t('superadmin.settingsPage.domainFields.label')}</label>
          <input
            type="text"
            bind:value={storeDomain}
            placeholder={t('superadmin.settingsPage.domainFields.placeholder')}
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <button type="submit" disabled={saving} class="px-6 py-2.5 bg-black text-white rounded-md text-sm disabled:opacity-50">
          {saving ? t('common.saving') : t('superadmin.settingsPage.domainFields.save')}
        </button>
      </form>
    </section>
  </div>
{/if}
