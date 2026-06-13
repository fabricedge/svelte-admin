<script lang="ts">
  import { onMount } from 'svelte'
  import { createProduct, listCategories } from '$lib/api/products'
  import { toast } from 'svelte-sonner'
  import ImageGallery from '$lib/components/ImageGallery.svelte'

  let name = $state('')
  let slug = $state('')
  let description = $state('')
  let price = $state(0)
  let category = $state('')
  let inventory = $state(0)
  let images: string[] = $state([])
  let categories: string[] = $state([])
  let loading = $state(false)

  onMount(async () => {
    try {
      const data = await listCategories()
      categories = data.categories || []
    } catch {}
  })

  function autoSlug() {
    if (!slug && name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    loading = true
    try {
      await createProduct({
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        description,
        price: Math.round(price * 100),
        category: category || null,
        inventory,
        images,
      })
      toast.success('Produto criado')
      window.location.href = '/admin/products'
    } catch (err: any) {
      toast.error(err.message)
    } finally { loading = false }
  }
</script>

<h1 class="text-2xl font-bold mb-6">Novo Produto</h1>

<form onsubmit={handleSubmit} class="max-w-2xl space-y-6">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
      <input type="text" bind:value={name} oninput={autoSlug} required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Slug (deixe vazio para auto-gerar)</label>
      <input type="text" bind:value={slug} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
      <input type="number" bind:value={price} min="0" step="0.01" required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
      <div class="flex gap-2">
        <select bind:value={category} class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">Sem categoria</option>
          {#each categories as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
        <a href="/admin/categories" class="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">+</a>
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
      <input type="number" bind:value={inventory} min="0" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
    <textarea bind:value={description} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows="4"></textarea>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Imagens</label>
    <ImageGallery bind:images />
  </div>

  <button type="submit" disabled={loading} class="px-6 py-2.5 bg-black text-white rounded-md text-sm disabled:opacity-50">
    {loading ? 'Criando...' : 'Criar Produto'}
  </button>
</form>
