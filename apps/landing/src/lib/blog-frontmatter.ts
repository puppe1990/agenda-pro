import matter from 'gray-matter'

import type { BlogPostMeta, ParsedBlogPost } from '#/lib/blog'

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return []
  }

  return tags.filter((tag): tag is string => typeof tag === 'string')
}

function normalizePublishedAt(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  if (typeof value === 'string') {
    return value.slice(0, 10)
  }

  return ''
}

export function parseBlogFrontmatter(source: string): ParsedBlogPost {
  const { data, content } = matter(source.trim())

  const meta: BlogPostMeta = {
    slug: String(data.slug ?? ''),
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    publishedAt: normalizePublishedAt(data.publishedAt),
    author: String(data.author ?? ''),
    tags: normalizeTags(data.tags),
  }

  return { meta, content: content.trim() }
}
