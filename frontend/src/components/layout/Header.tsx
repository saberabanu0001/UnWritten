import { useNavigate } from 'react-router-dom'
import { clsx } from '../../lib/clsx'

interface HeaderProps {
  backTo?: string
  backLabel?: string
  rightLabel?: string
}

export function Header({ backTo, backLabel = '← Back', rightLabel }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="flex items-center justify-between py-6">
      {backTo ? (
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="font-ui text-sm text-ink-muted hover:text-ink transition-colors"
        >
          {backLabel}
        </button>
      ) : (
        <span />
      )}
      {rightLabel && (
        <span className={clsx('font-ui text-xs text-ink-muted italic')}>{rightLabel}</span>
      )}
    </header>
  )
}
