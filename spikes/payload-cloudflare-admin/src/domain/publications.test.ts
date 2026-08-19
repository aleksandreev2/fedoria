import assert from 'node:assert/strict'
import { buildPublicationPreview } from './publications'

const preview = buildPublicationPreview({
  id: 42,
  title: 'World Boss',
  messageText: 'Leviathan appeared.',
  parseMode: 'plain',
  targetType: 'world',
  telegramTarget: 'grand-seas',
  attachments: ['asset-1', 'asset-2']
})

assert.equal(preview.publicationId, '42')
assert.equal(preview.text, 'World Boss\n\nLeviathan appeared.')
assert.equal(preview.target.type, 'world')
assert.equal(preview.attachmentCount, 2)
assert.equal(preview.dryRun, true)

const fallback = buildPublicationPreview({ id: 'abc', messageText: 'Hello' })
assert.equal(fallback.language, 'ru')
assert.equal(fallback.parseMode, 'plain')
assert.equal(fallback.text, 'Hello')

console.log('publication preview domain tests passed')
