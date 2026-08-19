'use client'

import { useMemo, useState } from 'react'
import { PublicationDryRunButton } from './PublicationDryRunButton'

type Props = {
  attachments: string[]
  language: string
  messageText: string
  parseMode: 'HTML' | 'MarkdownV2' | 'plain'
  publicationId: string
  scheduledAt: string
  targetLabel: string
  title: string
  workflowStatus: string
}

export function PublicationComposer(props: Props) {
  const [title, setTitle] = useState(props.title)
  const [messageText, setMessageText] = useState(props.messageText)
  const [parseMode, setParseMode] = useState<Props['parseMode']>(props.parseMode)
  const [workflowStatus, setWorkflowStatus] = useState(props.workflowStatus)
  const [scheduledAt, setScheduledAt] = useState(props.scheduledAt)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveMessage, setSaveMessage] = useState('')

  const previewText = useMemo(
    () => [title.trim(), messageText.trim()].filter(Boolean).join('\n\n'),
    [messageText, title],
  )

  async function saveDraft() {
    setSaveState('saving')
    setSaveMessage('')

    try {
      const response = await fetch(`/api/publications/${props.publicationId}?draft=true`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          messageText,
          parseMode,
          workflowStatus,
          scheduledAt: scheduledAt || null,
        }),
      })

      if (!response.ok) {
        const body = (await response.json().catch((): null => null)) as { message?: string } | null
        throw new Error(body?.message || `HTTP ${response.status}`)
      }

      setSaveState('saved')
      setSaveMessage('Draft saved')
    } catch (error) {
      setSaveState('error')
      setSaveMessage(error instanceof Error ? error.message : 'Save failed')
    }
  }

  return (
    <div className="fedoria-inline-composer">
      <div className="fedoria-inline-composer__form">
        <label>
          <span>Заголовок</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          <span>Сообщение</span>
          <textarea value={messageText} onChange={(event) => setMessageText(event.target.value)} rows={12} />
        </label>
        <div className="fedoria-inline-composer__row">
          <label>
            <span>Parse mode</span>
            <select value={parseMode} onChange={(event) => setParseMode(event.target.value as Props['parseMode'])}>
              <option value="plain">Plain</option>
              <option value="HTML">HTML</option>
              <option value="MarkdownV2">MarkdownV2</option>
            </select>
          </label>
          <label>
            <span>Workflow</span>
            <select value={workflowStatus} onChange={(event) => setWorkflowStatus(event.target.value)}>
              <option value="draft">draft</option>
              <option value="ready">ready</option>
              <option value="scheduled">scheduled</option>
              <option value="publishing">publishing</option>
              <option value="published">published</option>
              <option value="failed">failed</option>
            </select>
          </label>
        </div>
        <label>
          <span>Schedule</span>
          <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
        </label>
        <div className="fedoria-composer-actions">
          <button type="button" className="fedoria-button" onClick={saveDraft} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? 'Сохраняю…' : 'Save draft'}
          </button>
          <PublicationDryRunButton publicationId={props.publicationId} />
          {saveMessage ? <span className="fedoria-save-state" data-state={saveState}>{saveMessage}</span> : null}
        </div>
      </div>

      <div className="fedoria-inline-composer__preview">
        <div className="fedoria-phone-shell">
          <div className="fedoria-phone-shell__topbar">Fedoria · preview</div>
          <article className="fedoria-message-bubble">
            <div className="fedoria-message-bubble__brand">FEDORIA</div>
            <div className="fedoria-message-bubble__text">{previewText || 'Пустое сообщение'}</div>
            {props.attachments.length ? (
              <div className="fedoria-attachment-list">
                {props.attachments.map((attachment, index) => <span key={`${attachment}-${index}`}>{attachment}</span>)}
              </div>
            ) : null}
            <div className="fedoria-message-bubble__meta">
              {parseMode} · {props.attachments.length} file(s) · {props.language}
            </div>
          </article>
        </div>
        <div className="fedoria-preview-target">Target: {props.targetLabel}</div>
      </div>
    </div>
  )
}
