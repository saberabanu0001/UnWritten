import { useCallback, useState } from 'react'
import axios from 'axios'
import { extractScene, generateImage, generateProse } from '../lib/api'
import type { ProseResult, SceneData } from '../lib/types'

type AIStep = 'idle' | 'extracting' | 'writing' | 'illustrating'

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

  const runGenerateProse = useCallback(
    async (
      rawInput: string,
      scene: SceneData,
      followupAnswer: string | undefined,
      language: string,
    ) => {
      setIsLoading(true)
      setError(null)
      setStep('writing')
      try {
        const result = await generateProse(rawInput, scene, followupAnswer, language)
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
      followupAnswer: string | undefined,
      language: string,
    ) => {
      const prose = await runGenerateProse(rawInput, scene, followupAnswer, language)
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
  }, [])

  const hydrateScene = useCallback((scene: SceneData) => {
    setSceneData(scene)
    setError(null)
    setStep('idle')
    setIsLoading(false)
  }, [])

  return {
    sceneData,
    proseResult,
    imageUrl,
    imagePrompt,
    isLoading,
    error,
    step,
    runExtractScene,
    runGenerateProse,
    runGenerateImage,
    runFullPipeline,
    reset,
    hydrateScene,
  }
}
