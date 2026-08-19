import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import { getPlatformProxy } from 'wrangler'
import config, { disposeCloudflarePlatformProxyForScripts } from '../payload.config'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturePath = path.resolve(dirname, '../fixtures/spike-asset.svg')
const statePath = path.resolve(process.cwd(), '.runtime-smoke.json')

const email = 'spike-admin@example.test'
const password = 'SpikePassword123!'

const payload = await getPayload({ config })
let mediaFilename = ''

try {
  const user = await payload.create({
    collection: 'users',
    data: { email, password, role: 'admin' }
  })

  const world = await payload.create({
    collection: 'worlds',
    data: {
      name: 'Smoke World',
      key: 'smoke-world',
      summary: 'Disposable CI world.',
      _status: 'published'
    }
  })

  const media = await payload.create({
    collection: 'media',
    data: {
      label: 'Smoke Asset',
      alt: 'Fedoria local R2 smoke asset',
      visibility: 'private',
      worlds: [world.id]
    },
    filePath: fixturePath
  })
  mediaFilename = media.filename ?? ''

  const publication = await payload.create({
    collection: 'publications',
    draft: true,
    data: {
      title: 'Smoke Publication',
      workflowStatus: 'draft',
      messageText: 'Local authenticated publication preview.',
      parseMode: 'plain',
      attachments: [media.id],
      targetType: 'world',
      telegramTarget: 'smoke-world',
      world: world.id,
      language: 'ru',
      attempts: 0,
      idempotencyKey: 'runtime-smoke-publication'
    }
  })

  await fs.writeFile(
    statePath,
    JSON.stringify(
      {
        email,
        password,
        userId: user.id,
        worldId: world.id,
        mediaId: media.id,
        mediaFilename,
        publicationId: publication.id
      },
      null,
      2
    )
  )

  console.log(`runtime smoke seed created world=${world.id} media=${media.id} publication=${publication.id}`)
} finally {
  await payload.destroy()
  await disposeCloudflarePlatformProxyForScripts()
}

const persistedPlatform = await getPlatformProxy<CloudflareEnv>({
  persist: true,
  remoteBindings: false
})

try {
  const listing = await persistedPlatform.env.R2.list({ limit: 100 })
  const keys = listing.objects.map((object) => object.key)
  console.log(`persisted local R2 keys after proxy restart: ${JSON.stringify(keys)}`)

  if (keys.length === 0) {
    throw new Error('Payload media metadata was created, but no object persisted to local R2.')
  }

  if (mediaFilename && !keys.includes(mediaFilename)) {
    console.log(`media filename ${mediaFilename} is not a bare R2 key; persisted object uses another key`)
  }
} finally {
  await persistedPlatform.dispose()
}
