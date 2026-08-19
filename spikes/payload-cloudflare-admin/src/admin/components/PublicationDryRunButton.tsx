'use client'

import { useState } from 'react'

export function PublicationDryRunButton({ publicationId }: { publicationId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function runPreview() {
    setState('loading')
    setMessage('')

    try {
      const response = await fetch(`/api/publications/${publicationId}/test-preview`, {
        method: 'POST',
        credentials: 'same-origin',
      })
      const body = (await response.json()) as {
        attachmentCount?: number
        dryRun?: boolean
        error?: string
        target?: { type?: string }
      }

      if (!response.ok || body.dryRun !== true) {
        throw new Error(body.error || `HTTP ${response.status}`)
      }

      setState('ok')
      setMessage(`OK · ${body.target?.type ?? 'target'} · ${body.attachmentCount ?? 0} attachment(s)`)
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'Preview failed')
    }
  }

  return (
    <div className="fedoria-dry-run">
      <button type="button" onClick={runPreview} disabled={state === 'loading'}>
        {state === 'loading' ? 'Проверяю…' : 'Test preview'}
      </button>
      {message ? <span data-state={state}>{message}</span> : null}
    </div>
  )
}
