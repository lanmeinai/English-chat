import { getSettings } from './settings'

const BASE_PATH = '/chat/completions'

export interface ParsedMessage {
  text: string
  link?: {
    url: string
    title: string
    description: string
  }
}

export interface TextSegment {
  type: 'text' | 'url'
  content: string
}

function getApiConfig() {
  const { apiKey, deepseekBaseUrl, deepseekModel } = getSettings()
  return {
    apiKey,
    baseUrl: deepseekBaseUrl + BASE_PATH,
    model: deepseekModel,
  }
}

function safeUrl(url: string, title: string): string {
  if (/youtube\.com\/watch\?v=/i.test(url) || /youtu\.be\//i.test(url)) {
    const q = title.replace(/\s+/g, '+')
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
  }
  if (/spotify\.com\/track\//i.test(url)) {
    const q = title.replace(/\s+/g, '+')
    return `https://open.spotify.com/search/${encodeURIComponent(q)}`
  }
  if (/instagram\.com\/p\//i.test(url) || /twitter\.com\/.*\/status\//i.test(url)) {
    const q = title.replace(/\s+/g, '+')
    return `https://www.google.com/search?q=${encodeURIComponent(q)}`
  }
  return url
}

export function parseAIMessage(content: string): ParsedMessage {
  const linkRegex = /\[{1,2}LINK:\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^\]]+?)\]{1,2}/i
  const match = content.match(linkRegex)

  if (match) {
    const rawUrl = match[1].trim()
    const title = match[2].trim()
    return {
      text: content.replace(linkRegex, '').trim(),
      link: { url: safeUrl(rawUrl, title), title, description: match[3].trim() },
    }
  }

  const urlRegex = /(https?:\/\/[^\s<]+)/i
  const urlMatch = content.match(urlRegex)
  if (urlMatch) {
    const rawUrl = urlMatch[1].trim()
    let hostname = rawUrl
    try { hostname = new URL(rawUrl).hostname } catch {}
    return {
      text: content.replace(urlRegex, '').trim(),
      link: { url: safeUrl(rawUrl, hostname), title: hostname, description: 'Click to open' },
    }
  }

  const fakeTagRegex = /\[([A-Za-z][^\]]{2,60})\]/
  const fakeMatch = content.match(fakeTagRegex)
  if (fakeMatch) {
    const keyword = fakeMatch[1].trim()
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`
    return {
      text: content.replace(fakeTagRegex, '').trim(),
      link: { url: searchUrl, title: keyword, description: 'Search on YouTube' },
    }
  }

  return { text: content }
}

export function tokenizeText(text: string): TextSegment[] {
  const urlRegex = /(https?:\/\/[^\s<>"')\]]+)/gi
  const segments: TextSegment[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null

  while ((m = urlRegex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, m.index) })
    }
    segments.push({ type: 'url', content: m[1] })
    lastIndex = m.index + m[1].length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return segments
}

export async function chatCompletion(
  messages: { role: string; content: string }[],
  onChunk?: (text: string) => void
): Promise<string> {
  const { apiKey, baseUrl, model } = getApiConfig()

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      max_tokens: 300,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  return content.trim()
}

export async function translateToChinese(text: string): Promise<string> {
  const { apiKey, baseUrl, model } = getApiConfig()

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'Translate to natural Chinese. Only output the translation.' },
        { role: 'user', content: text },
      ],
      max_tokens: 200,
    }),
  })

  if (!response.ok) return '[Translation unavailable]'
  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || '[Translation unavailable]'
}

export function getLinkIcon(url: string): string {
  if (url.includes('spotify.com')) return '🎵'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return '▶'
  if (url.includes('bbc.com') || url.includes('cnn.com')) return '📰'
  if (url.includes('instagram.com')) return '📸'
  if (url.includes('twitter.com') || url.includes('x.com')) return '𝕏'
  return '🔗'
}

export function getLinkColor(url: string): string {
  if (url.includes('spotify.com')) return '#1DB954'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return '#FF0000'
  if (url.includes('bbc.com')) return '#BB1919'
  if (url.includes('cnn.com')) return '#CC0000'
  if (url.includes('instagram.com')) return '#E1306C'
  return '#4B96F3'
}
