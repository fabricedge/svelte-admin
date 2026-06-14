<script lang="ts">
  import { getLocale, setLocale } from './locale.svelte'
  import type { Locale } from './translations'

  const locales: Locale[] = ['pt', 'en', 'es']

  function handleClick(locale: Locale) {
    setLocale(locale)
  }
</script>

<div class="flex items-center gap-0.5 rounded-md border border-gray-300 dark:border-gray-600 p-0.5 text-xs">
  {#each locales as locale}
    <button
      onclick={() => handleClick(locale)}
      class="rounded px-1.5 py-0.5 font-medium transition-colors cursor-pointer uppercase {getLocale() === locale ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}"
    >
      {locale}
    </button>
  {/each}
</div>
