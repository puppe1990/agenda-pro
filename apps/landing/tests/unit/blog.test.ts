import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  getBlogIndexMeta,
  getBlogPostPath,
  getLatestPosts,
  getPostBySlug,
  sortPostsByDate,
  type BlogPostMeta,
} from '../../src/lib/blog'
import { parseBlogFrontmatter } from '../../src/lib/blog-frontmatter'

const samplePosts: BlogPostMeta[] = [
  {
    slug: 'organizar-financeiro',
    title: 'Como organizar o financeiro do salão',
    description: 'Dicas práticas para controlar receitas e despesas.',
    publishedAt: '2026-03-15',
    author: 'Equipe Gestão Bem',
    tags: ['financeiro', 'salão'],
  },
  {
    slug: 'reduzir-faltas',
    title: '5 formas de reduzir faltas na agenda',
    description: 'Confirmações e lembretes que funcionam no dia a dia.',
    publishedAt: '2026-05-20',
    author: 'Equipe Gestão Bem',
    tags: ['agenda', 'whatsapp'],
  },
  {
    slug: 'portal-agendamento',
    title: 'Portal de agendamento para clientes',
    description: 'Deixe seus clientes marcarem horário 24h por dia.',
    publishedAt: '2026-01-10',
    author: 'Equipe Gestão Bem',
    tags: ['agenda'],
  },
]

describe('blog', () => {
  it('sorts posts by published date descending', () => {
    const sorted = sortPostsByDate(samplePosts)
    expect(sorted.map((post) => post.slug)).toEqual([
      'reduzir-faltas',
      'organizar-financeiro',
      'portal-agendamento',
    ])
  })

  it('finds a post by slug', () => {
    expect(getPostBySlug(samplePosts, 'reduzir-faltas')?.title).toContain(
      'reduzir faltas',
    )
    expect(getPostBySlug(samplePosts, 'inexistente')).toBeUndefined()
  })

  it('returns the latest posts with a limit', () => {
    expect(getLatestPosts(samplePosts, 2).map((post) => post.slug)).toEqual([
      'reduzir-faltas',
      'organizar-financeiro',
    ])
  })

  it('builds blog post paths', () => {
    expect(getBlogPostPath('reduzir-faltas')).toBe('/blog/reduzir-faltas')
  })

  it('defines blog index metadata', () => {
    expect(getBlogIndexMeta()).toMatchObject({
      title: expect.stringContaining('Blog'),
      description: expect.stringMatching(/agenda|negócio/i),
    })
  })

  it('parses yaml frontmatter from mdx source', () => {
    const source = `---
slug: reduzir-faltas
title: 5 formas de reduzir faltas na agenda
description: Confirmações e lembretes que funcionam no dia a dia.
publishedAt: 2026-05-20
author: Equipe Gestão Bem
tags:
  - agenda
  - whatsapp
---

## Introdução

Menos faltas começam com confirmação.`

    const parsed = parseBlogFrontmatter(source)
    expect(parsed.meta).toEqual({
      slug: 'reduzir-faltas',
      title: '5 formas de reduzir faltas na agenda',
      description: 'Confirmações e lembretes que funcionam no dia a dia.',
      publishedAt: '2026-05-20',
      author: 'Equipe Gestão Bem',
      tags: ['agenda', 'whatsapp'],
    })
    expect(parsed.content).toContain('## Introdução')
    expect(parsed.content).not.toContain('slug:')
  })

  it('validates frontmatter for every mdx post in content/blog', () => {
    const contentDir = join(
      fileURLToPath(new URL('../..', import.meta.url)),
      'content/blog',
    )
    const files = readdirSync(contentDir).filter((file) =>
      file.endsWith('.mdx'),
    )

    expect(files.length).toBeGreaterThanOrEqual(3)

    for (const file of files) {
      const source = readFileSync(join(contentDir, file), 'utf8')
      const { meta } = parseBlogFrontmatter(source)

      expect(meta.slug, file).toMatch(/^[a-z0-9-]+$/)
      expect(meta.title, file).not.toEqual('')
      expect(meta.description, file).not.toEqual('')
      expect(meta.publishedAt, file).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(meta.author, file).not.toEqual('')
    }
  })
})
