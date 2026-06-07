import { type LucideIcon } from 'lucide-react'

export function PageHeader({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description?: string
  icon?: LucideIcon
}) {
  return (
    <header className="mb-6 border-b border-[var(--line)] pb-5">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="page-header-icon">
            <Icon size={18} />
          </span>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-subtitle">{description}</p>}
        </div>
      </div>
    </header>
  )
}
