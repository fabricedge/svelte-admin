import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import ConfirmModal from './ConfirmModal.svelte'

describe('ConfirmModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(ConfirmModal, { open: false })
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('renders title and message when open', () => {
    const { getByText } = render(ConfirmModal, {
      open: true,
      title: 'Deletar item',
      message: 'Tem certeza?',
    })
    expect(getByText('Deletar item')).toBeTruthy()
    expect(getByText('Tem certeza?')).toBeTruthy()
  })

  it('calls onConfirm when confirm button clicked', async () => {
    const onConfirm = vi.fn()
    const { getByText } = render(ConfirmModal, {
      open: true,
      title: 'Test',
      message: 'Sure?',
      confirmLabel: 'Sim',
      onConfirm,
    })
    await fireEvent.click(getByText('Sim'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn()
    const { getByText } = render(ConfirmModal, {
      open: true,
      title: 'Test',
      message: 'Sure?',
      cancelLabel: 'Não',
      onCancel,
    })
    await fireEvent.click(getByText('Não'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel on backdrop click', async () => {
    const onCancel = vi.fn()
    const { container } = render(ConfirmModal, {
      open: true,
      title: 'Test',
      message: 'Sure?',
      onCancel,
    })
    const backdrop = container.querySelector('.fixed.inset-0') as HTMLElement
    await fireEvent.click(backdrop)
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('uses danger variant styles by default', () => {
    const { getByText } = render(ConfirmModal, {
      open: true,
      title: 'Test',
      message: 'Sure?',
      confirmLabel: 'Deletar',
    })
    const btn = getByText('Deletar')
    expect(btn.className).toContain('bg-red-600')
  })

  it('uses default variant styles when specified', () => {
    const { getByText } = render(ConfirmModal, {
      open: true,
      title: 'Test',
      message: 'Sure?',
      confirmLabel: 'OK',
      variant: 'default',
    })
    const btn = getByText('OK')
    expect(btn.className).toContain('bg-black')
  })
})
