import { Ornament } from './Ornament'
import { Illustration } from './Illustration'
import { PullQuote } from './PullQuote'
import { toRoman } from '../../lib/roman'

interface BookPageChapter {
  number: number
  title: string
  prose: string
  pull_quote?: string
  pullQuote?: string
  image_url?: string
  imageUrl?: string
}

interface BookPageProps {
  chapter: BookPageChapter
  imageLoading?: boolean
}

export function BookPage({ chapter, imageLoading }: BookPageProps) {
  const pullQuote = chapter.pull_quote || chapter.pullQuote || ''
  const imageUrl = chapter.image_url || chapter.imageUrl
  const paragraphs = (chapter.prose || '').split('\n\n').filter(Boolean)

  return (
    <article className="bg-paper shadow-book rounded-sm px-6 py-8 animate-fade-in">
      <p className="text-label uppercase text-ink-muted text-center mb-1">Chapter</p>
      <h2 className="font-display text-chapter-num text-center text-ink">
        {toRoman(chapter.number)}
      </h2>
      <h3 className="font-display italic text-accent text-chapter-title text-center mt-2 mb-4">
        {chapter.title}
      </h3>

      <Ornament size="sm" className="text-center mb-6" />

      <div className="book-page-body clearfix">
        <Illustration src={imageUrl} loading={imageLoading} />
        {paragraphs.map((para, i) => (
          <p
            key={i}
            className={`book-paragraph font-body text-prose text-ink ${i > 0 ? 'mt-4' : ''}`}
          >
            {para}
          </p>
        ))}
      </div>

      <PullQuote quote={pullQuote} />

      <Ornament size="sm" className="text-center mt-4" />
    </article>
  )
}
