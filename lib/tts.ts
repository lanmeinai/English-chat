export function stripEmoji(text: string): string {
  return text
    .replace(
      /[\u{1F000}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}]/gu,
      ''
    )
    .trim()
}

export function speak(text: string, lang: string = 'en-US'): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve()
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(stripEmoji(text))
    utterance.lang = lang
    utterance.rate = 0.9
    utterance.pitch = 1

    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()

    window.speechSynthesis.speak(utterance)
  })
}

export function getVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return []
  return window.speechSynthesis.getVoices()
}

export function findBestVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = getVoices()
  // Try exact match first
  let voice = voices.find((v) => v.lang === lang)
  if (voice) return voice
  // Try partial match
  voice = voices.find((v) => v.lang.startsWith(lang.split('-')[0]))
  return voice || null
}
