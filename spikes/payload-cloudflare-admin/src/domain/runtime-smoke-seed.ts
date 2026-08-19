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

  const region = await payload.create({
    collection: 'regions',
    data: {
      name: 'Smoke Harbor',
      key: 'smoke-harbor',
      world: world.id,
      summary: 'Disposable CI region for operator UX.',
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

  const bossEvent = await payload.create({
    collection: 'events',
    data: {
      title: 'Smoke Boss',
      key: 'smoke-boss',
      world: world.id,
      region: region.id,
      kind: 'boss',
      weight: 1,
      cooldownRuns: 2,
      presentation: {
        text: 'A smoke-test boss blocks the harbor exit.'
      },
      choices: [
        {
          key: 'finish',
          label: 'Finish the fight',
          outcomeText: 'The harbor is safe again.',
          mutations: [
            { path: 'flags.smokeBossDefeated', operation: 'set', value: 'true' }
          ]
        }
      ],
      chronicle: {
        eligible: true,
        worldFirstKey: 'smoke-boss-first',
        announcementTemplate: 'The smoke-test boss was defeated.'
      },
      _status: 'published'
    }
  })

  const entryEvent = await payload.create({
    collection: 'events',
    data: {
      title: 'Smoke Harbor Entry',
      key: 'smoke-harbor-entry',
      world: world.id,
      region: region.id,
      kind: 'story',
      weight: 10,
      cooldownRuns: 0,
      presentation: {
        text: 'The player arrives at Smoke Harbor.',
        image: media.id
      },
      conditions: [
        { path: 'flags.smokeVisited', operator: 'not_exists' }
      ],
      choices: [
        {
          key: 'advance',
          label: 'Walk toward the harbor gate',
          outcomeText: 'A boss appears ahead.',
          mutations: [
            { path: 'flags.smokeVisited', operation: 'set', value: 'true' }
          ],
          followUp: bossEvent.id
        }
      ],
      _status: 'published'
    }
  })

  const publication = await payload.create({
    collection: 'publications',
    draft: true,
    data: {
      title: 'Smoke Publication',
      workflowStatus: 'scheduled',
      messageText: 'Local authenticated publication preview.',
      parseMode: 'plain',
      attachments: [media.id],
      targetType: 'world',
      telegramTarget: 'smoke-world',
      world: world.id,
      linkedEvent: entryEvent.id,
      language: 'ru',
      scheduledAt: '2099-01-01T12:00:00.000Z',
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
        regionId: region.id,
        mediaId: media.id,
        mediaFilename,
        entryEventId: entryEvent.id,
        bossEventId: bossEvent.id,
        publicationId: publication.id
      },
      null,
      2
    )
  )

  console.log(
    `runtime smoke seed created world=${world.id} region=${region.id} media=${media.id} events=${entryEvent.id},${bossEvent.id} publication=${publication.id}`
  )
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
