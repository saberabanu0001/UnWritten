interface PullQuoteProps {
  quote: string
}

export function PullQuote({ quote }: PullQuoteProps) {
  if (!quote) return null

  return (
    <blockquote className="border-t border-b border-accent-gold/40 mx-6 my-7 py-4 text-center">
      <p className="font-display italic text-accent text-pull-quote leading-relaxed">
        &ldquo;{quote}&rdquo;
      </p>
    </blockquote>
  )
}
