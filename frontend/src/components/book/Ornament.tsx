import { clsx } from '../../lib/clsx'

interface OrnamentProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

export function Ornament({ size = 'md', className }: OrnamentProps) {
  return (
    <div className={clsx('text-accent-gold tracking-widest', sizes[size], className)}>
      ── ✦ ──
    </div>
  )
}
