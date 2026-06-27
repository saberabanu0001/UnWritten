import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { ConversationHistory } from '../components/input/ConversationHistory'
import { EnrichmentBar } from '../components/input/EnrichmentBar'
import { FollowUpChat } from '../components/input/FollowUpChat'
import { MCQQuestion } from '../components/input/MCQQuestion'
import { OpenQuestion } from '../components/input/OpenQuestion'
import { Button } from '../components/ui/Button'
import { LoadingQuill } from '../components/ui/LoadingQuill'
import { useAI } from '../hooks/useAI'
import { useBookStore } from '../stores/bookStore'
import type { ConversationQuestion } from '../lib/types'

const STEP_MESSAGES: Record<string, string> = {
  extracting: 'Reading your memory...',
  asking: 'Thinking of a question...',
  writing: 'Crafting your page...',
  illustrating: 'Drawing the scene...',
}

const MAX_QUESTIONS = 5

export function CraftPage() {
  const navigate = useNavigate()
  const { draft, updateDraft } = useBookStore()
  const {
    sceneData,
    isLoading,
    error,
    step,
    runExtractScene,
    runFullPipeline,
    hydrateScene,
    runConversationStep,
    currentQuestion,
    enrichmentScore,
    isReady,
    conversationErrorCount,
    hydrateConversation,
  } = useAI()

  const [answers, setAnswers] = useState<ConversationQuestion[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [writing, setWriting] = useState(false)
  const [legacyMode, setLegacyMode] = useState(false)
  const [enrichmentSummary, setEnrichmentSummary] = useState<string | undefined>()
  const extractStarted = useRef(false)
  const conversationStarted = useRef(false)
  const conversationFailures = useRef(0)

  const scene = sceneData || draft?.sceneData

  const loadScene = async (rawInput: string, language: string, force = false) => {
    if (!force && extractStarted.current) return
    extractStarted.current = true
    try {
      const extracted = await runExtractScene(rawInput, language)
      updateDraft({ sceneData: extracted })
    } catch {
      extractStarted.current = false
    }
  }

  const startConversation = async (history: ConversationQuestion[]) => {
    if (!draft || !scene) return
    try {
      const result = await runConversationStep(
        draft.rawInput,
        draft.language,
        scene,
        history,
      )
      if (result.status === 'ready' && result.summary) {
        setEnrichmentSummary(result.summary)
        updateDraft({ enrichmentSummary: result.summary })
      }
    } catch {
      conversationFailures.current += 1
      if (conversationFailures.current >= 2) {
        setLegacyMode(false)
      } else {
        setLegacyMode(true)
      }
    }
  }

  useEffect(() => {
    if (!draft) {
      navigate('/tell')
      return
    }

    const initialAnswers = draft.conversation ?? []
    setAnswers(initialAnswers)
    if (draft.enrichmentSummary) {
      setEnrichmentSummary(draft.enrichmentSummary)
    }

    if (draft.sceneData) {
      hydrateScene(draft.sceneData)
      extractStarted.current = true
    } else if (!extractStarted.current) {
      loadScene(draft.rawInput, draft.language)
    }

    hydrateConversation(initialAnswers, draft.enrichmentSummary)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.rawInput, draft?.language, navigate])

  useEffect(() => {
    if (!draft || !scene || legacyMode) return
    if (draft.enrichmentSummary || enrichmentSummary) return
    if (conversationStarted.current) return
    if (answers.length >= MAX_QUESTIONS) return
    if (currentQuestion) return
    if (isLoading || writing) return
    if (conversationErrorCount >= 2) return

    conversationStarted.current = true
    startConversation(answers).finally(() => {
      conversationStarted.current = false
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, answers.length, currentQuestion, legacyMode, isReady, conversationErrorCount])

  if (!draft) return null

  const handleAnswer = async () => {
    if (!currentQuestion || !scene) return

    const answerValue =
      currentQuestion.question_type === 'mcq' ? selectedOption : currentAnswer.trim()
    if (!answerValue) return

    const answered: ConversationQuestion = {
      ...currentQuestion,
      answer: answerValue,
    }
    const newHistory = [...answers, answered]
    setAnswers(newHistory)
    setCurrentAnswer('')
    setSelectedOption(null)
    updateDraft({ conversation: newHistory })

    if (newHistory.length >= MAX_QUESTIONS) {
      const summary = enrichmentSummary || 'Enough detail collected to write a rich memoir page.'
      setEnrichmentSummary(summary)
      updateDraft({ enrichmentSummary: summary })
      return
    }

    try {
      const result = await runConversationStep(
        draft.rawInput,
        draft.language,
        scene,
        newHistory,
      )
      if (result.status === 'ready' && result.summary) {
        setEnrichmentSummary(result.summary)
        updateDraft({ enrichmentSummary: result.summary })
      }
    } catch {
      conversationFailures.current += 1
      if (conversationFailures.current >= 2) return
      setLegacyMode(true)
    }
  }

  const handleLegacyWrite = async () => {
    if (!scene) return
    const legacyQuestion = scene.followup_question
    const legacyAnswer = currentAnswer.trim() || undefined
    const conversation: ConversationQuestion[] = legacyAnswer
      ? [
          {
            question_id: 'legacy-q1',
            question_type: 'open',
            question_text: legacyQuestion,
            answer: legacyAnswer,
          },
        ]
      : []

    await handleWriteNow(conversation, enrichmentSummary)
  }

  const handleWriteNow = async (
    conversationOverride?: ConversationQuestion[],
    summaryOverride?: string,
  ) => {
    if (!scene) return
    setWriting(true)
    const conversation = conversationOverride ?? answers
    const summary = summaryOverride ?? enrichmentSummary ?? draft.enrichmentSummary

    try {
      const result = await runFullPipeline(
        draft.rawInput,
        scene,
        conversation,
        draft.language,
        summary,
      )
      updateDraft({
        conversation,
        enrichmentSummary: summary,
        sceneData: scene,
        title: result.prose.title,
        prose: result.prose.prose,
        pullQuote: result.prose.pull_quote,
        imageUrl: result.imageUrl,
        imagePrompt: result.imagePrompt,
      })
      navigate('/read/preview')
    } finally {
      setWriting(false)
    }
  }

  const showWriteNow = isReady || answers.length >= 1 || conversationErrorCount >= 2

  if ((isLoading && step === 'extracting' && !scene) || writing) {
    return (
      <div>
        <Header backTo="/tell" />
        <LoadingQuill message={STEP_MESSAGES[step] || 'Crafting your page...'} />
      </div>
    )
  }

  if (error && !scene) {
    return (
      <div className="pb-12">
        <Header backTo="/tell" />
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
          <p className="font-display italic text-accent mb-3">Couldn&apos;t read your memory</p>
          <p className="font-body text-sm text-ink-muted mb-8 max-w-xs">{error}</p>
          <Button fullWidth onClick={() => loadScene(draft.rawInput, draft.language, true)}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (!scene) {
    return (
      <div>
        <Header backTo="/tell" />
        <LoadingQuill message="Reading your memory..." />
      </div>
    )
  }

  if (legacyMode && conversationErrorCount < 2) {
    return (
      <div className="pb-12">
        <Header backTo="/tell" />
        <EnrichmentBar score={enrichmentScore} />
        <FollowUpChat
          memory={draft.rawInput}
          question={scene.followup_question}
          answer={currentAnswer}
          onAnswerChange={setCurrentAnswer}
        />
        <div className="mt-8 space-y-4">
          <Button fullWidth onClick={() => handleLegacyWrite()}>
            ✨ Write my page
          </Button>
          <div className="text-center">
            <Button variant="text" onClick={() => handleWriteNow([], undefined)}>
              Skip — write from what I gave you
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading && step === 'asking' && !currentQuestion && answers.length === 0) {
    return (
      <div>
        <Header backTo="/tell" />
        <LoadingQuill message={STEP_MESSAGES.asking} />
      </div>
    )
  }

  return (
    <div className="pb-12">
      <Header backTo="/tell" />

      <EnrichmentBar score={enrichmentScore} />

      <ConversationHistory memory={draft.rawInput} questions={answers} />

      {isLoading && step === 'asking' && !currentQuestion ? (
        <LoadingQuill message={STEP_MESSAGES.asking} />
      ) : currentQuestion ? (
        currentQuestion.question_type === 'mcq' ? (
          <MCQQuestion
            question={currentQuestion}
            selected={selectedOption}
            onSelect={setSelectedOption}
            onSubmit={handleAnswer}
            disabled={isLoading}
          />
        ) : (
          <OpenQuestion
            question={currentQuestion}
            answer={currentAnswer}
            onChange={setCurrentAnswer}
            onSubmit={handleAnswer}
            disabled={isLoading}
          />
        )
      ) : null}

      {showWriteNow && (
        <div className="mt-8">
          <Button fullWidth onClick={() => handleWriteNow()} loading={writing}>
            ✨ Write my page
          </Button>
        </div>
      )}
    </div>
  )
}
