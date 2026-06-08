'use client'

import { useState, useEffect } from 'react'
import { Character, Conversation, Message } from '@/types'
import { getPresetCharacters } from '@/lib/characters'
import { loadConversations, saveConversations, addMessage } from '@/lib/memoryStore'
import { chatCompletion, parseAIMessage } from '@/lib/deepseek'
import { hasApiKey, getSettings } from '@/lib/settings'
import ChatList from '@/components/ChatList'
import ChatWindow from '@/components/ChatWindow'
import SetupScreen from '@/components/SetupScreen'

export default function HomePage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Record<string, Conversation>>({})
  const [darkMode, setDarkMode] = useState<boolean | null>(null)
  const [showAllTranslations, setShowAllTranslations] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [apiReady, setApiReady] = useState(false)

  useEffect(() => {
    setApiReady(hasApiKey())
  }, [])

  useEffect(() => {
    if (!apiReady) return

    const presets = getPresetCharacters()
    const stored = loadConversations()
    setCharacters(presets)
    setConversations(stored)

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(prefersDark)
  }, [apiReady])

  useEffect(() => {
    if (Object.keys(conversations).length > 0) {
      saveConversations(conversations)
    }
  }, [conversations])

  useEffect(() => {
    if (darkMode === null) return
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const handleCreateCharacter = (char: Character) => {
    setCharacters((prev) => {
      if (prev.find((c) => c.id === char.id)) return prev
      return [char, ...prev]
    })
    setActiveId(char.id)
  }

  const handleSelect = (id: string) => {
    setActiveId(id)
    setSidebarVisible(false)
    setUnreadCounts((prev) => {
      const next = { ...prev }; delete next[id]; return next
    })
    document.title = 'English Chat'
  }

  const handleDeleteCharacter = (id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id))
    setConversations((prev) => { const next = { ...prev }; delete next[id]; return next })
    setUnreadCounts((prev) => { const next = { ...prev }; delete next[id]; return next })
    if (activeId === id) {
      const remaining = characters.filter((c) => c.id !== id)
      setActiveId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const handleProactiveMessage = (characterId: string, messages: Message[]) => {
    if (activeId !== characterId) {
      setUnreadCounts((prev) => ({ ...prev, [characterId]: (prev[characterId] || 0) + 1 }))
      setCharacters((prev) => {
        const char = prev.find((c) => c.id === characterId)
        if (!char) return prev
        return [char, ...prev.filter((c) => c.id !== characterId)]
      })
      document.title = 'New message - English Chat'
    }
    for (const msg of messages) addMessage(characterId, msg)
    setConversations((prev) => {
      const conv = prev[characterId] || { characterId, messages: [], lastActive: Date.now() }
      return { ...prev, [characterId]: { ...conv, messages: [...conv.messages, ...messages], lastActive: Date.now() } }
    })
  }

  const activeChar = characters.find((c) => c.id === activeId)

  if (!apiReady) {
    return <SetupScreen onReady={() => setApiReady(true)} darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} />
  }

  return (
    <div className="flex h-full bg-white dark:bg-telegram-darkBg" suppressHydrationWarning>
      <div className={`${sidebarVisible ? 'w-full md:w-80' : 'w-0'} md:w-80 flex-shrink-0 transition-all duration-300 overflow-hidden border-r border-telegram-border dark:border-telegram-darkBorder`}>
        <ChatList
          characters={characters}
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onCreateCharacter={handleCreateCharacter}
          onDeleteCharacter={handleDeleteCharacter}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(!darkMode)}
          unreadCounts={unreadCounts}
        />
      </div>

      <div className={`flex-1 flex flex-col ${!sidebarVisible ? 'w-full' : 'hidden md:flex'}`}>
        {activeChar ? (
          <>
            <button onClick={() => setSidebarVisible(true)} className="md:hidden absolute top-3 left-3 z-10 p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow text-telegram-secondary dark:text-telegram-darkSecondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <ChatWindow
              key={activeChar.id}
              character={activeChar}
              showAllTranslations={showAllTranslations}
              onToggleAllTranslations={() => setShowAllTranslations(!showAllTranslations)}
              onProactiveMessage={handleProactiveMessage}
              isActive={true}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-telegram-bg dark:bg-telegram-darkBg p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-telegram-accent"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-telegram-text dark:text-telegram-darkText mb-2">Practice English with AI</h2>
              <p className="text-telegram-secondary dark:text-telegram-darkSecondary text-sm mb-6">Chat with AI-powered characters from around the world. Pick a conversation to start practicing!</p>
              <div className="grid grid-cols-2 gap-2 text-left text-xs text-telegram-secondary dark:text-telegram-darkSecondary">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-3"><span>🌍</span><span>10+ nationalities</span></div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-3"><span>🎤</span><span>Voice input & TTS</span></div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-3"><span>📊</span><span>Level detection (A1-C2)</span></div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-3"><span>🈳</span><span>Instant translations</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
