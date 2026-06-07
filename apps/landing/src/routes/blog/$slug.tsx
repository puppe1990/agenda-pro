import { createFileRoute, notFound } from '@tanstack/react-router'

import { BlogArticle } from '#/components/BlogArticle'
import { BlogChrome } from '#/components/BlogChrome'
import { getAllBlogPosts, getBlogPostModule } from '#/lib/blog-posts'
import { buildSocialMetaTags } from '#/lib/social-meta'

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const module = getBlogPostModule(params.slug)
    if (!module) {
      throw notFound()
    }

    return { post: module.meta }
  },
  component: BlogPostPage,
  head: ({ loaderData }) => {
    const post = loaderData?.post
    if (!post) {
      return { meta: [{ title: 'Artigo não encontrado' }] }
    }

    const title = `${post.title} | Gestão Bem`

    return {
      meta: [
        { title },
        { name: 'description', content: post.description },
        ...buildSocialMetaTags({
          title,
          description: post.description,
          path: `/blog/${post.slug}`,
          type: 'article',
        }),
      ],
    }
  },
})

function BlogPostPage() {
  const { post } = Route.useLoaderData()
  const module = getBlogPostModule(post.slug)

  if (!module) {
    throw notFound()
  }

  const Content = module.default

  return (
    <BlogChrome>
      <BlogArticle post={post} Content={Content} />
    </BlogChrome>
  )
}

export function getBlogStaticSlugs(): string[] {
  return getAllBlogPosts().map((post) => post.slug)
}
