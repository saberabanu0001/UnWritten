import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ornament } from '../components/book/Ornament'
import { ChapterCard } from '../components/book/ChapterCard'
import { NewChapterCard } from '../components/book/NewChapterCard'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { PrivateToggle } from '../components/ui/PrivateToggle'
import { useBook } from '../hooks/useBook'
import { initGuest } from '../lib/api'
import { useBookStore } from '../stores/bookStore'

export function ShelfPage() {
  const navigate = useNavigate()
  const { bookId, setBookId, setChapterCount } = useBookStore()
  const { book, fetchBook, togglePrivacy, downloadPdf } = useBook(bookId)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function load() {
      let id = bookId
      if (!id) {
        const guest = await initGuest()
        id = guest.bookId
        setBookId(id)
      }
      const data = await fetchBook()
      if (data) setChapterCount(data.chapters.filter((c) => !c.is_draft).length)
    }
    load()
  }, [bookId, setBookId, fetchBook, setChapterCount])

  const chapters = book?.chapters.filter((c) => !c.is_draft) || []
  const started = book?.created_at
    ? new Date(book.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadPdf()
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="pb-12">
      <Header backTo="/" backLabel="← Home" />

      <h1 className="font-display text-3xl text-ink mb-1">
        {book?.title || 'My Unwritten Book'}
      </h1>
      <p className="font-body italic text-ink-muted text-sm mb-6">
        {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
        {started && ` · Started ${started}`}
      </p>

      <Ornament className="text-center mb-8" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {chapters.map((ch) => (
          <ChapterCard
            key={ch.id}
            chapter={ch}
            onClick={() => navigate(`/read/${ch.id}`)}
          />
        ))}
        <NewChapterCard />
      </div>

      <Button fullWidth loading={downloading} onClick={handleDownload}>
        📥 Download as PDF book
      </Button>

      {book && (
        <PrivateToggle
          isPrivate={book.is_private}
          onChange={(val) => togglePrivacy(val)}
        />
      )}
    </div>
  )
}
