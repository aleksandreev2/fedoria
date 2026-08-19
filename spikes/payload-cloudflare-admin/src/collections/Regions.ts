import type { CollectionConfig } from 'payload'

export const Regions: CollectionConfig = {
  slug: 'regions',
  admin: {
    group: 'Content',
    useAsTitle: 'name',
    defaultColumns: ['name', 'world', 'key', '_status']
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'key', type: 'text', required: true, unique: true, index: true },
    { name: 'world', type: 'relationship', relationTo: 'worlds', required: true, index: true },
    { name: 'summary', type: 'textarea' },
    {
      name: 'events',
      type: 'join',
      collection: 'events',
      on: 'region',
      admin: { defaultColumns: ['title', 'key', 'kind', '_status'] }
    }
  ],
  versions: {
    maxPerDoc: 25,
    drafts: { autosave: { interval: 1500 }, schedulePublish: true, validate: true }
  }
}
