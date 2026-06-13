<script lang="ts">
  import { onMount } from 'svelte'
  import { listCategories, deleteCategory } from '$lib/api/products'
  import { toast } from 'svelte-sonner'
  import ConfirmModal from '$lib/components/ConfirmModal.svelte'

  let categories = $state<{ name: string; productCount: number }[]>([])
  let loading = $state(true)
  let deleteTarget = $state<{ name: string; productCount: number } | null>(null)

  onMount(() => load())

  async function load() {
    loading = true
    try {
      const data = await listCategories()
      categories = data.categories || []
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    } finally {
      loading = false
    }
  }

  async function confirmDelete() {
    const target = deleteTarget
    if (!target) return
    try {
      await deleteCategory(target.name)
      categories = categories.filter((c) => c.name !== target.name)
      toast.success(`Categoria "${target.name}" deletada`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      deleteTarget = null
    }
  }
</script>

<ConfirmModal
  open={deleteTarget !== null}
  title="Deletar categoria"
  message={deleteTarget ? `Deletar categoria "${deleteTarget.name}"?${deleteTarget.productCount > 0 ? ` ${deleteTarget.productCount} produto(s) perderão a categoria.` : ''}` : ''}
  confirmLabel="Deletar"
  onConfirm={confirmDelete}
  onCancel={() => { deleteTarget = null }}
/>

<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">Categorias</h1>
</div>

{#if loading}
  <div class="space-y-3">
    {#each [1,2,3] as _}
      <div class="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
    {/each}
  </div>
{:else if categories.length === 0}
  <p class="text-gray-500 dark:text-gray-400">Nenhuma categoria encontrada.</p>
{:else}
  <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
        <tr>
          <th class="text-left px-4 py-3 font-medium dark:text-gray-300">Nome</th>
          <th class="text-left px-4 py-3 font-medium dark:text-gray-300">Produtos</th>
          <th class="text-right px-4 py-3 font-medium dark:text-gray-300">Ações</th>
        </tr>
      </thead>
      <tbody>
        {#each categories as cat}
          <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="px-4 py-3 font-medium dark:text-gray-300">{cat.name}</td>
            <td class="px-4 py-3 dark:text-gray-300">{cat.productCount}</td>
            <td class="px-4 py-3 text-right space-x-2">
              <a href="/admin/products?category={cat.name}" class="text-blue-600 dark:text-blue-400 hover:underline">Ver Produtos</a>
              <button onclick={() => { deleteTarget = cat }} class="text-red-600 hover:underline">Deletar</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
