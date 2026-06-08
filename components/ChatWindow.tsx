'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Character, Message } from '@/types'
import { chatCompletion, translateToChinese, parseAIMessage, getLinkIcon, getLinkColor, tokenizeText } from '@/lib/deepseek'
import { detectLevel, getLevelDescription, getLevelPrompt } from '@/lib/levelDetector'
import { addMessage, getMessages } from '@/lib/memoryStore'
import { speak } from '@/lib/tts'
import { getSettings } from '@/lib/settings'
import CharacterCard from './CharacterCard'
import VoiceInput from './VoiceInput'

interface Props {
  character: Character
  showAllTranslations: boolean
  onToggleAllTranslations: () => void
  onProactiveMessage: (characterId: string, messages: Message[]) => void
  isActive: boolean
}

const AVATAR_COLORS = [
  '#3390ec', '#2ecc71', '#e74c3c', '#9b59b6',
  '#f39c12', '#1abc9c', '#e67e22', '#34495e',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getAvatarInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}

export default function ChatWindow({ character, showAllTranslations, onToggleAllTranslations, onProactiveMessage, isActive }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [level, setLevel] = useState('--')
  const [hint, setHint] = useState<{ text: string; type: 'english' | 'chinese' } | null>(null)
  const [hintLoading, setHintLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesRef = useRef<Message[]>([])

  const avatarColor = getAvatarColor(character.nickname)
  const avatarInitial = getAvatarInitial(character.nickname)

  useEffect(() => {
    setMessages(getMessages(character.id).map((m) => ({ ...m })))
  }, [character.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    inputRef.current?.focus()
  }, [character.id])

  // Keep messagesRef in sync with latest messages
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Proactive message timer — only fires when conversation is idle for 5+ minutes
  useEffect(() => {
    if (!isActive) return
    if (messages.length === 0) return

    const lastMsg = messages[messages.length - 1]
    const minutesSince = (Date.now() - lastMsg.timestamp) / 1000 / 60
    if (minutesSince < 5) return

    const delay = 30000 + Math.random() * 150000
    const timer = setTimeout(async () => {
      // Double-check before firing
      const current = messagesRef.current
      if (current.length === 0) return
      const last = current[current.length - 1]
      // Skip if last message is from assistant — user hasn't replied yet
      if (last.role === 'assistant') return
      const elapsed = (Date.now() - last.timestamp) / 1000 / 60
      if (elapsed < 5) return

      const allMsgs = getMessages(character.id)
      const proactivePrompt = `The conversation has been quiet for a while.
Send a spontaneous message to your friend — share something you just thought of, saw, heard, or felt like saying.
It could be: a random thought, a meme reaction, asking what they're up to, sharing a song you're listening to, or reacting to something in your day.
Keep it short and natural like a real text. Use [MSG] if you want to send 2-3 bubbles.`

      const apiMessages: { role: string; content: string }[] = [
        { role: 'system', content: character.systemPrompt },
        ...allMsgs.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: proactivePrompt },
      ]

      try {
        const reply = await chatCompletion(apiMessages)
        const inserted = await handleAIResponseInsert(reply, false)
        if (inserted.length > 0) {
          onProactiveMessage(character.id, inserted)
        }
      } catch {
        // silent fail
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [character.id, isActive])

  // Handle AI response — splits by [MSG] and inserts with typing delays
  const handleAIResponseInsert = useCallback(async (
    content: string,
    isUserReply: boolean
  ): Promise<Message[]> => {
    const parts = content.split('[MSG]').map((p) => p.trim()).filter((p) => p.length > 0)
    if (parts.length === 0) return []

    const inserted: Message[] = []

    for (let i = 0; i < parts.length; i++) {
      setIsTyping(true)

      const delay = Math.min(600 + parts[i].length * 40 + Math.random() * 300, 3000)
      await new Promise<void>((resolve) => setTimeout(resolve, delay))

      const parsed = parseAIMessage(parts[i])
      const msgId = (Date.now() + i).toString()
      const translation = await translateToChinese(parsed.text)

      const aiMsg: Message = {
        id: msgId,
        role: 'assistant',
        content: parsed.text.replace(/\n+/g, ' ').trim(),
        translation,
        showTranslation: showAllTranslations,
        timestamp: Date.now(),
        playedAudio: false,
        link: parsed.link,
      }

      setMessages((prev) => [...prev, aiMsg])
      if (isUserReply) {
        addMessage(character.id, aiMsg)
      }
      inserted.push(aiMsg)

      setIsTyping(false)

      if (i < parts.length - 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, 400))
      }
    }

    // TTS for first message only
    if (inserted.length > 0) {
      speak(inserted[0].content, character.voiceLang)
    }

    return inserted
  }, [character.id, character.voiceLang, showAllTranslations])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setHint(null)
    setHintLoading(false)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setLoading(true)

    const detectedLevel = detectLevel(text)
    setLevel(getLevelDescription(detectedLevel))

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      showTranslation: false,
    }
    setMessages((prev) => [...prev, userMsg])
    addMessage(character.id, userMsg)

    const allMsgs = getMessages(character.id)
    const apiMessages: { role: string; content: string }[] = [
      { role: 'system', content: character.systemPrompt + getLevelPrompt(detectedLevel) },
      ...allMsgs.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    try {
      const reply = await chatCompletion(apiMessages)
      await handleAIResponseInsert(reply, true)
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, something went wrong: ${err.message}. Please try again.`,
        timestamp: Date.now(),
        showTranslation: false,
      }
      setMessages((prev) => [...prev, errorMsg])
      addMessage(character.id, errorMsg)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, character, showAllTranslations, handleAIResponseInsert])

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => ({
        ...m,
        showTranslation: m.role === 'assistant' ? showAllTranslations : m.showTranslation,
      }))
    )
  }, [showAllTranslations])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleVoiceResult = (text: string) => {
    setInput((prev) => prev + text)
  }

  function detectLanguage(text: string): 'chinese' | 'english' | 'mixed' | 'empty' {
    if (!text.trim()) return 'empty'
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length
    if (chineseChars > englishChars) return 'chinese'
    if (englishChars > 0) return 'english'
    return 'empty'
  }

  const fetchHint = useCallback(async (text: string) => {
    const lang = detectLanguage(text)
    if (lang === 'empty' || lang === 'mixed') return

    setHintLoading(true)

    const systemPrompt =
      lang === 'chinese'
        ? `You are a translation assistant. The user is learning English. Translate their Chinese input into natural English they could send in a chat. Reply with ONLY the English translation, nothing else. No explanations.`
        : `You are an English grammar and spelling checker. Check the user's English input for spelling mistakes and grammar errors. If correct, reply with exactly: "✓ Looks good!" If there are errors, reply with the corrected version only, prefixed with "→ ". Example: "→ How are you doing today?" No explanations, no extra text.`

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getSettings().apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
          max_tokens: 100,
        }),
      })
      const data = await response.json()
      const hintText = data.choices?.[0]?.message?.content?.trim()
      if (hintText) {
        setHint({ text: hintText, type: lang })
      }
    } catch {
      // Silently fail — hint is non-critical
    } finally {
      setHintLoading(false)
    }
  }, [])

  const handleInputChange = (value: string) => {
    setInput(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (!value.trim()) {
      setHint(null)
      return
    }
    debounceTimer.current = setTimeout(() => {
      fetchHint(value)
    }, 600)
  }

  return (
    <div className="flex flex-col h-full bg-telegram-bg dark:bg-telegram-darkBg">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-telegram-darkSidebar border-b border-telegram-border dark:border-telegram-darkBorder shadow-sm">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0" style={{ backgroundColor: avatarColor }}>
          {avatarInitial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-telegram-text dark:text-telegram-darkText truncate">
            {character.nickname}
          </div>
          <div className="text-xs text-telegram-secondary dark:text-telegram-darkSecondary flex items-center gap-1 min-w-0">
            <span className="truncate">{character.nationality} · {character.city}</span>
            <span className="opacity-40 flex-shrink-0">·</span>
            <span className="flex-shrink-0">Level: {level}</span>
          </div>
        </div>
        <button
          onClick={onToggleAllTranslations}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex-shrink-0 ${
            showAllTranslations
              ? 'bg-telegram-accent border-telegram-accent text-white'
              : 'border-telegram-border dark:border-telegram-darkBorder text-telegram-secondary dark:text-telegram-darkSecondary hover:border-telegram-accent hover:text-telegram-accent'
          }`}
          title="Toggle all translations"
        >
          {showAllTranslations ? '✓ All CN' : 'All CN'}
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: avatarColor + '22' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: avatarColor }}>
                {avatarInitial}
              </div>
            </div>
            <p className="text-telegram-secondary dark:text-telegram-darkSecondary text-sm font-medium">
              Start a conversation with {character.nickname}
            </p>
            <p className="text-telegram-secondary/60 dark:text-telegram-darkSecondary/60 text-xs mt-1">
              Chat in English to practice — no translation needed!
            </p>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="max-w-md mx-auto mt-2">
            <CharacterCard character={character} />
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar — AI only */}
              {!isUser && (
                <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: avatarColor }}>
                  <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                    {avatarInitial}
                  </div>
                </div>
              )}

              {/* Bubble wrapper */}
              <div className={`max-w-[70%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-telegram-ownBubble dark:bg-telegram-darkOwnBubble text-black dark:text-white rounded-br-sm'
                      : 'bg-white dark:bg-telegram-darkBubble text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {tokenizeText(msg.content).map((seg, i) =>
                      seg.type === 'url' ? (
                        <a
                          key={i}
                          href={seg.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 dark:text-blue-400 underline break-all"
                        >
                          {(() => { try { return new URL(seg.content).hostname } catch { return seg.content } })()}
                        </a>
                      ) : (
                        <span key={i}>{seg.content}</span>
                      )
                    )}
                  </div>

                  {msg.translation && msg.showTranslation && (
                    <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-600/50 text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed">
                      {msg.translation}
                    </div>
                  )}

                  {msg.link && (
                    <a
                      href={msg.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors max-w-xs block no-underline"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getLinkColor(msg.link.url) }}
                      >
                        <span className="text-white text-lg">{getLinkIcon(msg.link.url)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                          {msg.link.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {msg.link.description}
                        </div>
                        <div className="text-xs text-blue-400 truncate mt-0.5">
                          {(() => { try { return new URL(msg.link.url).hostname } catch { return msg.link.url } })()}
                        </div>
                      </div>
                      <span className="text-gray-300 flex-shrink-0">→</span>
                    </a>
                  )}
                </div>

                {/* Timestamp row */}
                <div
                  className={`flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 dark:text-gray-500 ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {!isUser && msg.translation && (
                    <button
                      onClick={() => setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, showTranslation: !m.showTranslation } : m))}
                      className={`transition-colors ${msg.showTranslation ? 'text-telegram-accent' : 'text-gray-400 hover:text-telegram-accent'}`}
                    >
                      {msg.showTranslation ? 'Hide CN' : 'CN'}
                    </button>
                  )}
                  {!isUser && !msg.translation && (
                    <button
                      onClick={async () => {
                        const { translateToChinese } = await import('@/lib/deepseek')
                        const t = await translateToChinese(msg.content)
                        setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, translation: t, showTranslation: true } : m))
                      }}
                      className="text-gray-400 hover:text-telegram-accent transition-colors"
                    >
                      Translate
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator — shown while AI is "typing" */}
        {isTyping && (
          <div className="flex items-end gap-2 mb-4 animate-fade-in">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: avatarColor }}>
              {avatarInitial}
            </div>
            <div className="bg-white dark:bg-telegram-darkBubble px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce-dot"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-3 py-2.5 bg-white dark:bg-telegram-darkSidebar border-t border-telegram-border dark:border-telegram-darkBorder">
        {/* Real-time hint bar */}
        {hint && input.trim() && (
          <div
            className={`mb-2 px-3 py-2 text-sm rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
              hint.type === 'english'
                ? hint.text.startsWith('✓')
                  ? 'bg-green-50 text-green-600'
                  : 'bg-yellow-50 text-yellow-700'
                : 'bg-blue-50 text-blue-600'
            }`}
            onClick={() => {
              if (!hint.text.startsWith('✓')) {
                const cleaned = hint.text.replace(/^→\s*/, '')
                setInput(cleaned)
              }
            }}
          >
            {hintLoading ? (
              <span className="animate-pulse">···</span>
            ) : (
              <>
                <span>{hint.type === 'chinese' ? '🌐' : hint.text.startsWith('✓') ? '✓' : '✎'}</span>
                <span className="flex-1 line-clamp-2">{hint.text.replace(/^→\s*/, '')}</span>
                {!hint.text.startsWith('✓') && (
                  <span className="text-xs opacity-60 flex-shrink-0">点击填入</span>
                )}
              </>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
          <VoiceInput onResult={handleVoiceResult} disabled={loading} />
          <div className="flex-1 flex items-center bg-telegram-bg dark:bg-telegram-darkBg rounded-2xl border border-telegram-border dark:border-telegram-darkBorder focus-within:border-telegram-accent transition-colors px-4 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-transparent outline-none text-sm resize-none text-telegram-text dark:text-telegram-darkText placeholder:text-gray-400 dark:placeholder:text-gray-500 max-h-32"
              disabled={loading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-telegram-accent hover:bg-telegram-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0 text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
