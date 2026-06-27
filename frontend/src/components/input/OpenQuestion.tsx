import type { ConversationQuestion } from '../../lib/types'
import { Button } from '../ui/Button'
import { StoryInput } from './StoryInput'

interface OpenQuestionProps {
  question: ConversationQuestion
  answer: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
}

export function OpenQuestion({
  question,
  answer,
  onChange,
  onSubmit,
  disabled = false,
}: OpenQuestionProps) {
  const canSubmit = answer.trim().length > 0 && !disabled

  return (
    <div className="bg-paper-dark/30 border border-accent-gold/30 rounded-sm p-4 animate-slide-up">
      <p className="text-label uppercase text-accent mb-2">✍ Unwritten asks</p>
      <p className="font-display italic text-ink text-[1.0625rem] leading-relaxed mb-6">
        &ldquo;{question.question_text}&rdquo;
      </p>

      <StoryInput
        value={answer}
        onChange={onChange}
        placeholder="The whole neighborhood. Tin roofs and mango trees..."
        minHeight="120px"
      />

      <div className="mt-6">
        <Button fullWidth disabled={!canSubmit} onClick={onSubmit}>
          Continue →
        </Button>
      </div>
    </div>
  )
}
