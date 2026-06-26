import { useState } from 'react'
import { clsx } from '../../lib/clsx'
import { SealedOverlay } from '../ui/SealedOverlay'
import type { ChapterSummary } from '../../lib/types'

interface ChapterCardProps {
  chapter: ChapterSummary
  onClick: () => void
}

export function ChapterCard({ chapter, onClick }: ChapterCardProps) {
  const [showSealed, setShowSealed] = useState(false)

  const handleClick = () => {
    if (chapter.is_sealed) {
      setShowSealed(true)
      return
    }
    onClick()
  }

  const date = new Date(chapter.date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        'relative text-left p-4 rounded-sm border transition-all duration-200 min-h-[140px] flex flex-col',
        'hover:shadow-book-hover hover:border-accent',
        chapter.is_sealed ? 'bg-ink/5 border-accent-gold/20' : 'bg-paper-light border-accent-gold/20',
      )}
    >
      <SealedOverlay show={showSealed} onDismiss={() => setShowSealed(false)} />

      <span className="font-display text-2xl text-ink mb-2">
        {chapter.is_sealed ? '🔒' : toRomanDisplay(chapter.number)}
      </span>
      <span className="font-body italic text-accent text-sm mb-1 line-clamp-1">
        {chapter.is_sealed ? 'Sealed' : chapter.title}
      </span>
      <span className="font-body text-xs text-ink-muted line-clamp-2 flex-1">
        {chapter.is_sealed ? '🔒 Private' : chapter.preview_text}
      </span>
      <span className="font-ui text-xs text-ink-muted mt-2">{date}</span>
    </button>
  )
}

function toRomanDisplay(n: number): string {
  const map: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let result = ''
  let num = n
  for (const [value, symbol] of map) {
    while (num >= value) {
      result += symbol
      num -= value
    }
  }
  return result
}
