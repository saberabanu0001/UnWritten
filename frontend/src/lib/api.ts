import axios from 'axios'
import { API_BASE } from './constants'
import type {
  Book,
  Chapter,
  DraftChapter,
  ProseResult,
  SceneData,
  User,
} from './types'

const api = axios.create({ baseURL: `${API_BASE}/api/v1` })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('unwritten_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function initGuest(): Promise<{ token: string; user: User; bookId: string }> {
  const existing = localStorage.getItem('unwritten_token')
  const bookId = localStorage.getItem('unwritten_book_id')
  if (existing && bookId) {
    return { token: existing, user: JSON.parse(localStorage.getItem('unwritten_user') || '{}'), bookId }
  }
  const { data } = await api.post('/auth/guest')
  localStorage.setItem('unwritten_token', data.access_token)
  localStorage.setItem('unwritten_user', JSON.stringify(data.user))
  localStorage.setItem('unwritten_book_id', data.book_id)
  return { token: data.access_token, user: data.user, bookId: data.book_id }
}

export async function getBook(bookId: string): Promise<Book> {
  const { data } = await api.get(`/books/${bookId}`)
  return data
}

export async function updateBook(bookId: string, updates: Partial<Book>): Promise<Book> {
  const { data } = await api.patch(`/books/${bookId}`, updates)
  return data
}

export async function getChapter(chapterId: string): Promise<Chapter> {
  const { data } = await api.get(`/chapters/${chapterId}`)
  return data
}

export async function saveChapter(bookId: string, draft: DraftChapter): Promise<Chapter> {
  const { data } = await api.post(`/books/${bookId}/chapters`, {
    raw_input: draft.rawInput,
    input_method: draft.inputMethod,
    language: draft.language,
    followup_question: draft.followupQuestion,
    followup_answer: draft.followupAnswer,
    scene_data: draft.sceneData,
    title: draft.title,
    prose: draft.prose,
    pull_quote: draft.pullQuote,
    image_url: draft.imageUrl,
    image_prompt: draft.imagePrompt,
    is_draft: false,
  })
  return data
}

export async function updateChapter(chapterId: string, updates: Record<string, unknown>): Promise<Chapter> {
  const { data } = await api.patch(`/chapters/${chapterId}`, updates)
  return data
}

export async function extractScene(rawInput: string, language: string): Promise<SceneData> {
  const { data } = await api.post('/ai/extract-scene', { raw_input: rawInput, language })
  return data
}

export async function generateProse(
  rawInput: string,
  sceneData: SceneData,
  followupAnswer: string | undefined,
  language: string,
): Promise<ProseResult> {
  const { data } = await api.post('/ai/generate-prose', {
    raw_input: rawInput,
    scene_data: sceneData,
    followup_answer: followupAnswer,
    language,
  })
  return data
}

export async function generateImage(sceneData: SceneData, style = 'ink_sketch'): Promise<{ image_url: string; image_prompt: string }> {
  const { data } = await api.post('/ai/generate-image', { scene_data: sceneData, style })
  return data
}

export async function rewriteChapter(chapterId: string): Promise<ProseResult> {
  const { data } = await api.post(`/ai/rewrite/${chapterId}`)
  return data
}

export async function exportPdf(bookId: string): Promise<Blob> {
  const { data } = await api.get(`/export/${bookId}/pdf`, { responseType: 'blob' })
  return data
}

export function mediaUrl(path?: string): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}

export default api
