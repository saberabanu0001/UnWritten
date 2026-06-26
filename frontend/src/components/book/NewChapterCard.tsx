import { useNavigate } from 'react-router-dom'

export function NewChapterCard() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate('/tell')}
      className="min-h-[140px] p-4 rounded-sm border-2 border-dashed border-accent-gold/25 flex flex-col items-center justify-center gap-2 hover:border-accent transition-colors duration-200"
    >
      <span className="text-3xl text-accent-gold">+</span>
      <span className="font-body italic text-sm text-ink-muted">New chapter</span>
    </button>
  )
}
