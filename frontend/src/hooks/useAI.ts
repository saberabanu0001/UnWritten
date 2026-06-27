import { useCallback, useState } from 'react'
import axios from 'axios'
import { conversationStep, extractScene, generateImage, generateProse } from '../lib/api'
import type { ConversationQuestion, ConversationResponse, ProseResult, SceneData } from '../lib/types'

type AIStep = 'idle' | 'extracting' | 'asking' | 'writing' | 'illustrating'

function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string' && detail.length > 0) return detail
  }
  return fallback
}

export function useAI() {
  const [sceneData, setSceneData] = useState<SceneData | null>(null)
  const [proseResult, setProseResult] = useState<ProseResult | null>(null)
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [imagePrompt, setImagePrompt] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<AIStep>('idle')
  const [currentQuestion, setCurrentQuestion] = useState<ConversationQuestion | null>(null)
  const [enrichmentScore, setEnrichmentScore] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [conversationErrorCount, setConversationErrorCount] = useState(0)

  const runExtractScene = useCallback(async (rawInput: string, language: string) => {
    setIsLoading(true)
    setError(null)
    setStep('extracting')
    try {
      const scene = await extractScene(rawInput, language)
      setSceneData(scene)
      return scene
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not read your memory. Please try again.'))
      throw e
    } finally {
      setIsLoading(false)
      setStep('idle')
    }
  }, [])

  const runConversationStep = useCallback(
    async (
      rawInput: string,
      language: string,
      scene: SceneData,
      history: ConversationQuestion[],
    ): Promise<ConversationResponse> => {
      setStep('asking')
      setIsLoading(true)
      setError(null)
      try {
        const result = await conversationStep(rawInput, language, scene, history)
        setEnrichmentScore(result.enrichment_score ?? 0)
        setConversationErrorCount(0)

        if (result.status === 'ready') {
          setIsReady(true)
          setCurrentQuestion(null)
          return result
        }

        if (result.question) {
          setCurrentQuestion(result.question)
          setIsReady(false)
        }
        return result
      } catch (e) {
        setConversationErrorCount((c) => c + 1)
        setError(apiErrorMessage(e, 'Could not continue the conversation. Please try again.'))
        throw e
      } finally {
        setIsLoading(false)
        setStep('idle')
      }
    },
    [],
  )

  const runGenerateProse = useCallback(
    async (
      rawInput: string,
      scene: SceneData,
      conversation: ConversationQuestion[],
      language: string,
      enrichmentSummary?: string,
    ) => {
      setIsLoading(true)
      setError(null)
      setStep('writing')
      try {
        const result = await generateProse(
          rawInput,
          scene,
          conversation,
          language,
          enrichmentSummary,
        )
        setProseResult(result)
        return result
      } catch (e) {
        setError(apiErrorMessage(e, 'Could not craft your page. Please try again.'))
        throw e
      } finally {
        setStep('illustrating')
      }
    },
    [],
  )

  const runGenerateImage = useCallback(async (scene: SceneData) => {
    setStep('illustrating')
    try {
      const result = await generateImage(scene)
      setImageUrl(result.image_url)
      setImagePrompt(result.image_prompt)
      return result
    } catch {
      return null
    } finally {
      setIsLoading(false)
      setStep('idle')
    }
  }, [])

  const runFullPipeline = useCallback(
    async (
      rawInput: string,
      scene: SceneData,
      conversation: ConversationQuestion[],
      language: string,
      enrichmentSummary?: string,
    ) => {
      const prose = await runGenerateProse(
        rawInput,
        scene,
        conversation,
        language,
        enrichmentSummary,
      )
      const image = await runGenerateImage(scene)
      return {
        prose,
        imageUrl: image?.image_url,
        imagePrompt: image?.image_prompt,
      }
    },
    [runGenerateProse, runGenerateImage],
  )

  const reset = useCallback(() => {
    setSceneData(null)
    setProseResult(null)
    setImageUrl(undefined)
    setImagePrompt(undefined)
    setError(null)
    setStep('idle')
    setIsLoading(false)
    setCurrentQuestion(null)
    setEnrichmentScore(0)
    setIsReady(false)
    setConversationErrorCount(0)
  }, [])

  const hydrateScene = useCallback((scene: SceneData) => {
    setSceneData(scene)
    setError(null)
    setStep('idle')
    setIsLoading(false)
  }, [])

  const hydrateConversation = useCallback(
    (history: ConversationQuestion[], summary?: string) => {
      if (summary) {
        setIsReady(true)
        setEnrichmentScore(0.85)
        setCurrentQuestion(null)
      }
      if (history.length > 0 && !summary) {
        setEnrichmentScore(Math.min(history.length * 0.15, 0.7))
      }
    },
    [],
  )

  return {
    sceneData,
    proseResult,
    imageUrl,
    imagePrompt,
    isLoading,
    error,
    step,
    currentQuestion,
    enrichmentScore,
    isReady,
    conversationErrorCount,
    runExtractScene,
    runConversationStep,
    runGenerateProse,
    runGenerateImage,
    runFullPipeline,
    reset,
    hydrateScene,
    hydrateConversation,
  }
}
