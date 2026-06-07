import { Link } from '@tanstack/react-router'

import { formatPostDate, type BlogPostMeta } from '#/lib/blog'

type BlogPostCardProps = {
  post: BlogPostMeta
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <article className="landing-blog-card">
      <p className="landing-blog-card-date">
        {formatPostDate(post.publishedAt)}
      </p>
      <h2 className="landing-blog-card-title">
        <Link
          to="/blog/$slug"
          params={{ slug: post.slug }}
          className="landing-blog-card-link"
        >
          {post.title}
        </Link>
      </h2>
      <p className="landing-blog-card-description">{post.description}</p>
      {post.tags.length > 0 ? (
        <ul className="landing-blog-tags" aria-label="Tags do artigo">
          {post.tags.map((tag) => (
            <li key={tag} className="landing-blog-tag">
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
