<script lang="ts">
  import { onMount } from 'svelte'
  import { getSettings, updateSettings } from '$lib/api/settings'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'

  let settings: Record<string, string> = $state({})
  let loading = $state(true)
  let saving = $state(false)

  const defaultSettings = [
    { key: 'store_name', label: () => t('settings.fieldLabels.store_name'), type: 'text' },
    { key: 'store_email', label: () => t('settings.fieldLabels.store_email'), type: 'email' },
    { key: 'store_currency', label: () => t('settings.fieldLabels.store_currency'), type: 'text' },
    { key: 'store_locale', label: () => t('settings.fieldLabels.store_locale'), type: 'text' },
  ]

  const brandingFields = [
    { key: 'branding_primary_color', label: () => t('settings.branding.primaryColor'), type: 'color' },
    { key: 'branding_secondary_color', label: () => t('settings.branding.secondaryColor'), type: 'color' },
    { key: 'branding_logo', label: () => t('settings.branding.logo'), type: 'text' },
    { key: 'branding_favicon', label: () => t('settings.branding.favicon'), type: 'text' },
    { key: 'branding_font', label: () => t('settings.branding.font'), type: 'text' },
  ]

  onMount(async () => {
    try {
      const data = await getSettings()
      settings = data.settings || {}
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
    } finally {
      loading = false
    }
  })

  function getValue(key: string) { return settings[key] ?? '' }
  function setValue(key: string, value: string) { settings = { ...settings, [key]: value } }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    saving = true
    try {
      await updateSettings(settings)
      toast.success(t('settings.saved'))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      saving = false
    }
  }
</script>

<h1 class="text-2xl font-bold mb-6">{t('settings.title')}</h1>

{#if loading}
  <div class="space-y-3 max-w-lg">
    {#each [1,2,3,4] as _}
      <div class="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
    {/each}
  </div>
{:else}
  <form onsubmit={handleSubmit} class="max-w-lg space-y-5">
    {#each defaultSettings as field}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">{field.label()}</label>
        <input
          type={field.type}
          value={getValue(field.key)}
          oninput={(e) => setValue(field.key, (e.target as HTMLInputElement).value)}
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>
    {/each}

    <h2 class="text-lg font-semibold pt-4 border-t border-gray-200">{t('settings.branding.sectionTitle')}</h2>

    {#each brandingFields as field}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">{field.label()}</label>
        <input
          type={field.type}
          value={getValue(field.key)}
          oninput={(e) => setValue(field.key, (e.target as HTMLInputElement).value)}
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>
    {/each}

    <button type="submit" disabled={saving} class="px-6 py-2.5 bg-black text-white rounded-md text-sm disabled:opacity-50">
      {saving ? t('common.saving') : t('common.save')}
    </button>
  </form>
{/if}
