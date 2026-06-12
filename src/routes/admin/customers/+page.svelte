<script lang="ts">
  import { onMount } from 'svelte'
  import { get } from '$lib/api'

  let customers = $state<any[]>([])
  let loading = $state(true)

  onMount(async () => {
    try {
      const data = await get('/users')
      customers = data.users || []
    } catch {} finally { loading = false }
  })
</script>

<h1 class="text-2xl font-bold mb-6">Clientes</h1>

{#if loading}
  <p class="text-gray-500">Carregando...</p>
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
        </tr>
      </thead>
      <tbody>
        {#each customers as customer}
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3">{customer.email}</td>
            <td class="px-4 py-3">{customer.name || '-'}</td>
            <td class="px-4 py-3">{customer.role}</td>
            <td class="px-4 py-3">{new Date(customer.createdAt).toLocaleDateString()}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
