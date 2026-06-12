<script lang="ts">
  import { login } from '$lib/api/auth'
  import { toast } from 'svelte-sonner'

  let email = $state('')
  let password = $state('')
  let loading = $state(false)

  async function handleSubmit(e: Event) {
    e.preventDefault()
    loading = true
    try {
      await login(email, password)
      toast.success('Login realizado')
      window.location.href = '/admin'
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer login')
    } finally {
      loading = false
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="w-full max-w-sm mx-4">
    <h1 class="text-2xl font-bold text-center mb-8">Admin Login</h1>
    <form onsubmit={handleSubmit} class="bg-white p-8 rounded-lg shadow-sm border border-gray-200 space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" bind:value={email} required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
        <input type="password" bind:value={password} required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>
      <button type="submit" disabled={loading} class="w-full py-2 px-4 bg-black text-white rounded-md text-sm font-medium disabled:opacity-50">
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  </div>
</div>
