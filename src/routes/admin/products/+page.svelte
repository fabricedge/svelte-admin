<script lang="ts">
  import { onMount } from 'svelte'
  import { listProducts, deleteProduct } from '$lib/api/products'
  import { toast } from 'svelte-sonner'

  let products = $state<any[]>([])
  let loading = $state(true)

  onMount(async () => {
    try {
      const data = await listProducts()
      products = data.products || []
    } catch (err) { console.error('Erro ao carregar produtos:', err) } finally { loading = false }
  })

  async function handleDelete(id: string) {
    if (!confirm('Deletar produto?')) return
    try {
      await deleteProduct(id)
      products = products.filter(p => p.id !== id)
      toast.success('Produto deletado')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`
  }
</script>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">Produtos</h1>
  <a href="/admin/products/new" class="px-4 py-2 bg-black text-white rounded-md text-sm">Novo Produto</a>
</div>

{#if loading}
  <p class="text-gray-500">Carregando...</p>
{:else if products.length === 0}
  <p class="text-gray-500">Nenhum produto encontrado.</p>
{:else}
  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="text-left px-4 py-3 font-medium">Nome</th>
          <th class="text-left px-4 py-3 font-medium">Preço</th>
          <th class="text-left px-4 py-3 font-medium">Categoria</th>
          <th class="text-left px-4 py-3 font-medium">Estoque</th>
          <th class="text-right px-4 py-3 font-medium">Ações</th>
        </tr>
      </thead>
      <tbody>
        {#each products as product}
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3">{product.name}</td>
            <td class="px-4 py-3">{formatPrice(product.price)}</td>
            <td class="px-4 py-3">{product.category}</td>
            <td class="px-4 py-3">{product.inventory}</td>
            <td class="px-4 py-3 text-right space-x-2">
              <a href="/admin/products/{product.id}" class="text-blue-600 hover:underline">Editar</a>
              <button onclick={() => handleDelete(product.id)} class="text-red-600 hover:underline">Deletar</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
