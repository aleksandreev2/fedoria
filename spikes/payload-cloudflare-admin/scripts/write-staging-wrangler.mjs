import fs from 'node:fs/promises'

const databaseId = process.env.STAGING_D1_ID

if (!databaseId) {
  throw new Error('STAGING_D1_ID is required')
}

const config = {
  $schema: 'node_modules/wrangler/config-schema.json',
  main: '.open-next/worker.js',
  name: 'fedoria-payload-admin-spike-staging',
  compatibility_date: '2026-08-19',
  compatibility_flags: ['nodejs_compat', 'global_fetch_strictly_public'],
  workers_dev: true,
  assets: {
    directory: '.open-next/assets',
    binding: 'ASSETS',
  },
  vars: {
    PAYLOAD_DB_PUSH: 'false',
    PAYLOAD_LOG_LEVEL: 'info',
  },
  secrets: {
    required: ['PAYLOAD_SECRET'],
  },
  d1_databases: [
    {
      binding: 'D1',
      database_id: databaseId,
      database_name: 'fedoria-payload-admin-spike-staging',
    },
  ],
  r2_buckets: [
    {
      binding: 'R2',
      bucket_name: 'fedoria-payload-admin-spike-staging',
    },
  ],
  observability: {
    enabled: true,
  },
}

await fs.writeFile('wrangler.staging.generated.jsonc', `${JSON.stringify(config, null, 2)}\n`)
console.log('wrote wrangler.staging.generated.jsonc')
