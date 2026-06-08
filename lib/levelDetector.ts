import { EnglishLevel } from '@/types'

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function avgWordLength(text: string): number {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return 0
  return words.reduce((sum, w) => sum + w.length, 0) / words.length
}

function hasComplexStructures(text: string): boolean {
  const complexPatterns = [
    /\b(although|however|therefore|furthermore|nevertheless|meanwhile)\b/i,
    /\b(if|unless|provided that|in case)\b.*\b(would|could|might)\b/i,
    /\bnot only.*but also\b/i,
    /\b(on the other hand|as a result|in addition|for instance)\b/i,
  ]
  return complexPatterns.some((p) => p.test(text))
}

const advancedVocab = [
  'sophisticated', 'extraordinary', 'phenomenon', 'perspective', 'inevitable',
  'significant', 'consequently', 'essentially', 'fundamentally', 'predominantly',
  'comprehensive', 'controversial', 'nevertheless', 'substantial', 'elaborate',
]

function hasAdvancedVocab(text: string): boolean {
  const lower = text.toLowerCase()
  return advancedVocab.filter((w) => lower.includes(w)).length >= 2
}

function grammarErrors(text: string): number {
  let errors = 0
  const lower = text
  // Heuristic checks
  if (/\bi (is|are|am)\b/i.test(lower)) errors++ // "I is" etc
  if (/\bhe (am|are)\b/i.test(lower)) errors++
  if (/\bshe (am|are)\b/i.test(lower)) errors++
  if (/\bthey (is|am)\b/i.test(lower)) errors++
  if (/\bwe (is|am)\b/i.test(lower)) errors++
  if (/\b(me|him|her|them|us) (is|are|am)\b/i.test(lower)) errors++
  if (/don't (knows|wants|likes|has)/i.test(lower)) errors++
  if (/\bi (has|wants|likes|goes)\b/i.test(lower)) errors++
  if (/\bmore (good|bad|fast|slow|high|low)\b/i.test(lower)) errors++
  if (/\bmost (good|bad)\b/i.test(lower)) errors++
  return errors
}

// Track multiple messages to get a running average
const userHistory: { words: number; avgLen: number; complex: boolean; errors: number; timestamp: number }[] = []

export function detectLevel(text: string): EnglishLevel {
  const words = countWords(text)
  const avgLen = avgWordLength(text)
  const complex = hasComplexStructures(text)
  const advVocab = hasAdvancedVocab(text)
  const errors = grammarErrors(text)

  userHistory.push({ words, avgLen, complex, errors, timestamp: Date.now() })
  // Keep only last 10 entries
  while (userHistory.length > 10) userHistory.shift()

  // Calculate running averages
  const totalWords = userHistory.reduce((s, h) => s + h.words, 0)
  const avgWords = totalWords / userHistory.length
  const avgWordLen = userHistory.reduce((s, h) => s + h.avgLen, 0) / userHistory.length
  const totalErrors = userHistory.reduce((s, h) => s + h.errors, 0)
  const hasComplex = userHistory.some((h) => h.complex)

  // Determine level
  let score = 0
  if (avgWords > 20) score += 2
  else if (avgWords > 10) score += 1
  if (avgWordLen > 5.5) score += 2
  else if (avgWordLen > 4.5) score += 1
  if (hasComplex) score += 2
  if (advVocab) score += 2
  if (totalErrors > 3) score -= 2
  else if (totalErrors > 1) score -= 1

  if (score <= 0) return 'A1'
  if (score <= 2) return 'A2'
  if (score <= 4) return 'B1'
  if (score <= 6) return 'B2'
  if (score <= 8) return 'C1'
  return 'C2'
}

export function getLevelDescription(level: EnglishLevel): string {
  switch (level) {
    case 'A1': return 'Beginner'
    case 'A2': return 'Elementary'
    case 'B1': return 'Intermediate'
    case 'B2': return 'Upper Intermediate'
    case 'C1': return 'Advanced'
    case 'C2': return 'Proficient'
  }
}

export function getLevelPrompt(level: EnglishLevel): string {
  switch (level) {
    case 'A1':
      return `\n[ADAPTATION: The user is at A1 (Beginner) English level. Use VERY simple words (basic vocabulary), short sentences (5-10 words max). Avoid any idioms, phrasal verbs, or complex grammar. Speak slowly and clearly in your tone. If they don't understand, rephrase even more simply.]`
    case 'A2':
      return `\n[ADAPTATION: The user is at A2 (Elementary) English level. Use simple words and short sentences. Avoid idioms and complex structures. You can use occasional basic phrasal verbs. Be patient and encouraging.]`
    case 'B1':
      return `\n[ADAPTATION: The user is at B1 (Intermediate) English level. Use everyday vocabulary and moderate sentence complexity. You can use some common idioms and phrasal verbs. Match their pace.]`
    case 'B2':
      return `\n[ADAPTATION: The user is at B2 (Upper Intermediate) English level. Use natural, everyday English with normal complexity. Idioms and varied vocabulary are fine. Have a natural conversation.]`
    case 'C1':
      return `\n[ADAPTATION: The user is at C1 (Advanced) English level. Feel free to use sophisticated vocabulary, idioms, complex sentences, and nuanced expressions. Engage in deeper discussions.]`
    case 'C2':
      return `\n[ADAPTATION: The user is at C2 (Proficient) English level. Use full native-level English with any vocabulary, cultural references, wordplay, and abstract topics. Treat them as a native speaker.]`
  }
}
