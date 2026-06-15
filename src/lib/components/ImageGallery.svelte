<script lang="ts">
  import { PUBLIC_API_URL } from '$env/static/public'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'

  let { images = $bindable([] as string[]) }: { images: string[] } = $props()

  let newUrl = $state('')
  let uploading = $state(false)
  let uploadError = $state<string | null>(null)

  function getApiBase() {
    return PUBLIC_API_URL ? `${PUBLIC_API_URL}/api` : '/api'
  }

  function getToken(): string | null {
    try { return localStorage.getItem('token') } catch { return null }
  }

  function addImage() {
    const url = newUrl.trim()
    if (!url) return
    if (images.includes(url)) return
    images = [...images, url]
    newUrl = ''
  }

  async function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement
    const files = input.files
    if (!files || files.length === 0) return

    uploadError = null
    uploading = true
    const token = getToken()

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch(`${getApiBase()}/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: t('common.uploadError') }))
          const msg = err.error || t('common.uploadError')
          uploadError = msg
          toast.error(msg)
          continue
        }

        const data = await res.json()
        if (!images.includes(data.url)) {
          images = [...images, data.url]
        }
        toast.success(t('common.imageUploaded'))
      } catch {
        const msg = t('common.connectionError')
        uploadError = msg
        toast.error(msg)
      }
    }

    uploading = false
    input.value = ''
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
  {#if uploadError}
    <div class="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">{uploadError}</div>
  {/if}

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
                title={t('common.moveLeft')}
              >←</button>
            {/if}
            {#if i < images.length - 1}
              <button
                onclick={() => moveImage(i, i + 1)}
                class="p-1.5 bg-white/90 rounded text-xs hover:bg-white"
                title={t('common.moveRight')}
              >→</button>
            {/if}
            <button
              onclick={() => removeImage(i)}
              class="p-1.5 bg-red-500/90 rounded text-xs text-white hover:bg-red-600"
              title={t('common.remove')}
            >✕</button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-sm text-gray-400">
      {t('common.noImages')}
    </div>
  {/if}

  <div class="flex items-center gap-2">
    <label
      for="file-upload"
      class="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
    >
      {#if uploading}
        <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {t('common.uploading')}
      {:else}
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {t('common.upload')}
      {/if}
      <input
        id="file-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={uploading}
        onchange={handleFileUpload}
        class="hidden"
      />
    </label>

    <span class="text-xs text-gray-400">{t('common.orPasteUrl')}</span>

    <input
      type="text"
      bind:value={newUrl}
      onkeydown={handleKeydown}
      placeholder={t('common.imageUrlPlaceholder')}
      class="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md text-sm"
    />
    <button
      onclick={addImage}
      disabled={!newUrl.trim()}
      class="px-4 py-2 bg-gray-800 text-white rounded-md text-sm disabled:opacity-50"
    >
      {t('common.add')}
    </button>
  </div>
</div>
