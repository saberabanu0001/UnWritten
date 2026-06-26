import { StoryInput } from './StoryInput'

interface FollowUpChatProps {
  memory: string
  question: string
  answer: string
  onAnswerChange: (value: string) => void
}

export function FollowUpChat({ memory, question, answer, onAnswerChange }: FollowUpChatProps) {
  const truncated = memory.length > 200 ? memory.slice(0, 200) + '...' : memory

  return (
    <div className="space-y-6">
      <div className="bg-paper-light border border-accent-gold/20 rounded-sm p-4 animate-slide-up">
        <p className="text-label uppercase text-ink-muted mb-2">Your memory</p>
        <p className="font-body italic text-ink-light text-prose">"{truncated}"</p>
      </div>

      <div className="bg-paper-dark/30 border border-accent-gold/15 rounded-sm p-4 animate-slide-up">
        <p className="text-label uppercase text-accent mb-2">✍ Unwritten asks</p>
        <p className="font-display italic text-ink text-[1.0625rem] leading-relaxed">
          "{question}"
        </p>
      </div>

      <StoryInput
        value={answer}
        onChange={onAnswerChange}
        placeholder="The whole neighborhood. Tin roofs and mango trees..."
        minHeight="120px"
      />
    </div>
  )
}
