import { getLandingMeta } from '#/lib/landing-content'

type SocialMetaTag =
  | { property: string; content: string }
  | { name: string; content: string }

export const DEFAULT_LANDING_URL = 'https://gestaobem.com'
export const DEFAULT_OG_IMAGE_PATH = '/og-image.png'

export type SocialMetaInput = {
  title: string
  description: string
  path?: string
  imagePath?: string
  type?: 'website' | 'article'
}

export function getLandingSiteUrl(envUrl?: string, isDev?: boolean): string {
  const url = envUrl ?? import.meta.env.VITE_LANDING_URL
  if (url) return url.replace(/\/$/, '')
  const dev = isDev ?? import.meta.env.DEV
  return dev ? 'http://localhost:3001' : DEFAULT_LANDING_URL
}

export function getAbsoluteUrl(path: string, siteUrl: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${siteUrl.replace(/\/$/, '')}${normalizedPath}`
}

export function getOgImageUrl(
  imagePath = DEFAULT_OG_IMAGE_PATH,
  siteUrl = getLandingSiteUrl(),
): string {
  return getAbsoluteUrl(imagePath, siteUrl)
}

export function buildSocialMetaTags(
  input: SocialMetaInput,
  siteUrl = getLandingSiteUrl(),
): SocialMetaTag[] {
  const path = input.path ?? '/'
  const url = getAbsoluteUrl(path, siteUrl)
  const image = getOgImageUrl(input.imagePath, siteUrl)
  const type = input.type ?? 'website'

  return [
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: getLandingMeta().title },
    { property: 'og:locale', content: 'pt_BR' },
    { property: 'og:title', content: input.title },
    { property: 'og:description', content: input.description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: input.title },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: input.title },
    { name: 'twitter:description', content: input.description },
    { name: 'twitter:image', content: image },
    { name: 'twitter:image:alt', content: input.title },
  ]
}
