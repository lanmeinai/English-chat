export interface Character {
  id: string
  nickname: string
  realName: string
  nationality: string
  city: string
  age: number
  job: string
  personality: string[]
  chatStyle: string
  interests: string[]
  voiceLang: string
  systemPrompt: string
  avatar: string
}

export interface MessageLink {
  url: string
  title: string
  description: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  translation?: string
  showTranslation: boolean
  timestamp: number
  playedAudio?: boolean
  link?: MessageLink
}

export interface Conversation {
  characterId: string
  messages: Message[]
  lastActive: number
}

export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
