import { Conversation, Message } from '@/types'

const STORAGE_KEY = 'english_chat_conversations'
const MAX_MESSAGES = 50

export function loadConversations(): Record<string, Conversation> {
  if (typeof window === 'undefined') return {}
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

export function saveConversations(conversations: Record<string, Conversation>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  } catch {
    // Storage full or unavailable
  }
}

export function getConversation(characterId: string): Conversation {
  const all = loadConversations()
  if (all[characterId]) return all[characterId]
  const conv: Conversation = {
    characterId,
    messages: [],
    lastActive: Date.now(),
  }
  all[characterId] = conv
  saveConversations(all)
  return conv
}

export function addMessage(characterId: string, msg: Message): Message[] {
  const all = loadConversations()
  const conv = all[characterId] || { characterId, messages: [], lastActive: Date.now() }
  conv.messages.push(msg)
  conv.lastActive = Date.now()
  // Keep only the last MAX_MESSAGES
  if (conv.messages.length > MAX_MESSAGES) {
    conv.messages = conv.messages.slice(-MAX_MESSAGES)
  }
  all[characterId] = conv
  saveConversations(all)
  return conv.messages
}

export function getMessages(characterId: string): Message[] {
  return getConversation(characterId).messages
}

export function deleteConversation(characterId: string) {
  const all = loadConversations()
  delete all[characterId]
  saveConversations(all)
}

export function getAllConversations(): Record<string, Conversation> {
  return loadConversations()
}
