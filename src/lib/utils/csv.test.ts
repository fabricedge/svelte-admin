import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('exportCSV', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a CSV blob and triggers download', async () => {
    const createObjectURL = vi.fn(() => 'blob:test')
    const revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL

    const click = vi.fn()
    const anchor = { href: '', download: '', click }
    document.createElement = vi.fn((tag: string) => {
      if (tag === 'a') return anchor as unknown as HTMLAnchorElement
      return document.createElement(tag)
    })

    const { exportCSV } = await import('./csv')

    exportCSV('test', ['Name', 'Price'], [['Foo', '10'], ['Bar', '20']])

    expect(createObjectURL).toHaveBeenCalledOnce()
    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/csv;charset=utf-8;')
    const text = await blob.text()
    expect(text).toBe('Name,Price\nFoo,10\nBar,20')
    expect(anchor.download).toBe('test.csv')
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
  })

  it('escapes commas and quotes', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:esc')
    URL.revokeObjectURL = vi.fn()
    document.createElement = vi.fn(() => ({ href: '', download: '', click: vi.fn() })) as any

    const { exportCSV } = await import('./csv')
    exportCSV('esc', ['A', 'B'], [['he,llo', 'sa"id']])

    const blob = (URL.createObjectURL as any).mock.calls[0][0] as Blob
    const text = await blob.text()
    expect(text).toBe('A,B\n"he,llo","sa""id"')
  })
})
