<script lang="ts">
  import { onMount } from 'svelte'
  import { getProduct, updateProduct } from '$lib/api/products'
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'

  let id = $derived(page.params.id)

  let name = $state('')
  let slug = $state('')
  let description = $state('')
  let price = $state(0)
  let category = $state('')
  let inventory = $state(0)
  let images = $state('')
  let loading = $state(false)
  let loaded = $state(false)

  onMount(async () => {
    try {
      const data = await getProduct(id)
      name = data.name
      slug = data.slug
      description = data.description || ''
      price = data.price / 100
      category = data.category || ''
      inventory = data.inventory
      images = (data.images || []).join('\n')
      loaded = true
    } catch {
      toast.error('Produto não encontrado')
    }
  })

  async function handleSubmit(e: Event) {
    e.preventDefault()
    loading = true
    try {
      await updateProduct(id, {
        name, slug, description,
        price: Math.round(price * 100),
        category, inventory,
        images: images ? images.split('\n').filter(Boolean) : []
      })
      toast.success('Produto atualizado')
    } catch (err: any) {
      toast.error(err.message)
    } finally { loading = false }
  }
</script>

<h1 class="text-2xl font-bold mb-6">Editar Produto</h1>

{#if !loaded}
  <p class="text-gray-500">Carregando...</p>
{:else}
  <form onsubmit={handleSubmit} class="max-w-lg space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
      <input type="text" bind:value={name} required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
      <input type="text" bind:value={slug} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
      <textarea bind:value={description} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows="3"></textarea>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Preço (em dólares)</label>
      <input type="number" bind:value={price} min="0" step="0.01" required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
      <input type="text" bind:value={category} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
      <input type="number" bind:value={inventory} min="0" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Imagens (uma URL por linha)</label>
      <textarea bind:value={images} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows="3"></textarea>
    </div>
    <button type="submit" disabled={loading} class="px-4 py-2 bg-black text-white rounded-md text-sm disabled:opacity-50">
      {loading ? 'Salvando...' : 'Salvar'}
    </button>
  </form>
{/if}
