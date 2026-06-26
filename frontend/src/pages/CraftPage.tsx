import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { FollowUpChat } from '../components/input/FollowUpChat'
import { Button } from '../components/ui/Button'
import { LoadingQuill } from '../components/ui/LoadingQuill'
import { useAI } from '../hooks/useAI'
import { useBookStore } from '../stores/bookStore'

const STEP_MESSAGES: Record<string, string> = {
  extracting: 'Reading your memory...',
  writing: 'Crafting your page...',
  illustrating: 'Drawing the scene...',
}

export function CraftPage() {
  const navigate = useNavigate()
  const { draft, updateDraft } = useBookStore()
  const { sceneData, isLoading, error, step, runExtractScene, runFullPipeline, hydrateScene } = useAI()
  const [answer, setAnswer] = useState('')
  const [writing, setWriting] = useState(false)
  const extractStarted = useRef(false)

  const loadScene = async (rawInput: string, language: string, force = false) => {
    if (!force && extractStarted.current) return
    extractStarted.current = true
    try {
      const scene = await runExtractScene(rawInput, language)
      updateDraft({ sceneData: scene, followupQuestion: scene.followup_question })
    } catch {
      extractStarted.current = false
    }
  }

  useEffect(() => {
    if (!draft) {
      navigate('/tell')
      return
    }

    if (draft.sceneData) {
      hydrateScene(draft.sceneData)
      extractStarted.current = true
      return
    }

    if (extractStarted.current) return

    loadScene(draft.rawInput, draft.language)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.rawInput, draft?.language, navigate])

  if (!draft) return null

  const question =
    sceneData?.followup_question || draft.sceneData?.followup_question || ''

  const handleWrite = async (skipFollowup = false) => {
    const scene = sceneData || draft.sceneData
    if (!scene) return
    setWriting(true)
    const followupAnswer = skipFollowup ? undefined : answer.trim() || undefined
    try {
      const result = await runFullPipeline(
        draft.rawInput,
        scene,
        followupAnswer,
        draft.language,
      )
      updateDraft({
        followupQuestion: question,
        followupAnswer: followupAnswer,
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

  if ((isLoading && !sceneData && !draft.sceneData) || writing) {
    return (
      <div>
        <Header backTo="/tell" />
        <LoadingQuill message={STEP_MESSAGES[step] || 'Crafting your page...'} />
      </div>
    )
  }

  if (error && !sceneData && !draft.sceneData) {
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

  if (!question) {
    return (
      <div>
        <Header backTo="/tell" />
        <LoadingQuill message="Reading your memory..." />
      </div>
    )
  }

  return (
    <div className="pb-12">
      <Header backTo="/tell" />

      <FollowUpChat
        memory={draft.rawInput}
        question={question}
        answer={answer}
        onAnswerChange={setAnswer}
      />

      <div className="mt-8 space-y-4">
        <Button fullWidth onClick={() => handleWrite(false)}>
          ✨ Write my page
        </Button>
        <div className="text-center">
          <Button variant="text" onClick={() => handleWrite(true)}>
            Skip — write from what I gave you
          </Button>
        </div>
      </div>
    </div>
  )
}
