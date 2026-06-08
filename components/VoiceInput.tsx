'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
  onResult: (text: string) => void
  disabled?: boolean
}

export default function VoiceInput({ onResult, disabled }: Props) {
  const [listening, setListening] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'zh-CN,en-US'

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('')
        if (event.results[0].isFinal) {
          if (transcript.trim()) {
            onResult(transcript)
          }
          setListening(false)
        }
      }

      recognition.onerror = (event: any) => {
        setListening(false)
        let msg = 'Voice recognition failed.'
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            msg = 'Microphone access denied. Please allow microphone permission.'
            break
          case 'no-speech':
            msg = 'No speech detected. Please try again.'
            break
          case 'network':
            msg = 'Network error during recognition. Check your connection.'
            break
          case 'audio-capture':
            msg = 'No microphone found. Please connect a microphone.'
            break
        }
        setErrorMsg(msg)
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
        errorTimerRef.current = setTimeout(() => setErrorMsg(null), 4000)
      }

      recognition.onend = () => setListening(false)
      recognitionRef.current = recognition
    }

    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [onResult])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || disabled) return
    setErrorMsg(null)
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }, [disabled])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
    } catch {
      setListening(false)
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    startListening()
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault()
    stopListening()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    startListening()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    stopListening()
  }

  const BAR_COUNT = 5

  return (
    <div className="relative flex flex-col items-center">
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={listening ? stopListening : undefined}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={disabled || !recognitionRef.current}
        className={`p-2 rounded-full transition-all select-none touch-manipulation ${
          listening
            ? 'bg-red-500 text-white shadow-md'
            : 'text-gray-400 hover:text-telegram-accent hover:bg-gray-100 dark:hover:bg-gray-700'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        title={listening ? 'Release to stop' : 'Hold to speak'}
      >
        {listening ? (
          <div className="flex items-center gap-0.5 h-5">
            {Array.from({ length: BAR_COUNT }, (_, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-white voice-bar"
                style={{
                  animationDelay: `${i * 0.12}s`,
                  height: '100%',
                }}
              />
            ))}
          </div>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
      </button>

      {errorMsg && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500 text-white text-xs px-2 py-1 rounded-md shadow-lg z-50 animate-fade-in">
          {errorMsg}
        </div>
      )}
    </div>
  )
}
