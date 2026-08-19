import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
    useAsTitle: 'label',
    defaultColumns: ['label', 'filename', 'mimeType', 'visibility', 'updatedAt']
  },
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'alt', type: 'text', required: true },
    {
      name: 'visibility',
      type: 'select',
      required: true,
      defaultValue: 'private',
      options: ['private', 'public']
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'value', type: 'text', required: true }]
    },
    { name: 'worlds', type: 'relationship', relationTo: 'worlds', hasMany: true },
    { name: 'archived', type: 'checkbox', defaultValue: false },
    {
      name: 'usedByPublications',
      label: 'Used by publications',
      type: 'join',
      collection: 'publications',
      on: 'attachments',
      admin: { allowCreate: false, defaultColumns: ['title', 'workflowStatus', '_status'] }
    },
    {
      name: 'usedByEvents',
      label: 'Used by events',
      type: 'join',
      collection: 'events',
      on: 'presentation.image',
      admin: { allowCreate: false, defaultColumns: ['title', 'key', '_status'] }
    }
  ],
  upload: {
    bulkUpload: true,
    crop: false,
    focalPoint: false,
    pasteURL: false
  }
}
