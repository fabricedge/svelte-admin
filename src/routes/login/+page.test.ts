import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor, cleanup } from '@testing-library/svelte'

vi.mock('$lib/api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
}))

const mockToast = { success: vi.fn(), error: vi.fn() }
vi.mock('svelte-sonner', () => ({ toast: mockToast }))

vi.mock('$lib/i18n/locale.svelte', () => ({
  t: (path: string) => {
    const map: Record<string, string> = {
      'auth.back': 'Voltar',
      'auth.loginTitle': 'Fazer Login',
      'auth.loginDesc': 'Acesse sua conta',
      'auth.registerTitle': 'Cadastro',
      'auth.registerDesc': 'Cadastre-se como administrador',
      'auth.email': 'Email',
      'auth.password': 'Senha',
      'auth.name': 'Nome',
      'auth.namePlaceholder': 'Seu nome',
      'auth.signIn': 'Entrar',
      'auth.createAccount': 'Criar Conta',
      'auth.loading': 'Carregando...',
      'auth.successLogin': 'Login realizado!',
      'auth.successRegister': 'Conta criada!',
      'auth.error': 'Erro ao autenticar',
      'auth.noAccount': 'Não tem conta?',
      'auth.hasAccount': 'Já tem conta?',
      'auth.doRegister': 'Cadastre-se',
      'auth.doLogin': 'Faça login',
      'auth.adminRoleHint': 'Sua conta será criada como administrador.',
    }
    return map[path] || path
  },
}))

let authModule: any
let mockLocation: { href: string }

beforeEach(async () => {
  authModule = await import('$lib/api/auth')
  vi.clearAllMocks()
  mockLocation = { href: '' }
  Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
  })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

async function renderPage() {
  const mod = await import('./+page.svelte')
  return render(mod.default)
}

describe('Login Page', () => {
  it('renders login form by default', async () => {
    const { findByText } = await renderPage()
    expect(await findByText('Entrar')).toBeTruthy()
    expect(await findByText('Acesse sua conta')).toBeTruthy()
  })

  it('shows email and password fields', async () => {
    const { findByText } = await renderPage()
    expect(await findByText('Email')).toBeTruthy()
    expect(await findByText('Senha')).toBeTruthy()
  })

  it('does not show name field by default', async () => {
    const { queryByText } = await renderPage()
    expect(queryByText('Nome')).toBeNull()
  })

  it('shows register link', async () => {
    const { findByText } = await renderPage()
    expect(await findByText('Cadastre-se')).toBeTruthy()
  })

  it('toggles to register form', async () => {
    const { findByText } = await renderPage()
    await fireEvent.click(await findByText('Cadastre-se'))
    expect(await findByText('Criar Conta')).toBeTruthy()
  })

  it('shows name field in register form', async () => {
    const { findByText } = await renderPage()
    await fireEvent.click(await findByText('Cadastre-se'))
    expect(await findByText('Nome')).toBeTruthy()
  })

  it('shows admin role hint in register form', async () => {
    const { findByText } = await renderPage()
    await fireEvent.click(await findByText('Cadastre-se'))
    expect(await findByText('Sua conta será criada como administrador.')).toBeTruthy()
  })

  it('toggles back to login form', async () => {
    const { findByText } = await renderPage()
    await fireEvent.click(await findByText('Cadastre-se'))
    expect(await findByText('Criar Conta')).toBeTruthy()
    await fireEvent.click(await findByText('Faça login'))
    expect(await findByText('Entrar')).toBeTruthy()
  })

  it('calls login on form submit', async () => {
    authModule.login.mockResolvedValue({ token: 'abc' })
    const { container, findByText } = await renderPage()
    const emailInput = container.querySelector('input[type="email"]') as HTMLElement
    const passwordInput = container.querySelector('input[type="password"]') as HTMLElement
    await fireEvent.input(emailInput, { target: { value: 'admin@test.com' } })
    await fireEvent.input(passwordInput, { target: { value: '123456' } })
    await fireEvent.click(await findByText('Entrar'))
    await waitFor(() => expect(authModule.login).toHaveBeenCalledWith('admin@test.com', '123456'))
  })

  it('shows success toast on login', async () => {
    authModule.login.mockResolvedValue({ token: 'abc' })
    const { container, findByText } = await renderPage()
    const emailInput = container.querySelector('input[type="email"]') as HTMLElement
    const passwordInput = container.querySelector('input[type="password"]') as HTMLElement
    await fireEvent.input(emailInput, { target: { value: 'admin@test.com' } })
    await fireEvent.input(passwordInput, { target: { value: '123456' } })
    await fireEvent.click(await findByText('Entrar'))
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith('Login realizado!'))
  })

  it('navigates to /admin on successful login', async () => {
    authModule.login.mockResolvedValue({ token: 'abc' })
    const { container, findByText } = await renderPage()
    const emailInput = container.querySelector('input[type="email"]') as HTMLElement
    const passwordInput = container.querySelector('input[type="password"]') as HTMLElement
    await fireEvent.input(emailInput, { target: { value: 'admin@test.com' } })
    await fireEvent.input(passwordInput, { target: { value: '123456' } })
    await fireEvent.click(await findByText('Entrar'))
    await waitFor(() => expect(mockLocation.href).toBe('/admin'))
  })

  it('calls register on register form submit', async () => {
    authModule.register.mockResolvedValue({ token: 'abc' })
    const { container, findByText } = await renderPage()
    await fireEvent.click(await findByText('Cadastre-se'))
    const nameInput = container.querySelector('input[type="text"]') as HTMLElement
    const emailInput = container.querySelector('input[type="email"]') as HTMLElement
    const passwordInput = container.querySelector('input[type="password"]') as HTMLElement
    await fireEvent.input(nameInput, { target: { value: 'Admin' } })
    await fireEvent.input(emailInput, { target: { value: 'admin@test.com' } })
    await fireEvent.input(passwordInput, { target: { value: '123456' } })
    await fireEvent.click(await findByText('Criar Conta'))
    await waitFor(() => expect(authModule.register).toHaveBeenCalledWith('Admin', 'admin@test.com', '123456'))
  })

  it('shows success toast on register', async () => {
    authModule.register.mockResolvedValue({ token: 'abc' })
    const { container, findByText } = await renderPage()
    await fireEvent.click(await findByText('Cadastre-se'))
    const nameInput = container.querySelector('input[type="text"]') as HTMLElement
    const emailInput = container.querySelector('input[type="email"]') as HTMLElement
    const passwordInput = container.querySelector('input[type="password"]') as HTMLElement
    await fireEvent.input(nameInput, { target: { value: 'Admin' } })
    await fireEvent.input(emailInput, { target: { value: 'admin@test.com' } })
    await fireEvent.input(passwordInput, { target: { value: '123456' } })
    await fireEvent.click(await findByText('Criar Conta'))
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith('Conta criada!'))
  })

  it('shows error toast on login failure', async () => {
    authModule.login.mockRejectedValue(new Error('Credenciais inválidas'))
    const { container, findByText } = await renderPage()
    const emailInput = container.querySelector('input[type="email"]') as HTMLElement
    const passwordInput = container.querySelector('input[type="password"]') as HTMLElement
    await fireEvent.input(emailInput, { target: { value: 'admin@test.com' } })
    await fireEvent.input(passwordInput, { target: { value: 'wrong' } })
    await fireEvent.click(await findByText('Entrar'))
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Credenciais inválidas'))
  })

  it('shows generic error toast when no message', async () => {
    authModule.login.mockRejectedValue(new Error())
    const { container, findByText } = await renderPage()
    const emailInput = container.querySelector('input[type="email"]') as HTMLElement
    const passwordInput = container.querySelector('input[type="password"]') as HTMLElement
    await fireEvent.input(emailInput, { target: { value: 'admin@test.com' } })
    await fireEvent.input(passwordInput, { target: { value: 'wrong' } })
    await fireEvent.click(await findByText('Entrar'))
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Erro ao autenticar'))
  })

  it('disables submit button while loading', async () => {
    authModule.login.mockReturnValue(new Promise(() => {}))
    const { container, findByText } = await renderPage()
    const emailInput = container.querySelector('input[type="email"]') as HTMLElement
    const passwordInput = container.querySelector('input[type="password"]') as HTMLElement
    await fireEvent.input(emailInput, { target: { value: 'admin@test.com' } })
    await fireEvent.input(passwordInput, { target: { value: '123456' } })
    await fireEvent.click(await findByText('Entrar'))
    await waitFor(() => {
      const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement
      expect(submitBtn.disabled).toBe(true)
    })
  })

  it('shows loading text on button while submitting', async () => {
    authModule.login.mockReturnValue(new Promise(() => {}))
    const { container, findByText } = await renderPage()
    const emailInput = container.querySelector('input[type="email"]') as HTMLElement
    const passwordInput = container.querySelector('input[type="password"]') as HTMLElement
    await fireEvent.input(emailInput, { target: { value: 'admin@test.com' } })
    await fireEvent.input(passwordInput, { target: { value: '123456' } })
    await fireEvent.click(await findByText('Entrar'))
    expect(await findByText('Carregando...')).toBeTruthy()
  })

  it('shows back link', async () => {
    const { findByText } = await renderPage()
    expect(await findByText('← Voltar')).toBeTruthy()
  })
})
