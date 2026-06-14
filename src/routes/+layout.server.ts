import type { LayoutServerLoad } from './$types'

type Locale = 'pt' | 'en' | 'es'

function detectLocale(headers: Headers): Locale {
  const accept = headers.get('accept-language') || ''
  for (const part of accept.split(',')) {
    const lang = part.trim().split(';')[0].split('-')[0].toLowerCase()
    if (lang === 'en') return 'en'
    if (lang === 'es') return 'es'
    if (lang === 'pt') return 'pt'
  }
  return 'pt'
}

export const load: LayoutServerLoad = async ({ request }) => {
  const locale = detectLocale(request.headers)
  return { locale }
}
