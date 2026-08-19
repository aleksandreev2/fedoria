import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'

type SearchParams = Record<string, string | string[] | undefined>

type JoinValue = {
  docs?: unknown[]
  totalDocs?: number
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function joinCount(value: unknown) {
  if (!value || typeof value !== 'object') return 0
  const join = value as JoinValue
  if (typeof join.totalDocs === 'number') return join.totalDocs
  return Array.isArray(join.docs) ? join.docs.length : 0
}

function extension(filename?: string | null) {
  const value = filename?.split('.').pop()
  return value ? value.toUpperCase() : 'FILE'
}

export async function MediaLibrary({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  const user = req.user

  if (!user) {
    return <Gutter><p>Требуется вход в админку.</p></Gutter>
  }

  const mediaResult = await req.payload.find({
    collection: 'media',
    depth: 1,
    limit: 100,
    sort: '-updatedAt',
    req,
    overrideAccess: false,
  })

  const resolvedSearchParams = await Promise.resolve(searchParams) as SearchParams
  const query = (firstValue(resolvedSearchParams.q) || '').trim().toLowerCase()
  const visibility = firstValue(resolvedSearchParams.visibility) || 'all'
  const onlyUsed = firstValue(resolvedSearchParams.used) === '1'

  const filtered = mediaResult.docs.filter((media) => {
    const searchable = [media.label, media.filename, media.alt]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    const used = joinCount(media.usedByPublications) + joinCount(media.usedByEvents)

    return (
      (!query || searchable.includes(query)) &&
      (visibility === 'all' || media.visibility === visibility) &&
      (!onlyUsed || used > 0) &&
      !media.archived
    )
  })

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={user}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <div className="fedoria-page fedoria-media-library">
          <header className="fedoria-page__header">
            <div>
              <div className="fedoria-eyebrow">FILES</div>
              <h1>Файлы</h1>
              <p>Media Library поверх R2: поиск, фильтры, повторное использование и where-used.</p>
            </div>
            <div className="fedoria-header-actions">
              <a className="fedoria-button fedoria-button--ghost" href="/admin/collections/media">Обычный список</a>
              <a className="fedoria-button" href="/admin/collections/media/create">Загрузить файл</a>
            </div>
          </header>

          <form className="fedoria-media-toolbar" method="get" action="/admin/media-library">
            <label>
              <span>Поиск</span>
              <input name="q" defaultValue={firstValue(resolvedSearchParams.q) || ''} placeholder="Название, filename, alt…" />
            </label>
            <label>
              <span>Доступ</span>
              <select name="visibility" defaultValue={visibility}>
                <option value="all">Все</option>
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </label>
            <label className="fedoria-check">
              <input type="checkbox" name="used" value="1" defaultChecked={onlyUsed} />
              <span>Только используемые</span>
            </label>
            <button type="submit">Применить</button>
            <a href="/admin/media-library">Сбросить</a>
          </form>

          <div className="fedoria-library-summary">
            <strong>{filtered.length}</strong>
            <span>из {mediaResult.totalDocs} файлов в текущем срезе</span>
          </div>

          <section className="fedoria-media-grid">
            {filtered.length ? filtered.map((media) => {
              const publications = joinCount(media.usedByPublications)
              const events = joinCount(media.usedByEvents)
              const used = publications + events
              const isImage = typeof media.mimeType === 'string' && media.mimeType.startsWith('image/')
              const fileURL = typeof media.url === 'string' ? media.url : undefined

              return (
                <article className="fedoria-media-card" key={media.id}>
                  <a className="fedoria-media-card__preview" href={`/admin/collections/media/${media.id}`}>
                    {isImage && fileURL ? (
                      <span
                        className="fedoria-media-card__image"
                        style={{ backgroundImage: `url(${JSON.stringify(fileURL)})` }}
                        aria-label={media.alt || media.label || media.filename || 'Image'}
                      />
                    ) : (
                      <span className="fedoria-media-card__extension">{extension(media.filename)}</span>
                    )}
                    <span className={`fedoria-visibility fedoria-visibility--${media.visibility || 'private'}`}>
                      {media.visibility || 'private'}
                    </span>
                  </a>
                  <div className="fedoria-media-card__body">
                    <div>
                      <strong>{media.label}</strong>
                      <small>{media.filename}</small>
                    </div>
                    <div className="fedoria-usage-row">
                      <span>{media.mimeType || 'unknown'}</span>
                      <span className={used ? 'has-usage' : ''}>{used} use(s)</span>
                    </div>
                    <div className="fedoria-where-used">
                      <span>Publications <b>{publications}</b></span>
                      <span>Events <b>{events}</b></span>
                    </div>
                  </div>
                </article>
              )
            }) : (
              <div className="fedoria-empty fedoria-empty--large">
                <strong>По этим фильтрам файлов нет.</strong>
                <a href="/admin/media-library">Сбросить фильтры</a>
              </div>
            )}
          </section>
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
