interface LoadingQuillProps {
  message?: string
}

export function LoadingQuill({ message = 'Crafting your page...' }: LoadingQuillProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
      <div className="text-accent-gold tracking-widest mb-6">── ✦ ──</div>
      <p className="font-display italic text-accent text-lg animate-pulse-slow">{message}</p>
      <div className="text-accent-gold tracking-widest mt-6">── ✦ ──</div>
    </div>
  )
}
