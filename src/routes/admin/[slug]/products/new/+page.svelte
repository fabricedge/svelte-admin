<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { createProduct, listCategories } from '$lib/api/products'
  import { toast } from 'svelte-sonner'
  import ImageGallery from '$lib/components/ImageGallery.svelte'
  import { t } from '$lib/i18n/locale.svelte'

  let name = $state('')
  let slug = $state('')
  let sku = $state('')
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
        sku: sku || null,
        description,
        price,
        category: category || null,
        inventory,
        images,
      })
      toast.success(t('products.created'))
      window.location.href = '/admin/products'
    } catch (err: any) {
      toast.error(err.message)
    } finally { loading = false }
  }
</script>

<h1 class="text-2xl font-bold mb-6">{t('products.newProduct')}</h1>

<form onsubmit={handleSubmit} class="max-w-2xl space-y-6">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">{t('products.form.name')}</label>
      <input type="text" bind:value={name} oninput={autoSlug} required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">{t('products.form.slug')}</label>
      <input type="text" bind:value={slug} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">{t('products.form.price')}</label>
      <input type="number" bind:value={price} min="0" step="0.01" required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">{t('products.form.category')}</label>
      <div class="flex gap-2">
        <select bind:value={category} class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">{t('products.form.noCategory')}</option>
          {#each categories as cat}
            <option value={cat.name}>{cat.name}</option>
          {/each}
        </select>
        <a href={`/admin/${page.params.slug}/categories`} class="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">+</a>
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">{t('products.form.inventory')}</label>
      <input type="number" bind:value={inventory} min="0" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">{t('products.form.sku')}</label>
      <input type="text" bind:value={sku} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">{t('products.form.description')}</label>
    <textarea bind:value={description} class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows="4"></textarea>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">{t('products.form.images')}</label>
    <ImageGallery bind:images />
  </div>

  <button type="submit" disabled={loading} class="px-6 py-2.5 bg-black text-white rounded-md text-sm disabled:opacity-50">
    {loading ? t('products.form.creating') : t('products.form.create')}
  </button>
</form>
