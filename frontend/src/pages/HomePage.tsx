import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ornament } from '../components/book/Ornament'
import { Button } from '../components/ui/Button'
import { initGuest, getBook } from '../lib/api'
import { useBookStore } from '../stores/bookStore'

export function HomePage() {
  const navigate = useNavigate()
  const { chapterCount, setBookId, setChapterCount } = useBookStore()

  useEffect(() => {
    async function load() {
      const { bookId } = await initGuest()
      setBookId(bookId)
      const book = await getBook(bookId)
      setChapterCount(book.chapters.filter((c) => !c.is_draft).length)
    }
    load()
  }, [setBookId, setChapterCount])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pb-12">
      <p className="text-label uppercase text-ink-muted tracking-[0.5em] mb-4">
        A private memoir
      </p>
      <h1 className="font-display text-5xl text-ink mb-6">Unwritten</h1>

      <Ornament className="mb-8" />

      <p className="font-body italic text-ink-light text-center text-prose max-w-xs mb-16 leading-relaxed">
        &ldquo;Everyone carries stories they never tell. This is where they become real.&rdquo;
      </p>

      <div className="w-full space-y-3">
        <Button fullWidth onClick={() => navigate('/tell')}>
          Tell a story
        </Button>
        <Button variant="secondary" fullWidth onClick={() => navigate('/shelf')}>
          My book · {chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}
        </Button>
      </div>
    </div>
  )
}
