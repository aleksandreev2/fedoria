import fs from 'node:fs/promises'
import path from 'node:path'
import { getPlatformProxy } from 'wrangler'

type SmokeState = {
  mediaFilename: string
}

const state = JSON.parse(
  await fs.readFile(path.resolve(process.cwd(), '.runtime-smoke.json'), 'utf8'),
) as SmokeState

const platform = await getPlatformProxy<CloudflareEnv>({
  persist: true,
  remoteBindings: false,
})

try {
  const listing = await platform.env.R2.list({ limit: 100 })
  const keys = listing.objects.map((object) => object.key)

  console.log(`persisted local R2 keys: ${JSON.stringify(keys)}`)

  if (keys.length === 0) {
    throw new Error('No objects were persisted to local R2 by the Payload media create operation.')
  }

  const exact = await platform.env.R2.head(state.mediaFilename)
  if (exact) {
    console.log(`persisted media object found at exact filename key: ${state.mediaFilename}`)
    return
  }

  console.log(`media filename is ${state.mediaFilename}; persisted key differs from the bare filename`)
} finally {
  await platform.dispose()
}
