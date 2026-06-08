'use client'

import { useState } from 'react'
import { Character, Conversation } from '@/types'
import { generateRandomCharacter } from '@/lib/characters'

interface Props {
  characters: Character[]
  conversations: Record<string, Conversation>
  activeId: string | null
  onSelect: (id: string) => void
  onCreateCharacter: (c: Character) => void
  onDeleteCharacter: (id: string) => void
  darkMode: boolean | null
  onToggleDark: () => void
  unreadCounts: Record<string, number>
}

export default function ChatList({
  characters,
  conversations,
  activeId,
  onSelect,
  onCreateCharacter,
  onDeleteCharacter,
  darkMode,
  onToggleDark,
  unreadCounts,
}: Props) {
  const [showAddMenu, setShowAddMenu] = useState(false)

  const getLastMessage = (c: Character): string => {
    const conv = conversations[c.id]
    if (!conv || conv.messages.length === 0) return c.interests.slice(0, 2).join(', ')
    const last = conv.messages[conv.messages.length - 1]
    const prefix = last.role === 'user' ? 'You: ' : ''
    return prefix + last.content.slice(0, 40) + (last.content.length > 40 ? '...' : '')
  }

  const getLastTime = (c: Character): string => {
    const conv = conversations[c.id]
    if (!conv || conv.messages.length === 0) return ''
    return new Date(conv.lastActive).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-full bg-telegram-sidebar dark:bg-telegram-darkSidebar border-r border-telegram-border dark:border-telegram-darkBorder">
      {/* Header */}
      <div className="p-4 border-b border-telegram-border dark:border-telegram-darkBorder flex items-center justify-between">
        <h1 className="font-bold text-lg text-telegram-text dark:text-telegram-darkText" suppressHydrationWarning>
          English Chat
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg text-telegram-secondary dark:text-telegram-darkSecondary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Toggle theme"
          >
            {darkMode ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Add button */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="p-2 rounded-lg text-telegram-secondary dark:text-telegram-darkSecondary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="New conversation"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            {showAddMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1 animate-fade-in">
                <button
                  onClick={() => {
                    onCreateCharacter(generateRandomCharacter())
                    setShowAddMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  Random Character
                </button>
                {characters
                  .filter(
                    (c) => !conversations[c.id] || conversations[c.id].messages.length === 0
                  )
                  .slice(0, 8)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSelect(c.id)
                        setShowAddMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-2"
                    >
                      <img suppressHydrationWarning src={c.avatar} alt="" className="w-5 h-5 rounded-full" />
                      {c.nickname} ({c.nationality})
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {characters.map((c) => {
          const unread = unreadCounts[c.id] || 0
          return (
            <div key={c.id} className="relative group">
              <div
                onClick={() => onSelect(c.id)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-telegram-border/50 dark:border-telegram-darkBorder/50 ${
                  activeId === c.id
                    ? 'bg-blue-50 dark:bg-blue-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                {/* Avatar with unread badge */}
                <div className="relative flex-shrink-0">
                  <img
                    suppressHydrationWarning
                    src={c.avatar}
                    alt={c.nickname}
                    className="w-12 h-12 rounded-full bg-gray-200"
                  />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-telegram-text dark:text-telegram-darkText truncate">
                      {c.nickname}
                    </span>
                    <span className="text-[10px] text-telegram-secondary dark:text-telegram-darkSecondary flex-shrink-0 ml-2">
                      {getLastTime(c)}
                    </span>
                  </div>
                  <div className="text-xs text-telegram-secondary dark:text-telegram-darkSecondary truncate mt-0.5">
                    {getLastMessage(c)}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-telegram-secondary/70 dark:text-telegram-darkSecondary/70">
                      {c.nationality} · {c.job}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm(`删除与 ${c.nickname} 的对话？此操作不可恢复。`)) {
                    onDeleteCharacter(c.id)
                  }
                }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-400 hover:bg-red-500 text-white text-xs items-center justify-center hidden group-hover:flex transition-colors z-10"
                title="删除对话"
              >
                ×
              </button>
            </div>
          )
        })}

        {characters.length === 0 && (
          <div className="p-8 text-center text-telegram-secondary dark:text-telegram-darkSecondary text-sm">
            Click + to start a conversation
          </div>
        )}
      </div>
    </div>
  )
}
