import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { StoryInput } from '../components/input/StoryInput'
import { VoiceButton } from '../components/input/VoiceButton'
import { LanguageSelect } from '../components/input/LanguageSelect'
import { Button } from '../components/ui/Button'
import { useVoiceInput } from '../hooks/useVoiceInput'
import { createEmptyDraft, useBookStore } from '../stores/bookStore'
import type { Language } from '../lib/types'

export function TellPage() {
  const navigate = useNavigate()
  const { setDraft } = useBookStore()
  const [text, setText] = useState('')
  const [language, setLanguage] = useState<Language>('en')
  const [inputMethod, setInputMethod] = useState<'text' | 'voice'>('text')

  const handleTranscript = useCallback((transcript: string) => {
    setText(transcript)
    setInputMethod('voice')
  }, [])

  const { isListening, startListening, stopListening, isSupported } = useVoiceInput(
    language,
    handleTranscript,
  )

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      setInputMethod('voice')
      startListening()
    }
  }

  const handleContinue = () => {
    const draft = createEmptyDraft(language)
    draft.rawInput = text.trim()
    draft.inputMethod = inputMethod
    setDraft(draft)
    navigate('/craft')
  }

  const hasText = text.trim().length > 0

  return (
    <div className="pb-12">
      <Header backTo="/" />

      <h1 className="font-display text-2xl text-ink mb-2">Tell me a memory</h1>
      <p className="font-body italic text-ink-muted text-prose mb-8">
        A moment, a place, a person. Start anywhere.
      </p>

      <div className="space-y-4">
        <StoryInput value={text} onChange={setText} />
        <VoiceButton
          isListening={isListening}
          isSupported={isSupported}
          onToggle={handleVoiceToggle}
        />
        <LanguageSelect value={language} onChange={setLanguage} />
        <Button fullWidth disabled={!hasText} onClick={handleContinue}>
          Continue →
        </Button>
      </div>
    </div>
  )
}
