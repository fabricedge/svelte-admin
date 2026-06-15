<script lang="ts">
  import '../app.css'
  import { logout } from '$lib/api/auth'
  import { page } from '$app/state'
  import { Toaster } from 'svelte-sonner'
  import { t, getLocale, setLocale } from '$lib/i18n/locale.svelte'
  import LanguageSwitcher from '$lib/i18n/LanguageSwitcher.svelte'

  let { children, data } = $props()

  {
    const hasExplicit = (() => { try { return ['pt','en','es'].includes(localStorage.getItem('locale') || '') } catch { return false } })()
    if (data?.locale && !hasExplicit) setLocale(data.locale as 'pt' | 'en' | 'es')
  }

  let user = $state<{ email?: string; role?: string } | null>(null)
  let darkMode = $state(false)
  let sidebarOpen = $state(false)

  $effect(() => {
    let currentUser: { email?: string; role?: string } | null = null
    try {
      const token = localStorage.getItem('token')
      if (token) {
        currentUser = JSON.parse(atob(token.split('.')[1]))
      }
    } catch {}

    user = currentUser
    if (!currentUser && page.url.pathname !== '/login' && page.url.pathname !== '/') {
      window.location.href = '/login'
    }
  })

  $effect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })

  function toggleDark() {
    darkMode = !darkMode
  }

  function handleLogout() {
    logout()
    window.location.href = '/login'
  }

  const navItems = [
    { label: () => t('nav.dashboard'), href: '/admin', icon: '📊' },
    { label: () => t('nav.orders'), href: '/admin/orders', icon: '📦' },
    { label: () => t('nav.products'), href: '/admin/products', icon: '🏷️' },
    { label: () => t('nav.categories'), href: '/admin/categories', icon: '📂' },
    { label: () => t('nav.stores'), href: '/admin/stores', icon: '🏪' },
    { label: () => t('nav.customStorefront'), href: '/admin/custom-storefront', icon: '🎨' },
    { label: () => t('nav.customers'), href: '/admin/customers', icon: '👥' },
    { label: () => t('nav.settings'), href: '/admin/settings', icon: '⚙️' },
  ]

  const isSuperAdmin = $derived(user?.role === 'SUPER_ADMIN')
</script>

<Toaster />

{#if user && page.url.pathname !== '/login' && !page.url.pathname.startsWith('/superadmin')}
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-950 dark:text-gray-100">
    <aside
      class="fixed inset-y-0 left-0 z-40 w-60 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col transition-transform -translate-x-full lg:translate-x-0 lg:static"
      class:translate-x-0={sidebarOpen}
    >
      <div class="h-16 flex items-center px-6 font-bold text-lg border-b border-gray-200 dark:border-gray-800 shrink-0">
        <a href="/admin" class="text-gray-900 dark:text-gray-100">{t('nav.brand')}</a>
      </div>
      <nav class="flex-1 py-4 overflow-y-auto">
        {#each navItems as item}
          <a
            href={item.href}
            onclick={() => { sidebarOpen = false }}
            class="flex items-center gap-3 px-6 py-2.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            class:font-medium={page.url.pathname.startsWith(item.href)}
          >
            <span>{item.icon}</span>
            {item.label()}
          </a>
        {/each}
      </nav>
      <div class="p-4 border-t border-gray-200 dark:border-gray-800 shrink-0">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">{user?.email}</p>
        <div class="flex items-center gap-3">
          {#if isSuperAdmin}
            <a href="/superadmin" class="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium">{t('nav.superAdmin')}</a>
          {/if}
          <a href="/admin/profile" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">{t('nav.profile')}</a>
          <button onclick={handleLogout} class="text-xs text-red-500 hover:underline">{t('nav.signOut')}</button>
        </div>
      </div>
    </aside>

    {#if sidebarOpen}
      <div onclick={() => { sidebarOpen = false }} class="fixed inset-0 z-30 bg-black/30 lg:hidden"></div>
    {/if}

    <div class="flex-1 flex flex-col min-w-0">
      <div class="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4 px-4 lg:px-8 bg-white dark:bg-gray-900">
        <button onclick={() => { sidebarOpen = !sidebarOpen }} class="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <p class="text-sm text-gray-500 dark:text-gray-400 flex-1">
          {t('nav.loggedAs')} <span class="font-medium text-gray-900 dark:text-gray-100">{user?.email}</span>
        </p>
        <LanguageSwitcher />
        <button
          onclick={toggleDark}
          class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          title={darkMode ? t('common.lightMode') : t('common.darkMode')}
        >
          {#if darkMode}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          {:else}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
          {/if}
        </button>
      </div>
      <main class="flex-1 p-4 lg:p-8 overflow-auto">
        {@render children()}
      </main>
    </div>
  </div>
{:else if user && page.url.pathname.startsWith('/superadmin')}
  {@render children()}
{:else}
  <main class="min-h-screen">
    {@render children()}
  </main>
{/if}
