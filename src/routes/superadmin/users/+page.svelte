<script lang="ts">
  import { onMount } from 'svelte'
  import { getAdmins, updateStorePermission } from '$lib/api/users'
  import { getStoreContext } from '$lib/stores/store-context.svelte'
  import { toast } from 'svelte-sonner'
  import { t } from '$lib/i18n/locale.svelte'

  const ctx = getStoreContext()

  let users = $state<any[]>([])
  let loading = $state(true)
  let toggling = $state<string | null>(null)

  onMount(async () => {
    try {
      const data = await getAdmins()
      users = data.users || []
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      loading = false
    }
  })

  async function togglePermission(userId: string) {
    toggling = userId
    try {
      const user = users.find((u) => u.id === userId)
      if (!user) return
      const result = await updateStorePermission(userId, !user.canCreateStores)
      users = users.map((u) => u.id === userId ? { ...u, canCreateStores: result.canCreateStores } : u)
      toast.success(t('superadmin.usersPage.permissionUpdated'))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      toggling = null
    }
  }
</script>

<h1 class="text-2xl font-bold mb-6">{t('superadmin.usersPage.title')}</h1>

<p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
  {t('superadmin.usersPage.description')}
</p>

{#if loading}
  <div class="space-y-3">
    {#each [1,2,3] as _}
      <div class="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
    {/each}
  </div>
{:else}
  <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 dark:bg-gray-900 text-left">
        <tr>
          <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('superadmin.usersPage.table.email')}</th>
          <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('superadmin.usersPage.table.name')}</th>
          <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('superadmin.usersPage.table.type')}</th>
          <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('superadmin.usersPage.table.canCreate')}</th>
          <th class="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{t('superadmin.usersPage.table.stores')}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
        {#each users as user}
          <tr class="hover:bg-gray-50 dark:hover:bg-gray-900/50">
            <td class="px-4 py-3">{user.email}</td>
            <td class="px-4 py-3 text-gray-500">{user.name || '-'}</td>
            <td class="px-4 py-3">
              {#if user.role === 'SUPER_ADMIN'}
                <span class="rounded bg-purple-100 dark:bg-purple-900 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">{t('superadmin.usersPage.superAdminBadge')}</span>
              {:else}
                <span class="text-gray-600 dark:text-gray-400">{t('superadmin.usersPage.admin')}</span>
              {/if}
            </td>
            <td class="px-4 py-3">
              {#if user.role === 'SUPER_ADMIN'}
                <span class="text-xs text-gray-400">—</span>
              {:else if user.multiStoreEnabled}
                <button
                  onclick={() => togglePermission(user.id)}
                  disabled={toggling === user.id}
                  class="relative h-5 w-9 rounded-full transition-colors disabled:opacity-50"
                  class:bg-black={user.canCreateStores}
                  class:bg-gray-300={!user.canCreateStores}
                >
                  <span
                    class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
                    class:translate-x-4={user.canCreateStores}
                  />
                </button>
              {:else}
                <span class="text-xs text-gray-400">{t('superadmin.usersPage.multiStoreInactive')}</span>
              {/if}
            </td>
            <td class="px-4 py-3 text-gray-500">{user.storeCount}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
