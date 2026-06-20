<script lang="ts">
  import { updateProfile } from '$lib/api/settings'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'

  let name = $state('')
  let currentPassword = $state('')
  let newPassword = $state('')
  let saving = $state(false)

  async function handleSubmit(e: Event) {
    e.preventDefault()
    saving = true
    try {
      const data: any = {}
      if (name) data.name = name
      if (currentPassword && newPassword) {
        data.currentPassword = currentPassword
        data.newPassword = newPassword
      }
      if (Object.keys(data).length === 0) {
        toast.error(t('profile.fillField'))
        return
      }
      const result = await updateProfile(data)
      toast.success(t('profile.saved'))
      currentPassword = ''
      newPassword = ''
      if (result.user?.name) name = result.user.name
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      saving = false
    }
  }
</script>

<h1 class="text-2xl font-bold mb-6">{t('profile.title')}</h1>

<form onsubmit={handleSubmit} class="max-w-lg space-y-5">
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">{t('profile.name')}</label>
    <input type="text" bind:value={name} placeholder={t('profile.namePlaceholder')} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
  </div>

  <div class="pt-4 border-t border-gray-200">
    <h2 class="font-bold text-sm mb-3">{t('profile.changePassword')}</h2>
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">{t('profile.currentPassword')}</label>
        <input type="password" bind:value={currentPassword} placeholder={t('profile.passwordPlaceholder')} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">{t('profile.newPassword')}</label>
        <input type="password" bind:value={newPassword} placeholder={t('profile.passwordPlaceholder')} minlength="6" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
    </div>
  </div>

  <button type="submit" disabled={saving} class="px-6 py-2.5 bg-black text-white rounded-md text-sm disabled:opacity-50">
    {saving ? t('common.saving') : t('common.save')}
  </button>
</form>
