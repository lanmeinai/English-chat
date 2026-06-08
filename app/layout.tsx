import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'English Chat - Practice English with AI',
  description: 'A Telegram-style chat app to practice English with AI characters',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" translate="no">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  )
}
