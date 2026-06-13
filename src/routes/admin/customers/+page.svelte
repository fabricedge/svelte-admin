<script lang="ts">
  import { onMount } from 'svelte'
  import { listUsers } from '$lib/api/users'
  import { exportCSV } from '$lib/utils/csv'

  let customers = $state<any[]>([])
  let loading = $state(true)
  let search = $state('')
  let page = $state(1)
  let totalPages = $state(1)
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  function handleExportCSV() {
    exportCSV('clientes', ['Email', 'Nome', 'Role', 'Criado em'],
      customers.map((c) => [
        c.email,
        c.name || '-',
        c.role,
        new Date(c.createdAt).toLocaleDateString(),
      ])
    )
  }

  onMount(() => load())

  async function load() {
    loading = true
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' }
      if (search) params.search = search
      const data = await listUsers(params)
      customers = data.users || []
      totalPages = data.pages || 1
    } catch (err) {
      console.error('Erro ao carregar clientes:', err)
    } finally {
      loading = false
    }
  }

  function onSearchInput() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      page = 1
      load()
    }, 300)
  }
</script>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">Clientes</h1>
  <div class="flex items-center gap-3">
    <button onclick={handleExportCSV} class="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">CSV</button>
    <input
      type="text"
      placeholder="Buscar por email ou nome..."
      bind:value={search}
      oninput={onSearchInput}
      class="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
    />
  </div>
</div>

{#if loading}
  <div class="space-y-3">
    {#each [1,2,3,4,5] as _}
      <div class="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
    {/each}
  </div>
{:else if customers.length === 0}
  <p class="text-gray-500">Nenhum cliente encontrado.</p>
{:else}
  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="text-left px-4 py-3 font-medium">Email</th>
          <th class="text-left px-4 py-3 font-medium">Nome</th>
          <th class="text-left px-4 py-3 font-medium">Role</th>
          <th class="text-left px-4 py-3 font-medium">Criado em</th>
          <th class="text-right px-4 py-3 font-medium">Ações</th>
        </tr>
      </thead>
      <tbody>
        {#each customers as customer}
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3">{customer.email}</td>
            <td class="px-4 py-3">{customer.name || '-'}</td>
            <td class="px-4 py-3">{customer.role}</td>
            <td class="px-4 py-3">{new Date(customer.createdAt).toLocaleDateString()}</td>
            <td class="px-4 py-3 text-right">
              <a href="/admin/customers/{customer.id}" class="text-blue-600 hover:underline">Detalhes</a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if totalPages > 1}
    <div class="flex items-center justify-center gap-2 mt-4">
      <button
        onclick={() => { page = Math.max(1, page - 1); load() }}
        disabled={page <= 1}
        class="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50"
      >
        Anterior
      </button>
      <span class="text-sm text-gray-600">Página {page} de {totalPages}</span>
      <button
        onclick={() => { page = Math.min(totalPages, page + 1); load() }}
        disabled={page >= totalPages}
        class="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50"
      >
        Próximo
      </button>
    </div>
  {/if}
{/if}
