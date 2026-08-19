import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 760, margin: '64px auto', padding: 24 }}>
      <p style={{ textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.6 }}>Fedoria / architecture spike</p>
      <h1>Payload + D1 + R2 admin acceptance</h1>
      <p>This is disposable evidence, not the player UI and not the production backend.</p>
      <p><Link href="/admin">Open Payload Admin</Link></p>
      <ul>
        <li>Content: Worlds, Regions, Events</li>
        <li>Files: Media with reverse where-used references</li>
        <li>Publications: drafts, targeting, schedule, delivery metadata and test preview</li>
      </ul>
    </main>
  )
}
