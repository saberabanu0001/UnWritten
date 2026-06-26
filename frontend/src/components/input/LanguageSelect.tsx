import { LANGUAGES } from '../../lib/constants'
import { clsx } from '../../lib/clsx'
import type { Language } from '../../lib/types'

interface LanguageSelectProps {
  value: Language
  onChange: (lang: Language) => void
}

export function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center py-4">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code as Language)}
          className={clsx(
            'px-3 py-1.5 text-xs font-ui rounded-sm border transition-all duration-200',
            value === code
              ? 'bg-accent-gold/15 border-accent text-accent'
              : 'border-accent-gold/25 text-ink-muted hover:border-accent-gold/50',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
