import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { Edge } from '@xyflow/react'
import type { AdminViewServerProps } from 'payload'

import { StoryGraphCanvas, type StoryGraphNode } from '../client/StoryGraphCanvas'

type RelationDoc = {
  id?: string | number
  key?: string | null
  name?: string | null
  title?: string | null
}

function relationID(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (!value || typeof value !== 'object') return null
  const id = (value as RelationDoc).id
  return id === undefined || id === null ? null : String(id)
}

function relationName(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (!value || typeof value !== 'object') return '—'
  const doc = value as RelationDoc
  return doc.name || doc.title || doc.key || String(doc.id ?? '—')
}

const KIND_COLUMNS: Record<string, number> = {
  systemic: 0,
  social: 1,
  story: 2,
  rare: 3,
  boss: 4,
}

export async function StoryGraph({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  const user = req.user

  if (!user) {
    return <Gutter><p>Требуется вход в админку.</p></Gutter>
  }

  const result = await req.payload.find({
    collection: 'events',
    depth: 1,
    draft: true,
    limit: 200,
    sort: 'title',
    req,
    overrideAccess: false,
  })

  const rowByColumn = new Map<number, number>()
  const nodes: StoryGraphNode[] = result.docs.map((event) => {
    const column = KIND_COLUMNS[event.kind || 'systemic'] ?? 0
    const row = rowByColumn.get(column) ?? 0
    rowByColumn.set(column, row + 1)

    return {
      id: String(event.id),
      type: 'storyEvent',
      position: { x: column * 330, y: row * 190 },
      data: {
        editHref: `/admin/collections/events/${event.id}`,
        kind: event.kind || 'systemic',
        label: event.title,
        meta: `${relationName(event.world)} · ${relationName(event.region)} · weight ${event.weight}`,
        status: event._status || 'draft',
      },
    }
  })

  const existingIDs = new Set(nodes.map((node) => node.id))
  const edges: Edge[] = []

  for (const event of result.docs) {
    for (const choice of event.choices || []) {
      const target = relationID(choice.followUp)
      if (!target || !existingIDs.has(target)) continue
      edges.push({
        id: `${event.id}:${choice.key}:${target}`,
        source: String(event.id),
        target,
        label: choice.label,
        type: 'smoothstep',
      })
    }
  }

  const orphanCount = nodes.filter((node) => !edges.some((edge) => edge.source === node.id || edge.target === node.id)).length

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
        <div className="fedoria-page fedoria-story-page">
          <header className="fedoria-page__header">
            <div>
              <div className="fedoria-eyebrow">NARRATIVE</div>
              <h1>Story Graph</h1>
              <p>Read-only карта связей. Форма Event остаётся источником истины; граф нужен для навигации и поиска дыр.</p>
            </div>
            <div className="fedoria-header-actions">
              <a className="fedoria-button fedoria-button--ghost" href="/admin/collections/events">Обычный список</a>
              <a className="fedoria-button" href="/admin/collections/events/create">Новый Event</a>
            </div>
          </header>

          <section className="fedoria-stat-row fedoria-stat-row--compact">
            <div className="fedoria-stat"><span>events</span><strong>{nodes.length}</strong></div>
            <div className="fedoria-stat"><span>edges</span><strong>{edges.length}</strong></div>
            <div className="fedoria-stat"><span>orphans</span><strong>{orphanCount}</strong></div>
            <div className="fedoria-stat"><span>limit</span><strong>200</strong></div>
          </section>

          {nodes.length ? (
            <StoryGraphCanvas nodes={nodes} edges={edges} />
          ) : (
            <div className="fedoria-empty fedoria-empty--large">
              <strong>Событий пока нет.</strong>
              <a href="/admin/collections/events/create">Создать первый Event</a>
            </div>
          )}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
