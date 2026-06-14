<script lang="ts">
  import { login, register } from '$lib/api/auth'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'

  let isRegistering = $state(false)
  let name = $state('')
  let email = $state('')
  let password = $state('')
  let loading = $state(false)

  async function handleSubmit(e: Event) {
    e.preventDefault()
    loading = true
    try {
      if (isRegistering) {
        await register(name, email, password)
        toast.success(t('auth.successRegister'))
      } else {
        await login(email, password)
        toast.success(t('auth.successLogin'))
      }
      window.location.href = '/admin'
    } catch (err: any) {
      toast.error(err.message || t('auth.error'))
    } finally {
      loading = false
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
  <div class="w-full max-w-sm mx-4">
    <a href="/" class="block text-center mb-8 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
      ← {t('auth.back')}
    </a>
    <h1 class="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
      {isRegistering ? t('auth.registerTitle') : t('auth.loginTitle')}
    </h1>
    <p class="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">
      {isRegistering ? t('auth.registerDesc') : t('auth.loginDesc')}
    </p>
    <form onsubmit={handleSubmit} class="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 space-y-4">
      {#if isRegistering}
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.name')}</label>
          <input type="text" bind:value={name} placeholder={t('auth.namePlaceholder')} required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" />
        </div>
      {/if}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.email')}</label>
        <input type="email" bind:value={email} required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.password')}</label>
        <input type="password" bind:value={password} required minlength={6} class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100" />
      </div>
      {#if isRegistering}
        <p class="text-xs text-gray-400 dark:text-gray-500">{t('auth.adminRoleHint')}</p>
      {/if}
      <button type="submit" disabled={loading} class="w-full py-2 px-4 bg-black text-white rounded-md text-sm font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors">
        {loading ? t('auth.loading') : isRegistering ? t('auth.createAccount') : t('auth.signIn')}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
      {#if isRegistering}
        {t('auth.hasAccount')} <button onclick={() => isRegistering = false} class="text-black dark:text-white font-medium hover:underline cursor-pointer">{t('auth.doLogin')}</button>
      {:else}
        {t('auth.noAccount')} <button onclick={() => isRegistering = true} class="text-black dark:text-white font-medium hover:underline cursor-pointer">{t('auth.doRegister')}</button>
      {/if}
    </p>
  </div>
</div>
