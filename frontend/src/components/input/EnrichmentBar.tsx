interface EnrichmentBarProps {
  score: number
}

export function EnrichmentBar({ score }: EnrichmentBarProps) {
  const percent = Math.round(score * 100)
  const label =
    percent >= 70
      ? 'Ready to write ✦'
      : percent >= 40
        ? 'Getting there...'
        : 'A few more details will make this richer'

  const labelClass =
    percent >= 70 ? 'text-accent' : percent >= 40 ? 'text-accent' : 'text-ink-muted'

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="font-ui text-xs text-ink-muted">Detail richness</p>
        <p className={`font-ui text-xs ${labelClass}`}>{label}</p>
      </div>
      <div className="h-1.5 bg-accent-gold/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Detail richness ${percent}%`}
        />
      </div>
      <p className="text-center text-accent-gold tracking-widest text-xs mt-3">── ✦ ──</p>
    </div>
  )
}
