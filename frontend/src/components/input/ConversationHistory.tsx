import { useEffect, useRef } from 'react'
import type { ConversationQuestion } from '../../lib/types'

interface ConversationHistoryProps {
  memory: string
  questions: ConversationQuestion[]
}

export function ConversationHistory({ memory, questions }: ConversationHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const truncated = memory.length > 200 ? memory.slice(0, 200) + '...' : memory

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [questions.length])

  return (
    <div className="space-y-4 mb-6">
      <div className="bg-paper-light border border-accent-gold/20 rounded-sm p-4 animate-slide-up">
        <p className="text-label uppercase text-ink-muted mb-2">Your memory</p>
        <p className="font-body italic text-ink-light text-prose">&ldquo;{truncated}&rdquo;</p>
      </div>

      {questions.map((q) => (
        <div key={q.question_id} className="space-y-2 animate-slide-up">
          <div className="bg-paper-dark/30 border border-accent-gold/30 rounded-sm p-4">
            <p className="text-label uppercase text-accent mb-2">✍ Unwritten</p>
            <p className="font-display italic text-ink text-[1.0625rem] leading-relaxed">
              &ldquo;{q.question_text}&rdquo;
            </p>
          </div>

          {q.answer && (
            <div className="bg-paper-light border border-accent/20 rounded-sm p-4 ml-2">
              {q.question_type === 'mcq' ? (
                <p className="font-body text-ink text-prose">
                  <span className="text-accent mr-2">✓</span>
                  {q.answer}
                </p>
              ) : (
                <p className="font-body italic text-ink-light text-prose">
                  &ldquo;{q.answer}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  )
}
