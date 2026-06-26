import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { BookPage } from '../components/book/BookPage'
import { Button } from '../components/ui/Button'
import { useAI } from '../hooks/useAI'
import { useBook } from '../hooks/useBook'
import { generateImage, getChapter, saveChapter } from '../lib/api'
import { useBookStore } from '../stores/bookStore'
import type { Chapter } from '../lib/types'

export function ReadPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isPreview = id === 'preview'
  const { draft, bookId, updateDraft, setChapterCount } = useBookStore()
  const { fetchBook } = useBook(bookId)
  const { runFullPipeline } = useAI()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [saving, setSaving] = useState(false)
  const [rewriting, setRewriting] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)

  const draftImageUrl = draft?.imageUrl
  const draftSceneData = draft?.sceneData
  const draftProse = draft?.prose

  useEffect(() => {
    if (!isPreview) {
      if (id) getChapter(id).then(setChapter)
      return
    }

    if (!draftProse || draftImageUrl || !draftSceneData) return

    let active = true
    setImageLoading(true)
    generateImage(draftSceneData)
      .then((result) => {
        if (!active) return
        if (result.image_url && !result.image_url.includes('placeholder')) {
          updateDraft({ imageUrl: result.image_url, imagePrompt: result.image_prompt })
        }
      })
      .finally(() => {
        if (active) setImageLoading(false)
      })

    return () => {
      active = false
    }
  }, [isPreview, id, draftProse, draftImageUrl, draftSceneData, updateDraft])

  const previewChapter = isPreview && draftProse
    ? {
        number: 1,
        title: draft.title || 'Untitled',
        prose: draft.prose!,
        pullQuote: draft.pullQuote,
        imageUrl: draft.imageUrl,
      }
    : null

  const displayChapter = previewChapter || (chapter
    ? {
        number: chapter.number,
        title: chapter.title,
        prose: chapter.prose,
        pullQuote: chapter.pull_quote,
        imageUrl: chapter.image_url,
      }
    : null)

  const handleSave = async () => {
    if (!draft || !bookId) return
    setSaving(true)
    try {
      const toSave = { ...draft }
      if (!toSave.imageUrl && toSave.sceneData) {
        const img = await generateImage(toSave.sceneData)
        if (img.image_url && !img.image_url.includes('placeholder')) {
          toSave.imageUrl = img.image_url
          toSave.imagePrompt = img.image_prompt
        }
      }
      await saveChapter(bookId, toSave)
      const book = await fetchBook()
      if (book) setChapterCount(book.chapters.filter((c) => !c.is_draft).length)
      navigate('/shelf')
    } finally {
      setSaving(false)
    }
  }

  const handleRewrite = async () => {
    if (!draft?.sceneData) return
    setRewriting(true)
    try {
      const result = await runFullPipeline(
        draft.rawInput,
        draft.sceneData,
        draft.followupAnswer,
        draft.language,
      )
      updateDraft({
        title: result.prose.title,
        prose: result.prose.prose,
        pullQuote: result.prose.pull_quote,
        imageUrl: result.imageUrl,
        imagePrompt: result.imagePrompt,
      })
    } finally {
      setRewriting(false)
    }
  }

  if (!displayChapter) {
    return (
      <div>
        <Header backTo={isPreview ? '/craft' : '/shelf'} />
        <p className="font-body italic text-ink-muted text-center mt-20">Loading...</p>
      </div>
    )
  }

  const hasImage = Boolean(displayChapter.imageUrl && !displayChapter.imageUrl.includes('placeholder'))

  return (
    <div className="pb-12 animate-fade-in">
      <Header
        backTo={isPreview ? '/craft' : '/shelf'}
        rightLabel={isPreview ? 'Preview — not saved yet' : undefined}
      />

      <BookPage
        chapter={displayChapter}
        imageLoading={imageLoading && !hasImage}
      />

      <div className="flex gap-3 mt-8">
        {isPreview ? (
          <>
            <Button fullWidth className="flex-[2]" loading={saving} onClick={handleSave}>
              Save to my book
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              loading={rewriting}
              onClick={handleRewrite}
            >
              Rewrite
            </Button>
          </>
        ) : (
          <Button fullWidth onClick={() => navigate('/shelf')}>
            Back to shelf
          </Button>
        )}
      </div>
    </div>
  )
}
