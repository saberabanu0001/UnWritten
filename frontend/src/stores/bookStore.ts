import { create } from 'zustand'
import type { Book, DraftChapter, Language } from '../lib/types'

interface BookState {
  bookId: string | null
  book: Book | null
  draft: DraftChapter | null
  chapterCount: number
  setBookId: (id: string) => void
  setBook: (book: Book) => void
  setDraft: (draft: DraftChapter | null) => void
  updateDraft: (partial: Partial<DraftChapter>) => void
  setChapterCount: (count: number) => void
}

export const useBookStore = create<BookState>((set) => ({
  bookId: localStorage.getItem('unwritten_book_id'),
  book: null,
  draft: null,
  chapterCount: 0,
  setBookId: (id) => {
    localStorage.setItem('unwritten_book_id', id)
    set({ bookId: id })
  },
  setBook: (book) => set({ book, chapterCount: book.chapters.length }),
  setDraft: (draft) => set({ draft }),
  updateDraft: (partial) =>
    set((state) => ({
      draft: state.draft ? { ...state.draft, ...partial } : null,
    })),
  setChapterCount: (count) => set({ chapterCount: count }),
}))

export function createEmptyDraft(language: Language = 'en'): DraftChapter {
  return {
    rawInput: '',
    inputMethod: 'text',
    language,
  }
}
