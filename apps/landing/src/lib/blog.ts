export type BlogPostMeta = {
  slug: string
  title: string
  description: string
  publishedAt: string
  author: string
  tags: string[]
}

export type ParsedBlogPost = {
  meta: BlogPostMeta
  content: string
}

export function sortPostsByDate(posts: BlogPostMeta[]): BlogPostMeta[] {
  return [...posts].sort(
    (left, right) =>
      new Date(right.publishedAt).getTime() -
      new Date(left.publishedAt).getTime(),
  )
}

export function getPostBySlug(
  posts: BlogPostMeta[],
  slug: string,
): BlogPostMeta | undefined {
  return posts.find((post) => post.slug === slug)
}

export function getLatestPosts(
  posts: BlogPostMeta[],
  limit: number,
): BlogPostMeta[] {
  return sortPostsByDate(posts).slice(0, limit)
}

export function getBlogPostPath(slug: string): `/blog/${string}` {
  return `/blog/${slug}`
}

export function formatPostDate(publishedAt: string, locale = 'pt-BR'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${publishedAt}T12:00:00.000Z`))
}

export function getBlogIndexMeta() {
  return {
    title: 'Blog | Gestão Bem',
    description:
      'Dicas de agenda, atendimento e gestão para salões, clínicas e consultórios.',
    heading: 'Blog Gestão Bem',
    lead: 'Conteúdo prático para organizar agenda, clientes e financeiro no dia a dia do seu negócio.',
  }
}
