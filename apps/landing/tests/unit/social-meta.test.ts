import { describe, expect, it } from 'vitest'

import {
  DEFAULT_LANDING_URL,
  DEFAULT_OG_IMAGE_PATH,
  buildSocialMetaTags,
  getAbsoluteUrl,
  getLandingSiteUrl,
  getOgImageUrl,
} from '../../src/lib/social-meta'

describe('social meta', () => {
  it('resolves landing site url from env, dev fallback or production default', () => {
    expect(getLandingSiteUrl('https://gestaobem.com')).toBe(
      'https://gestaobem.com',
    )
    expect(getLandingSiteUrl(undefined, true)).toBe('http://localhost:3001')
    expect(getLandingSiteUrl(undefined, false)).toBe(DEFAULT_LANDING_URL)
  })

  it('builds absolute urls without duplicate slashes', () => {
    expect(getAbsoluteUrl('/blog', 'https://gestaobem.com/')).toBe(
      'https://gestaobem.com/blog',
    )
    expect(getAbsoluteUrl('blog/post', 'https://gestaobem.com')).toBe(
      'https://gestaobem.com/blog/post',
    )
  })

  it('builds og image url from site base and default asset path', () => {
    expect(getOgImageUrl(DEFAULT_OG_IMAGE_PATH, 'https://gestaobem.com')).toBe(
      'https://gestaobem.com/og-image.png',
    )
  })

  it('includes open graph and twitter preview tags', () => {
    const tags = buildSocialMetaTags(
      {
        title: 'Gestão Bem',
        description: 'Agenda, CRM e financeiro.',
        path: '/',
      },
      'https://gestaobem.com',
    )

    expect(tags).toEqual(
      expect.arrayContaining([
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Gestão Bem' },
        { property: 'og:description', content: 'Agenda, CRM e financeiro.' },
        { property: 'og:url', content: 'https://gestaobem.com/' },
        {
          property: 'og:image',
          content: 'https://gestaobem.com/og-image.png',
        },
        { name: 'twitter:card', content: 'summary_large_image' },
        {
          name: 'twitter:image',
          content: 'https://gestaobem.com/og-image.png',
        },
      ]),
    )
  })
})
