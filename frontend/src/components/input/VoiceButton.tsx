import { clsx } from '../../lib/clsx'

interface VoiceButtonProps {
  isListening: boolean
  isSupported: boolean
  onToggle: () => void
}

export function VoiceButton({ isListening, isSupported, onToggle }: VoiceButtonProps) {
  if (!isSupported) return null

  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        'w-full flex items-center justify-center gap-2 py-3.5 rounded-sm border-2 border-dashed transition-all duration-200',
        isListening
          ? 'border-sealed bg-sealed/5 text-sealed'
          : 'border-accent-gold/40 text-ink-muted hover:border-accent hover:text-ink',
      )}
    >
      {isListening && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sealed opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sealed" />
        </span>
      )}
      <span className="font-body italic text-sm">
        {isListening ? '⏹ Listening... tap to stop' : '🎙 Speak instead'}
      </span>
    </button>
  )
}
