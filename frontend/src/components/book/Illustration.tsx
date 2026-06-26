import { useState } from 'react'
import { mediaUrl } from '../../lib/api'

interface IllustrationProps {
  src?: string
  alt?: string
  loading?: boolean
}

export function Illustration({ src, alt = 'Chapter illustration', loading }: IllustrationProps) {
  const [failed, setFailed] = useState(false)

  if (loading) {
    return (
      <div className="book-illustration bg-ink-muted/10 animate-pulse-slow flex items-center justify-center">
        <span className="text-ink-muted/40 text-xs font-body italic">drawing...</span>
      </div>
    )
  }

  const url = mediaUrl(src)
  const isPlaceholder = !url || url.includes('placeholder') || failed

  if (isPlaceholder) {
    return (
      <div className="book-illustration bg-paper-dark flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 180 155" className="w-full h-full" aria-hidden>
          <rect fill="#E8E0D0" width="180" height="155" />
          <path d="M20 120 Q60 80 100 100 T160 80" stroke="#6B5D4F" strokeWidth="1.5" fill="none" />
          <circle cx="130" cy="50" r="20" stroke="#2C2416" strokeWidth="1" fill="none" />
          <path d="M30 90 L70 60 L90 100 Z" stroke="#9B8B7A" strokeWidth="1" fill="none" />
        </svg>
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={alt}
      className="book-illustration object-cover"
      onError={() => setFailed(true)}
    />
  )
}
