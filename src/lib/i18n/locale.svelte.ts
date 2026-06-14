import { translations } from './translations'
import type { Locale } from './translations'

let current = $state<Locale>(getInitialLocale())

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem('locale')
    if (stored === 'pt' || stored === 'en' || stored === 'es') return stored
  } catch {}
  try {
    const lang = navigator.language?.split('-')[0]
    if (lang === 'en' || lang === 'es' || lang === 'pt') return lang
  } catch {}
  return 'pt'
}

export function setLocale(locale: Locale) {
  current = locale
  try {
    localStorage.setItem('locale', locale)
    document.documentElement.lang = locale
  } catch {}
}

export function getLocale(): Locale {
  return current
}

export function t(path: string, vars?: Record<string, string | number>): string {
  const keys = path.split('.')
  let value: any = translations[current]
  for (const key of keys) {
    if (value == null) return path
    value = value[key]
  }
  if (value == null) return path
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      value = (value as string).replace(`{${k}}`, String(v))
    })
  }
  return value as string
}
