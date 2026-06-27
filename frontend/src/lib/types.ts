export interface User {
  id: string
  display_name: string | null
  is_guest: boolean
}

export interface Book {
  id: string
  title: string
  description?: string
  cover_style: 'classic' | 'modern' | 'minimal'
  is_private: boolean
  chapters: ChapterSummary[]
  created_at: string
}

export interface ChapterSummary {
  id: string
  number: number
  title: string
  is_sealed: boolean
  is_draft: boolean
  date: string
  preview_text: string
}

export interface Chapter {
  id: string
  book_id: string
  number: number
  title: string
  raw_input: string
  input_method: 'text' | 'voice'
  language: string
  followup_question?: string
  followup_answer?: string
  conversation_history?: ConversationQuestion[]
  enrichment_summary?: string
  scene_data?: SceneData
  prose: string
  pull_quote: string
  image_url?: string
  is_sealed: boolean
  is_draft: boolean
  created_at: string
}

export interface SceneData {
  setting: string
  people: string
  sensory: string
  emotion: string
  followup_question: string
}

export interface ConversationQuestion {
  question_id: string
  question_type: 'mcq' | 'open'
  question_text: string
  options?: string[]
  answer?: string
}

export interface ConversationResponse {
  status: 'asking' | 'ready'
  question?: ConversationQuestion
  questions_remaining?: number
  enrichment_score?: number
  summary?: string
}

export interface ProseResult {
  title: string
  prose: string
  pull_quote: string
}

export type Screen = 'home' | 'tell' | 'craft' | 'read' | 'shelf' | 'export'
export type ImageStyle = 'ink_sketch' | 'watercolor' | 'pencil'
export type Language = 'en' | 'ko' | 'bn' | 'es' | 'fr' | 'ja' | 'zh'

export interface DraftChapter {
  rawInput: string
  inputMethod: 'text' | 'voice'
  language: Language
  sceneData?: SceneData
  conversation: ConversationQuestion[]
  enrichmentSummary?: string
  title?: string
  prose?: string
  pullQuote?: string
  imageUrl?: string
  imagePrompt?: string
}
