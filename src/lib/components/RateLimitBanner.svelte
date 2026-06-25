<script lang="ts">
  import { t } from '$lib/i18n/locale.svelte'

  let { endTime }: { endTime: number } = $props()

  let remaining = $state(0)
  let timer: ReturnType<typeof setInterval> | null = null

  $effect(() => {
    const update = () => {
      const diff = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      remaining = diff
      if (diff <= 0) {
        if (timer) clearInterval(timer)
        localStorage.removeItem('rateLimitEnd')
        window.location.reload()
      }
    }
    update()
    timer = setInterval(update, 1000)
    return () => { if (timer) clearInterval(timer) }
  })
</script>

<div class="fixed top-0 left-0 right-0 z-[9999] bg-yellow-500 text-white text-center py-3 px-4 text-sm font-medium shadow-lg">
  {t('rateLimit.banner')} {remaining}s...
</div>
