const STORAGE_KEY = 'engchat_user_settings'

export interface UserSettings {
  apiKey: string
  deepseekBaseUrl: string
  deepseekModel: string
}

const DEFAULTS: UserSettings = {
  apiKey: '',
  deepseekBaseUrl: 'https://api.deepseek.com/v1',
  deepseekModel: 'deepseek-chat',
}

export function getSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) return { ...DEFAULTS, ...JSON.parse(data) }
  } catch {}
  return DEFAULTS
}

export function saveSettings(settings: Partial<UserSettings>) {
  if (typeof window === 'undefined') return
  const current = getSettings()
  const merged = { ...current, ...settings }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
}

export function getApiKey(): string {
  return getSettings().apiKey
}

export function hasApiKey(): boolean {
  return getSettings().apiKey.trim().length > 0
}
