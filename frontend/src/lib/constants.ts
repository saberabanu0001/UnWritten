export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'ko', label: 'KO' },
  { code: 'bn', label: 'BN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'ja', label: 'JA' },
  { code: 'zh', label: 'ZH' },
] as const

export const SPEECH_LANG_MAP: Record<string, string> = {
  en: 'en-US',
  ko: 'ko-KR',
  bn: 'bn-BD',
  es: 'es-ES',
  fr: 'fr-FR',
  ja: 'ja-JP',
  zh: 'zh-CN',
}
