'use client'

import { useState } from 'react'

interface Props {
  character: {
    nickname: string
    realName: string
    nationality: string
    city: string
    age: number
    job: string
    personality: string[]
    interests: string[]
    avatar: string
  }
}

export default function CharacterCard({ character }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm">
      <div className="flex items-center gap-3">
        <img
          suppressHydrationWarning
          src={character.avatar}
          alt={character.nickname}
          className="w-12 h-12 rounded-full bg-gray-200"
        />
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">
            {character.nickname}
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">
            {character.nationality} · {character.city} · {character.age}
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
        >
          {expanded ? 'Less' : 'More'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-1.5 animate-fade-in">
          <div className="text-gray-600 dark:text-gray-300">
            <span className="font-medium">Name:</span> {character.realName}
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            <span className="font-medium">Job:</span> {character.job}
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            <span className="font-medium">Personality:</span>{' '}
            {character.personality.join(', ')}
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            <span className="font-medium">Interests:</span>{' '}
            {character.interests.join(', ')}
          </div>
        </div>
      )}
    </div>
  )
}
