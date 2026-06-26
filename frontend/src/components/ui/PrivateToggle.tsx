import { clsx } from '../../lib/clsx'

interface PrivateToggleProps {
  isPrivate: boolean
  onChange: (value: boolean) => void
}

export function PrivateToggle({ isPrivate, onChange }: PrivateToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <span className="font-body text-sm text-ink-muted">🔒 Private mode</span>
      <button
        type="button"
        role="switch"
        aria-checked={isPrivate}
        onClick={() => onChange(!isPrivate)}
        className={clsx(
          'relative w-9 h-5 rounded-full transition-colors duration-200',
          isPrivate ? 'bg-accent' : 'bg-ink-muted/30',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 w-4 h-4 bg-paper rounded-full transition-transform duration-200 shadow-sm',
            isPrivate ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </button>
      <span className="font-ui text-xs text-ink-muted uppercase tracking-wider">
        {isPrivate ? 'ON' : 'OFF'}
      </span>
    </div>
  )
}
