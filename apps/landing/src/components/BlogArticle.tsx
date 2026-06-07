import { Link } from '@tanstack/react-router'
import type { ComponentType } from 'react'
import { ArrowLeft } from 'lucide-react'

import { formatPostDate, type BlogPostMeta } from '#/lib/blog'

type BlogArticleProps = {
  post: BlogPostMeta
  Content: ComponentType
}

export function BlogArticle({ post, Content }: BlogArticleProps) {
  return (
    <div className="landing-blog-article-wrap">
      <Link to="/blog" className="landing-blog-back">
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar ao blog
      </Link>

      <article className="landing-blog-article">
        <header className="landing-blog-article-header">
          <p className="island-kicker mb-3">Blog</p>
          <h1 className="landing-blog-article-title">{post.title}</h1>

          <div className="landing-blog-article-meta">
            <time dateTime={post.publishedAt}>
              {formatPostDate(post.publishedAt)}
            </time>
            <span aria-hidden="true" className="landing-blog-article-meta-dot">
              ·
            </span>
            <span>{post.author}</span>
          </div>

          {post.tags.length > 0 ? (
            <ul className="landing-blog-tags mt-4" aria-label="Tags do artigo">
              {post.tags.map((tag) => (
                <li key={tag} className="landing-blog-tag">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          <p className="landing-blog-article-deck">{post.description}</p>
        </header>

        <div className="landing-blog-article-body">
          <Content />
        </div>

        <footer className="landing-blog-article-footer">
          <p className="landing-blog-article-footer-text">
            Quer aplicar isso no seu negócio?
          </p>
          <Link to="/blog" className="btn-secondary px-5 py-2.5 no-underline">
            Ver mais artigos
          </Link>
        </footer>
      </article>
    </div>
  )
}
