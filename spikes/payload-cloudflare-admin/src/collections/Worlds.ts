import type { CollectionConfig } from 'payload'

export const Worlds: CollectionConfig = {
  slug: 'worlds',
  admin: {
    group: 'Content',
    useAsTitle: 'name',
    defaultColumns: ['name', 'key', '_status', 'updatedAt']
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'key', type: 'text', required: true, unique: true, index: true },
    { name: 'summary', type: 'textarea' },
    {
      name: 'regions',
      type: 'join',
      collection: 'regions',
      on: 'world',
      admin: { defaultColumns: ['name', 'key', '_status'] }
    }
  ],
  versions: {
    maxPerDoc: 25,
    drafts: { autosave: { interval: 1500 }, schedulePublish: true, validate: true }
  }
}
