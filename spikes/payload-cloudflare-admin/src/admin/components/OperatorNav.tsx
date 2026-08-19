import Link from 'next/link'

export function OperatorNav() {
  return (
    <div className="fedoria-operator-nav" aria-label="Fedoria operator tools">
      <div className="fedoria-operator-nav__label">Operator tools</div>
      <Link href="/admin/publications-studio">Публикации</Link>
      <Link href="/admin/media-library">Файлы</Link>
      <Link href="/admin/story-graph">Story Graph</Link>
    </div>
  )
}
