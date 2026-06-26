import { useEffect } from 'react'

interface SealedOverlayProps {
  show: boolean
  onDismiss: () => void
}

export function SealedOverlay({ show, onDismiss }: SealedOverlayProps) {
  useEffect(() => {
    if (!show) return
    const timer = setTimeout(onDismiss, 2000)
    return () => clearTimeout(timer)
  }, [show, onDismiss])

  if (!show) return null

  return (
    <div className="absolute inset-0 bg-ink/90 flex items-center justify-center rounded-sm animate-fade-in z-10">
      <p className="font-display italic text-accent-gold text-sm">This chapter is sealed 🔒</p>
    </div>
  )
}
