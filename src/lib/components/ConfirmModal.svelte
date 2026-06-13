<script lang="ts">
  let { open = false, title = 'Confirmar', message = '', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', variant = 'danger', onConfirm, onCancel }: {
    open?: boolean
    title?: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'default'
    onConfirm?: () => void
    onCancel?: () => void
  } = $props()

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onCancel?.()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center" onclick={onCancel}>
    <div class="absolute inset-0 bg-black/40"></div>
    <div
      class="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-sm w-full mx-4 p-6"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <h3 class="text-lg font-bold mb-2 dark:text-gray-100">{title}</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>
      <div class="flex justify-end gap-3">
        <button
          onclick={onCancel}
          class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300"
        >
          {cancelLabel}
        </button>
        <button
          onclick={onConfirm}
          class="px-4 py-2 text-sm text-white rounded-md {variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-800'}"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}
