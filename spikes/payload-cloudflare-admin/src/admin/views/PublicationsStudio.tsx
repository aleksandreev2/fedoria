import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'

import { PublicationComposer } from '../components/PublicationComposer'

const STATUS_ORDER = ['failed', 'publishing', 'scheduled', 'ready', 'draft', 'published'] as const

type SearchParams = Record<string, string | string[] | undefined>

type RelationDoc = {
  filename?: string | null
  id?: string | number
  label?: string | null
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function relationLabel(value: unknown) {
  if (!value || typeof value !== 'object') return String(value ?? '')
  const doc = value as RelationDoc
  return doc.label || doc.filename || String(doc.id ?? '')
}

function formatDate(value?: string | null) {
  if (!value) return 'Не запланировано'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function dateTimeLocal(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export async function PublicationsStudio({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  const user = req.user

  if (!user) {
    return <Gutter><p>Требуется вход в админку.</p></Gutter>
  }

  const publicationResult = await req.payload.find({
    collection: 'publications',
    depth: 1,
    draft: true,
    limit: 80,
    sort: '-updatedAt',
    req,
    overrideAccess: false,
  })

  const resolvedSearchParams = await Promise.resolve(searchParams) as SearchParams
  const selectedID = firstValue(resolvedSearchParams.publication)
  const selected = publicationResult.docs.find((doc) => String(doc.id) === selectedID) ?? publicationResult.docs[0]

  const statusCounts = new Map<string, number>()
  for (const publication of publicationResult.docs) {
    const status = publication.workflowStatus || 'draft'
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1)
  }

  const upcoming = publicationResult.docs
    .filter((publication) => publication.workflowStatus === 'scheduled' && publication.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime())
    .slice(0, 8)

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
        <div className="fedoria-page fedoria-publications-studio">
          <header className="fedoria-page__header">
            <div>
              <div className="fedoria-eyebrow">PUBLICATIONS</div>
              <h1>Публикации</h1>
              <p>Одна рабочая поверхность: очередь → composer → live preview → schedule → delivery state.</p>
            </div>
            <div className="fedoria-header-actions">
              <Link className="fedoria-button fedoria-button--ghost" href="/admin/collections/publications">Обычный список</Link>
              <Link className="fedoria-button" href="/admin/collections/publications/create">Новая публикация</Link>
            </div>
          </header>

          <section className="fedoria-stat-row" aria-label="Publication status summary">
            {STATUS_ORDER.map((status) => (
              <Link key={status} href={`/admin/collections/publications?where[workflowStatus][equals]=${status}`} className="fedoria-stat">
                <span>{status}</span>
                <strong>{statusCounts.get(status) ?? 0}</strong>
              </Link>
            ))}
          </section>

          <div className="fedoria-studio-grid">
            <aside className="fedoria-panel fedoria-queue">
              <div className="fedoria-panel__title">
                <strong>Очередь</strong>
                <span>{publicationResult.totalDocs}</span>
              </div>
              <div className="fedoria-queue__list">
                {publicationResult.docs.length ? publicationResult.docs.map((publication) => {
                  const active = selected && String(publication.id) === String(selected.id)
                  return (
                    <Link
                      key={publication.id}
                      className={`fedoria-queue-item${active ? ' is-active' : ''}`}
                      href={`/admin/publications-studio?publication=${publication.id}`}
                    >
                      <div className="fedoria-queue-item__top">
                        <strong>{publication.title}</strong>
                        <span className={`fedoria-status fedoria-status--${publication.workflowStatus || 'draft'}`}>
                          {publication.workflowStatus || 'draft'}
                        </span>
                      </div>
                      <p>{publication.messageText || 'Без текста'}</p>
                      <small>{formatDate(publication.scheduledAt)}</small>
                    </Link>
                  )
                }) : <p className="fedoria-empty">Публикаций пока нет.</p>}
              </div>
            </aside>

            <main className="fedoria-panel fedoria-composer-preview">
              {selected ? (
                <>
                  <div className="fedoria-panel__title">
                    <div>
                      <strong>{selected.title}</strong>
                      <span>Draft composer + Telegram-shaped preview</span>
                    </div>
                    <Link href={`/admin/collections/publications/${selected.id}`}>Полная форма ↗</Link>
                  </div>
                  <PublicationComposer
                    publicationId={String(selected.id)}
                    title={selected.title}
                    messageText={selected.messageText || ''}
                    parseMode={selected.parseMode || 'plain'}
                    workflowStatus={selected.workflowStatus || 'draft'}
                    scheduledAt={dateTimeLocal(selected.scheduledAt)}
                    language={selected.language || 'ru'}
                    targetLabel={`${selected.targetType || 'channel'}${selected.telegramTarget ? ` · ${selected.telegramTarget}` : ''}`}
                    attachments={Array.isArray(selected.attachments) ? selected.attachments.map(relationLabel).filter(Boolean) : []}
                  />
                </>
              ) : (
                <div className="fedoria-empty fedoria-empty--large">
                  <strong>Нет публикации для composer.</strong>
                  <Link href="/admin/collections/publications/create">Создать первую</Link>
                </div>
              )}
            </main>

            <aside className="fedoria-panel fedoria-delivery-panel">
              <div className="fedoria-panel__title"><strong>Delivery</strong></div>
              {selected ? (
                <dl className="fedoria-key-values">
                  <div><dt>Status</dt><dd>{selected.workflowStatus}</dd></div>
                  <div><dt>Target</dt><dd>{selected.targetType}{selected.telegramTarget ? ` · ${selected.telegramTarget}` : ''}</dd></div>
                  <div><dt>Language</dt><dd>{selected.language}</dd></div>
                  <div><dt>Schedule</dt><dd>{formatDate(selected.scheduledAt)}</dd></div>
                  <div><dt>Attempts</dt><dd>{selected.attempts ?? 0}</dd></div>
                  <div><dt>Payload status</dt><dd>{selected._status || 'draft'}</dd></div>
                </dl>
              ) : <p className="fedoria-empty">Выбери публикацию.</p>}

              <div className="fedoria-calendar-mini">
                <div className="fedoria-panel__title"><strong>Scheduled</strong><span>{upcoming.length}</span></div>
                {upcoming.length ? upcoming.map((publication) => (
                  <Link key={publication.id} href={`/admin/publications-studio?publication=${publication.id}`}>
                    <time>{formatDate(publication.scheduledAt)}</time>
                    <span>{publication.title}</span>
                  </Link>
                )) : <p className="fedoria-empty">Ничего не запланировано.</p>}
              </div>
            </aside>
          </div>
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
