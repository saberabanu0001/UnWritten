import { useCallback, useState } from 'react'
import {
  exportPdf,
  getBook,
  getChapter,
  saveChapter,
  updateBook,
  updateChapter,
} from '../lib/api'
import type { Book, Chapter, DraftChapter } from '../lib/types'

export function useBook(bookId: string | null) {
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBook = useCallback(async () => {
    if (!bookId) return null
    setLoading(true)
    try {
      const data = await getBook(bookId)
      setBook(data)
      return data
    } catch {
      setError('Could not load your book.')
      return null
    } finally {
      setLoading(false)
    }
  }, [bookId])

  const fetchChapter = useCallback(async (chapterId: string): Promise<Chapter | null> => {
    try {
      return await getChapter(chapterId)
    } catch {
      return null
    }
  }, [])

  const save = useCallback(
    async (draft: DraftChapter) => {
      if (!bookId) return null
      return saveChapter(bookId, draft)
    },
    [bookId],
  )

  const patchChapter = useCallback(async (chapterId: string, updates: Record<string, unknown>) => {
    return updateChapter(chapterId, updates)
  }, [])

  const togglePrivacy = useCallback(
    async (isPrivate: boolean) => {
      if (!bookId) return
      const updated = await updateBook(bookId, { is_private: isPrivate })
      setBook(updated)
    },
    [bookId],
  )

  const downloadPdf = useCallback(async () => {
    if (!bookId) return
    const blob = await exportPdf(bookId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'unwritten-book.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }, [bookId])

  return {
    book,
    loading,
    error,
    fetchBook,
    fetchChapter,
    save,
    patchChapter,
    togglePrivacy,
    downloadPdf,
  }
}
