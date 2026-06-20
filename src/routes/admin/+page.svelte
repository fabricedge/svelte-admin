<script lang="ts">
  import { page } from '$app/state'
  import { getStoreContext } from '$lib/stores/store-context.svelte'
  import { goto } from '$app/navigation'

  const ctx = getStoreContext()

  $effect(() => {
    if (!ctx.loading && ctx.currentStore) {
      goto(`/admin/${ctx.currentStore.slug}/stores`, { replaceState: true })
    }
  })
</script>

<div class="flex items-center justify-center min-h-48">
  <p class="text-gray-500">Redirecionando...</p>
</div>
