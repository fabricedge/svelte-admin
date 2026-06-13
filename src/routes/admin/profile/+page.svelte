<script lang="ts">
  import { updateProfile } from '$lib/api/settings'
  import { toast } from 'svelte-sonner'

  let name = $state('')
  let currentPassword = $state('')
  let newPassword = $state('')
  let saving = $state(false)

  async function handleSubmit(e: Event) {
    e.preventDefault()
    saving = true
    try {
      const data: any = {}
      if (name) data.name = name
      if (currentPassword && newPassword) {
        data.currentPassword = currentPassword
        data.newPassword = newPassword
      }
      if (Object.keys(data).length === 0) {
        toast.error('Preencha pelo menos um campo')
        return
      }
      const result = await updateProfile(data)
      toast.success('Perfil atualizado')
      currentPassword = ''
      newPassword = ''
      if (result.user?.name) name = result.user.name
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      saving = false
    }
  }
</script>

<h1 class="text-2xl font-bold mb-6">Meu Perfil</h1>

<form onsubmit={handleSubmit} class="max-w-lg space-y-5">
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
    <input type="text" bind:value={name} placeholder="Seu nome" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
  </div>

  <div class="pt-4 border-t border-gray-200">
    <h2 class="font-bold text-sm mb-3">Alterar senha</h2>
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
        <input type="password" bind:value={currentPassword} placeholder="••••••••" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
        <input type="password" bind:value={newPassword} placeholder="••••••••" minlength="6" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
    </div>
  </div>

  <button type="submit" disabled={saving} class="px-6 py-2.5 bg-black text-white rounded-md text-sm disabled:opacity-50">
    {saving ? 'Salvando...' : 'Salvar'}
  </button>
</form>
