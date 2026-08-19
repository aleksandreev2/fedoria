import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'world', 'region', 'kind', 'weight', '_status']
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'key', type: 'text', required: true, unique: true, index: true },
    { name: 'world', type: 'relationship', relationTo: 'worlds', required: true, index: true },
    { name: 'region', type: 'relationship', relationTo: 'regions', required: true, index: true },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'systemic',
      options: ['systemic', 'story', 'rare', 'boss', 'social']
    },
    { name: 'weight', type: 'number', required: true, defaultValue: 10, min: 0 },
    { name: 'cooldownRuns', type: 'number', defaultValue: 0, min: 0 },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Presentation',
          fields: [
            {
              name: 'presentation',
              type: 'group',
              fields: [
                { name: 'text', type: 'textarea', required: true },
                { name: 'image', type: 'upload', relationTo: 'media' }
              ]
            }
          ]
        },
        {
          label: 'Conditions',
          fields: [
            {
              name: 'conditions',
              type: 'array',
              fields: [
                { name: 'path', type: 'text', required: true },
                {
                  name: 'operator',
                  type: 'select',
                  required: true,
                  options: ['equals', 'not_equals', 'gte', 'lte', 'exists', 'not_exists', 'contains']
                },
                { name: 'value', type: 'text' }
              ]
            }
          ]
        },
        {
          label: 'Choices & Outcomes',
          fields: [
            {
              name: 'choices',
              type: 'array',
              minRows: 1,
              fields: [
                { name: 'key', type: 'text', required: true },
                { name: 'label', type: 'text', required: true },
                { name: 'outcomeText', type: 'textarea' },
                {
                  name: 'mutations',
                  type: 'array',
                  fields: [
                    { name: 'path', type: 'text', required: true },
                    { name: 'operation', type: 'select', required: true, options: ['set', 'inc', 'dec', 'add', 'remove'] },
                    { name: 'value', type: 'text' }
                  ]
                },
                { name: 'followUp', type: 'relationship', relationTo: 'events' }
              ]
            }
          ]
        },
        {
          label: 'Chronicle',
          fields: [
            {
              name: 'chronicle',
              type: 'group',
              fields: [
                { name: 'eligible', type: 'checkbox', defaultValue: false },
                { name: 'worldFirstKey', type: 'text' },
                { name: 'announcementTemplate', type: 'textarea' }
              ]
            }
          ]
        }
      ]
    }
  ],
  versions: {
    maxPerDoc: 50,
    drafts: { autosave: { interval: 1200 }, schedulePublish: true, validate: true }
  }
}
