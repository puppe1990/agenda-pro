import { createFileRoute } from '@tanstack/react-router'

import { BlogChrome } from '#/components/BlogChrome'
import { BlogPostCard } from '#/components/BlogPostCard'
import { getBlogIndexMeta } from '#/lib/blog'
import { buildSocialMetaTags } from '#/lib/social-meta'
import { getAllBlogPosts } from '#/lib/blog-posts'

export const Route = createFileRoute('/blog/')({
  component: BlogIndexPage,
  head: () => {
    const meta = getBlogIndexMeta()
    return {
      meta: [
        { title: meta.title },
        { name: 'description', content: meta.description },
        ...buildSocialMetaTags({
          title: meta.title,
          description: meta.description,
          path: '/blog',
        }),
      ],
    }
  },
})

function BlogIndexPage() {
  const meta = getBlogIndexMeta()
  const posts = getAllBlogPosts()

  return (
    <BlogChrome>
      <section className="landing-section pt-2">
        <p className="island-kicker mb-3">Conteúdo</p>
        <h1 className="landing-section-title">{meta.heading}</h1>
        <p className="landing-section-lead">{meta.lead}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </BlogChrome>
  )
}
