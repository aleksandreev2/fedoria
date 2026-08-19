# Fedoria Payload + Cloudflare admin spike

Disposable architecture evidence for R05 Spike A + D. This directory is intentionally isolated from the future production app.

## What this spike proves

- Payload Admin can model `World -> Region -> Event` with nested choices and follow-up relations.
- Media is an upload-enabled first-class entity backed by R2.
- Media shows reverse `where used` references through Payload Join fields.
- Publications have drafts, versions, autosave, scheduled publishing fields, media attachments, targeting, delivery metadata and a safe test-preview endpoint.
- The same app can be built for Cloudflare Workers using the official Payload D1/R2/OpenNext pattern.

## Baseline

Pinned from the current official `payloadcms/payload` **3.x** Cloudflare D1 template at the time of the spike. The upstream Deploy button points to this branch; the spike does not mix files from `main` with Payload 3.x packages.

- Payload 3.87.0
- Next.js 16.3.0
- React 19.2.6
- @opennextjs/cloudflare 1.20.1
- Wrangler 4.116.0
- TypeScript 5.7.3
- pnpm 11.20.0 for CI execution

pnpm 11 moved dependency build approval to `pnpm-workspace.yaml`; this spike uses an explicit `allowBuilds` map and keeps strict dependency-build checking enabled.

The Wrangler compatibility date is deliberately updated to `2026-08-19` for this new spike. Unlike the upstream template, local D1 is not configured with `remote: true`; this prevents accidental remote data access during an architecture test.

## Local commands

```bash
corepack enable
corepack prepare pnpm@11.20.0 --activate
pnpm install
pnpm run generate:types
pnpm run generate:importmap
pnpm run check
pnpm run build
pnpm run build:cloudflare
pnpm exec wrangler deploy --dry-run
```

The repository CI runs the same validation without deploying anything.

## Cloudflare resources

`wrangler.jsonc` contains placeholder D1/R2 resource identifiers. Do not replace them with production resources for this spike. A real remote acceptance test should use dedicated disposable/staging resources and a Wrangler secret for `PAYLOAD_SECRET`.

## Publication preview endpoint

Authenticated editors can request:

```text
POST /api/publications/:id/test-preview
```

It returns the normalized Telegram payload that *would* be sent. It does not contact Telegram and does not require a bot token. Real Telegram delivery is intentionally outside this first CMS acceptance pass.

## Go / no-go

Go only if CI can generate types/import map, lint, typecheck, build, produce an OpenNext Worker bundle, and complete `wrangler deploy --dry-run` without patching Payload/OpenNext internals.
