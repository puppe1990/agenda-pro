export function PageHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-[var(--sea-ink)]">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{description}</p>
      )}
    </div>
  )
}
