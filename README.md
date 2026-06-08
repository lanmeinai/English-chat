# English Chat

A Telegram-style chat app to practice English with AI-powered characters from around the world.

![screenshot](https://img.shields.io/badge/Next.js-14-black?logo=next.js) ![screenshot](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![screenshot](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)

## Features

- 💬 **Telegram-style UI** — Sidebar contacts + chat bubbles + typing animations
- 🌍 **8 preset characters** — American, British, Australian, Japanese, French, Brazilian, German, Korean — each with unique personality, slang, and accent
- 🎲 **Random character generator** — 8 nationalities, 25 jobs, endless combinations
- 🧠 **AI conversation** — Powered by DeepSeek API with per-character system prompts
- 📊 **Level detection** — Automatically detects your English level (A1–C2) and adapts vocabulary
- 🎤 **Voice input** — Hold-to-talk with Web Speech API, supports Chinese + English
- 🔊 **Voice output (TTS)** — AI replies read aloud with country-matched accents (US/UK/AU)
- 🈳 **Translation** — One-tap Chinese translation for every AI message
- 🌓 **Dark mode** — System-aware with manual toggle
- 📱 **Responsive** — Works on desktop and mobile
- 🔗 **Smart links** — AI shares songs/videos as search links (always valid)
- 💾 **Offline history** — Conversations saved in localStorage (last 50 messages per character)

## Quick Start

### 1. Get a DeepSeek API Key

Go to **[platform.deepseek.com](https://platform.deepseek.com)** → register → create an API key.

> Pricing is very affordable (~$0.14 per 1M input tokens). A $5 top-up lasts months of daily practice.

### 2. Run the app

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/english-chat.git
cd english-chat

# Install
npm install

# Start
npm run dev
```

Open **http://localhost:3000** → enter your API key → start chatting!

## Build as Mobile App (APK)

This project supports **[Capacitor](https://capacitorjs.com/)** to build native Android APKs.

### Prerequisites

- [Android Studio](https://developer.android.com/studio) (includes JDK + Android SDK)

### Build APK

```bash
# Install Capacitor packages
npm install @capacitor/core @capacitor/cli @capacitor/android

# Build the web app
npm run build

# Sync to Android project
npx cap add android
npx cap sync

# Build APK
cd android
./gradlew assembleDebug
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

> **Note:** If you're in China, Gradle may need proxy. Edit `android/gradle.properties`:
> ```
> systemProp.https.proxyHost=127.0.0.1
> systemProp.https.proxyPort=7890
> ```

## Deploy as Website (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Or manually:

```bash
npm run build    # generates out/ directory
# Deploy out/ to any static hosting (Vercel, Netlify, GitHub Pages, etc.)
```

## Project Structure

```
english-chat/
├── app/
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page with setup flow
│   └── globals.css        # Tailwind + animations
├── components/
│   ├── ChatList.tsx       # Sidebar contact list
│   ├── ChatWindow.tsx     # Main chat area
│   ├── MessageBubble.tsx  # Chat bubble component
│   ├── VoiceInput.tsx     # Microphone button + waveform
│   ├── CharacterCard.tsx  # Expandable character profile
│   └── SetupScreen.tsx    # API key input screen
├── lib/
│   ├── characters.ts     # 8 preset characters + random generator
│   ├── deepseek.ts       # DeepSeek API client (link parsing, URL detection)
│   ├── levelDetector.ts  # A1-C2 English level detection
│   ├── memoryStore.ts    # localStorage conversation persistence
│   ├── settings.ts       # User API key storage
│   └── tts.ts            # Text-to-speech wrapper
├── types/
│   └── index.ts          # TypeScript type definitions
└── tailwind.config.ts    # Telegram-inspired color theme
```

## FAQ

**Where is my API key stored?**
In your browser's localStorage. It never leaves your device except when calling the DeepSeek API directly.

**Can I use other OpenAI-compatible APIs?**
Yes. On the setup screen, change the Base URL to any OpenAI-compatible endpoint (e.g., `https://api.openai.com/v1`). DeepSeek's API is OpenAI-compatible.

**Why do some links say "Search on YouTube"?**
The AI can't know real video URLs, so we automatically convert them to YouTube search links that always work.

**Does it support iOS?**
The web version works on any browser. For native iOS, run `npx cap add ios` and build with Xcode (macOS required).

## License

MIT — feel free to use, modify, and share.
