import { useEffect, useRef } from 'react'
import { clsx } from '../../lib/clsx'

interface StoryInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export function StoryInput({
  value,
  onChange,
  placeholder = 'We were sitting on the old rooftop, the one with the cracked tiles. She was peeling garlic and telling me about her village...',
  minHeight = '200px',
}: StoryInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, parseInt(minHeight))}px`
  }, [value, minHeight])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ minHeight }}
      className={clsx(
        'w-full bg-paper-light border border-accent-gold/25 rounded-sm',
        'px-4 py-4 font-body text-prose text-ink placeholder:text-ink-muted/50',
        'focus:outline-none focus:border-accent transition-colors resize-none',
      )}
    />
  )
}
