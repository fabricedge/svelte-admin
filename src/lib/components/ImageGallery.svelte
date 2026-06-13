<script lang="ts">
  let { images = $bindable([] as string[]) }: { images: string[] } = $props()

  let newUrl = $state('')

  function addImage() {
    const url = newUrl.trim()
    if (!url) return
    if (images.includes(url)) return
    images = [...images, url]
    newUrl = ''
  }

  function removeImage(index: number) {
    images = images.filter((_, i) => i !== index)
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= images.length) return
    const arr = [...images];
    [arr[from], arr[to]] = [arr[to], arr[from]]
    images = arr
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addImage()
    }
  }
</script>

<div class="space-y-3">
  {#if images.length > 0}
    <div class="grid grid-cols-3 gap-3">
      {#each images as url, i (url)}
        <div class="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img src={url} alt="" class="w-full h-full object-cover" loading="lazy" />
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {#if i > 0}
              <button
                onclick={() => moveImage(i, i - 1)}
                class="p-1.5 bg-white/90 rounded text-xs hover:bg-white"
                title="Mover para esquerda"
              >←</button>
            {/if}
            {#if i < images.length - 1}
              <button
                onclick={() => moveImage(i, i + 1)}
                class="p-1.5 bg-white/90 rounded text-xs hover:bg-white"
                title="Mover para direita"
              >→</button>
            {/if}
            <button
              onclick={() => removeImage(i)}
              class="p-1.5 bg-red-500/90 rounded text-xs text-white hover:bg-red-600"
              title="Remover"
            >✕</button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-sm text-gray-400">
      Nenhuma imagem adicionada
    </div>
  {/if}

  <div class="flex gap-2">
    <input
      type="text"
      bind:value={newUrl}
      onkeydown={handleKeydown}
      placeholder="URL da imagem..."
      class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
    />
    <button
      onclick={addImage}
      disabled={!newUrl.trim()}
      class="px-4 py-2 bg-gray-800 text-white rounded-md text-sm disabled:opacity-50"
    >
      Adicionar
    </button>
  </div>
</div>
