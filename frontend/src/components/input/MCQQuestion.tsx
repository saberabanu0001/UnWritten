import { clsx } from '../../lib/clsx'
import type { ConversationQuestion } from '../../lib/types'
import { Button } from '../ui/Button'

interface MCQQuestionProps {
  question: ConversationQuestion
  selected: string | null
  onSelect: (option: string) => void
  onSubmit: () => void
  disabled?: boolean
}

export function MCQQuestion({
  question,
  selected,
  onSelect,
  onSubmit,
  disabled = false,
}: MCQQuestionProps) {
  return (
    <div className="bg-paper-dark/30 border border-accent-gold/30 rounded-sm p-4 animate-slide-up">
      <p className="text-label uppercase text-accent mb-2">✍ Unwritten asks</p>
      <p className="font-display italic text-ink text-[1.0625rem] leading-relaxed mb-6">
        &ldquo;{question.question_text}&rdquo;
      </p>

      <div className="space-y-3 mb-6">
        {(question.options ?? []).map((option) => {
          const isSelected = selected === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              disabled={disabled}
              className={clsx(
                'w-full text-left px-4 py-3 rounded-sm border transition-all duration-150',
                'font-body text-prose',
                isSelected
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-paper-light border-accent-gold/25 text-ink hover:border-accent-gold/50',
              )}
              aria-pressed={isSelected}
            >
              <span className="mr-3">{isSelected ? '●' : '○'}</span>
              {option}
            </button>
          )
        })}
      </div>

      <Button fullWidth disabled={!selected || disabled} onClick={onSubmit}>
        Continue →
      </Button>
    </div>
  )
}
