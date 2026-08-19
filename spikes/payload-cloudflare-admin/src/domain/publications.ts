export type PublicationPreviewSource = {
  id: string | number
  title?: string | null
  messageText?: string | null
  parseMode?: 'HTML' | 'MarkdownV2' | 'plain' | null
  targetType?: 'channel' | 'chat' | 'world' | 'audience' | null
  telegramTarget?: string | null
  language?: string | null
  scheduledAt?: string | null
  attachments?: unknown[] | null
}

export function buildPublicationPreview(source: PublicationPreviewSource) {
  const text = [source.title?.trim(), source.messageText?.trim()].filter(Boolean).join('\n\n')

  return {
    publicationId: String(source.id),
    target: {
      type: source.targetType ?? 'channel',
      value: source.telegramTarget ?? null
    },
    language: source.language ?? 'ru',
    parseMode: source.parseMode ?? 'plain',
    scheduledAt: source.scheduledAt ?? null,
    text,
    attachmentCount: Array.isArray(source.attachments) ? source.attachments.length : 0,
    dryRun: true
  }
}
