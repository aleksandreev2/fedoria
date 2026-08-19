import React from 'react'

export const metadata = {
  title: 'Fedoria Admin Spike',
  description: 'Disposable Payload + Cloudflare architecture spike'
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
