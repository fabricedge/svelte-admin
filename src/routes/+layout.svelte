<script lang="ts">
  import '../app.css'
  import { logout } from '$lib/api/auth'
  import { page } from '$app/state'
  import { Toaster } from 'svelte-sonner'

  let { children } = $props()

  let user = $state<{ email?: string; role?: string } | null>(null)

  $effect(() => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        user = payload
      } else {
        user = null
      }
    } catch { user = null }
  })

  let isAuth = $derived(!!user)
  let isLoginPage = $derived(page.url.pathname === '/login')

  function handleLogout() {
    logout()
    window.location.href = '/login'
  }

  if (!isAuth && !isLoginPage) {
    window.location.href = '/login'
  }
</script>

<Toaster />

{#if isAuth && !isLoginPage}
  <div class="flex min-h-screen">
    <aside class="w-60 border-r border-gray-200 bg-white shrink-0 flex flex-col">
      <a href="/admin" class="h-16 flex items-center px-6 font-bold text-lg border-b border-gray-200">Admin</a>
      <nav class="flex-1 py-4">
        {#each [
          { label: 'Dashboard', href: '/admin', icon: '📊' },
          { label: 'Pedidos', href: '/admin/orders', icon: '📦' },
          { label: 'Produtos', href: '/admin/products', icon: '🏷️' },
          { label: 'Clientes', href: '/admin/customers', icon: '👥' },
          { label: 'Configurações', href: '/admin/settings', icon: '⚙️' }
        ] as item}
          <a
            href={item.href}
            class="flex items-center gap-3 px-6 py-2.5 text-sm transition-colors hover:bg-gray-100"
            class:font-medium={page.url.pathname.startsWith(item.href)}
          >
            <span>{item.icon}</span>
            {item.label}
          </a>
        {/each}
      </nav>
      <div class="p-4 border-t border-gray-200">
        <p class="text-xs text-gray-500 mb-2">{user?.email}</p>
        <button onclick={handleLogout} class="text-xs text-red-500 hover:underline">Sair</button>
      </div>
    </aside>
    <div class="flex-1 flex flex-col">
      <div class="h-16 border-b border-gray-200 flex items-center px-8 bg-white">
        <p class="text-sm text-gray-500">
          Logado como <span class="font-medium text-gray-900">{user?.email}</span>
        </p>
      </div>
      <main class="flex-1 p-8 bg-gray-50">
        {@render children()}
      </main>
    </div>
  </div>
{:else}
  <main class="min-h-screen">
    {@render children()}
  </main>
{/if}
