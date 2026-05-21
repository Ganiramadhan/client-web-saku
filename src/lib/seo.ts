import { useEffect } from 'react'

export interface SEOOptions {
  title: string
  description?: string
  canonical?: string
  image?: string
  noIndex?: boolean
}

const DEFAULT_DESCRIPTION =
  'SAKU membantu mencatat transaksi, scan struk, mengelola dompet, tagihan, budget, dan target finansial dengan bantuan AI.'

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    document.head.appendChild(el)
  }
  Object.entries(attrs).forEach(([key, value]) => el?.setAttribute(key, value))
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  image = '/logo.png',
  noIndex,
}: SEOOptions) {
  useEffect(() => {
    const fullTitle = title.includes('SAKU') ? title : `${title} | SAKU`
    document.title = fullTitle

    upsertMeta('meta[name="description"]', { name: 'description', content: description })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image })
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: noIndex ? 'noindex,nofollow' : 'index,follow',
    })
    if (canonical) upsertLink('canonical', canonical)
  }, [canonical, description, image, noIndex, title])
}
