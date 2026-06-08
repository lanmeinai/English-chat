'use client'

import { useState } from 'react'
import { hasApiKey, saveSettings, getSettings } from '@/lib/settings'

interface Props {
  onReady: () => void
  darkMode: boolean | null
  onToggleDark: () => void
}

export default function SetupScreen({ onReady, darkMode, onToggleDark }: Props) {
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.deepseek.com/v1')
  const [model, setModel] = useState('deepseek-chat')
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key')
      return
    }
    setError('')
    setTesting(true)

    // Test the API key
    try {
      const res = await fetch(baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Say hello in one word' }],
          max_tokens: 10,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        setError(`API test failed: ${err}`)
        setTesting(false)
        return
      }

      saveSettings({
        apiKey: apiKey.trim(),
        deepseekBaseUrl: baseUrl.trim(),
        deepseekModel: model.trim(),
      })

      onReady()
    } catch (e: any) {
      setError(`Connection error: ${e.message}`)
      setTesting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-full bg-telegram-bg dark:bg-telegram-darkBg p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-telegram-accent">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">English Chat</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Practice English with AI characters
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              DeepSeek API Key *
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setError(''); }}
              placeholder="sk-..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-telegram-accent transition-colors"
            />
            <p className="mt-1 text-xs text-gray-400">
              Get your key at platform.deepseek.com
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-telegram-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Model
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-telegram-accent transition-colors"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={testing || !apiKey.trim()}
            className="w-full py-2.5 rounded-xl bg-telegram-accent hover:bg-telegram-accent/90 text-white font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {testing ? 'Testing...' : 'Save & Start'}
          </button>
        </div>

        {/* Dark mode toggle */}
        <div className="text-center mt-4">
          <button
            onClick={onToggleDark}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {darkMode ? '☀ Light mode' : '🌙 Dark mode'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Your API key is stored locally on your device and never sent anywhere except DeepSeek.
        </p>
      </div>
    </div>
  )
}
