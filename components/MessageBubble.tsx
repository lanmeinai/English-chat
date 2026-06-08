'use client'

import { useState, useRef, useEffect } from 'react'
import { Message } from '@/types'
import { speak } from '@/lib/tts'

interface Props {
  message: Message
  voiceLang?: string
  characterName?: string
  characterInitial?: string
  characterColor?: string
}

export default function MessageBubble({
  message,
  voiceLang = 'en-US',
  characterName,
  characterInitial,
  characterColor = '#3390ec',
}: Props) {
  const [speaking, setSpeaking] = useState(false)
  const [showTranslation, setShowTranslation] = useState(message.showTranslation)
  const isUser = message.role === 'user'

  useEffect(() => {
    setShowTranslation(message.showTranslation)
  }, [message.showTranslation])

  const handleSpeak = async () => {
    setSpeaking(true)
    await speak(message.content, voiceLang)
    setSpeaking(false)
  }

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={`flex mb-4 animate-slide-${
        isUser ? 'in-right' : 'in-left'
      }`}
      style={{ animationFillMode: 'both' }}
    >
      {/* AI: avatar on left */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 ml-1 flex-shrink-0" style={{ backgroundColor: characterColor }}>
          {characterInitial || 'AI'}
        </div>
      )}

      <div className="flex flex-col max-w-[75%] md:max-w-[60%]">
        {/* AI: sender name */}
        {!isUser && characterName && (
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 ml-0.5">
            {characterName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-telegram-ownBubble dark:bg-telegram-darkOwnBubble text-black dark:text-white rounded-br-sm'
              : 'bg-white dark:bg-telegram-darkBubble text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-700'
          }`}
        >
          <div className="whitespace-pre-wrap break-words">{message.content}</div>

          {message.translation && showTranslation && (
            <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-600/50 text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed">
              {message.translation}
            </div>
          )}
        </div>

        {/* Action row: time + per-message buttons (AI only) */}
        <div
          className={`flex items-center gap-1.5 mt-1 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{time}</span>

          {!isUser && (
            <div className="flex items-center gap-0.5">
              {/* Speak button */}
              <button
                onClick={handleSpeak}
                disabled={speaking}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  speaking
                    ? 'bg-telegram-accent/15 text-telegram-accent'
                    : 'text-gray-400 hover:text-telegram-accent hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Play speech"
              >
                {speaking ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="animate-pulse">
                    <path d="M9 9h6v6H9z"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                )}
              </button>

              {/* Translate toggle button */}
              {message.translation && (
                <button
                  onClick={() => setShowTranslation((v) => !v)}
                  className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                    showTranslation
                      ? 'bg-telegram-accent/10 border-telegram-accent/30 text-telegram-accent'
                      : 'text-gray-400 border-gray-200 dark:border-gray-600 hover:text-telegram-accent hover:border-telegram-accent/40'
                  }`}
                  title="Toggle translation"
                >
                  {showTranslation ? 'Hide CN' : 'CN'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
