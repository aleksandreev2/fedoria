import type { CollectionConfig } from 'payload'
import { buildPublicationPreview } from '@/domain/publications'

export const Publications: CollectionConfig = {
  slug: 'publications',
  admin: {
    group: 'Publications',
    useAsTitle: 'title',
    description: 'Operator workflow: draft -> ready -> scheduled/publishing -> published, with failed/retry metadata.',
    defaultColumns: ['title', 'workflowStatus', 'targetType', 'scheduledAt', '_status', 'updatedAt']
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'workflowStatus',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: ['draft', 'ready', 'scheduled', 'publishing', 'published', 'failed']
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Message',
          fields: [
            { name: 'messageText', type: 'textarea', required: true },
            {
              name: 'parseMode',
              type: 'select',
              required: true,
              defaultValue: 'plain',
              options: [
                { label: 'Plain', value: 'plain' },
                { label: 'HTML', value: 'HTML' },
                { label: 'MarkdownV2', value: 'MarkdownV2' }
              ]
            },
            { name: 'attachments', type: 'upload', relationTo: 'media', hasMany: true }
          ]
        },
        {
          label: 'Targeting',
          fields: [
            {
              name: 'targetType',
              type: 'select',
              required: true,
              defaultValue: 'channel',
              options: ['channel', 'chat', 'world', 'audience']
            },
            {
              name: 'telegramTarget',
              type: 'text',
              admin: { description: 'Human-readable target for the spike. Production will resolve opaque IDs server-side.' }
            },
            { name: 'world', type: 'relationship', relationTo: 'worlds' },
            { name: 'language', type: 'text', required: true, defaultValue: 'ru' },
            { name: 'linkedEvent', type: 'relationship', relationTo: 'events' }
          ]
        },
        {
          label: 'Schedule & Delivery',
          fields: [
            {
              name: 'scheduledAt',
              type: 'date',
              admin: { date: { pickerAppearance: 'dayAndTime' } }
            },
            {
              name: 'idempotencyKey',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              admin: { readOnly: true },
              hooks: {
                beforeValidate: [({ value }) => value || crypto.randomUUID()],
                beforeDuplicate: [() => crypto.randomUUID()]
              }
            },
            { name: 'attempts', type: 'number', required: true, defaultValue: 0, min: 0 },
            { name: 'lastError', type: 'textarea' },
            {
              name: 'telegramMessageIds',
              type: 'array',
              fields: [{ name: 'value', type: 'text', required: true }]
            }
          ]
        }
      ]
    }
  ],
  endpoints: [
    {
      path: '/:id/test-preview',
      method: 'post',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'forbidden' }, { status: 403 })

        const id = req.routeParams.id as string
        const publication = await req.payload.findByID({
          collection: 'publications',
          id,
          depth: 0,
          draft: true,
          req,
          overrideAccess: false
        })

        return Response.json(buildPublicationPreview(publication))
      }
    }
  ],
  versions: {
    maxPerDoc: 50,
    drafts: { autosave: { interval: 1200 }, schedulePublish: true, validate: true }
  }
}
