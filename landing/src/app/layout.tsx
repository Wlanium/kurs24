import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Royal Academy K.I. - KI-Training Academy Plattform',
  description: 'Erstellen Sie Ihre eigene KI-gestützte Training Academy. Mit GPT-4, Claude und LangGraph Workflows. Professionelle Online-Trainings für Dozenten und Unternehmen.',
  keywords: 'KI Training, Online Academy, LangGraph, GPT-4, Claude, CrewAI, Dozenten Plattform, Royal Academy',
  authors: [{ name: 'Royal Academy K.I.' }],
  creator: 'Royal Academy K.I.',
  publisher: 'opd.agency',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'Royal Academy K.I. - KI-Training Academy Plattform',
    description: 'Erstellen Sie Ihre eigene KI-gestützte Training Academy mit modernster Technologie.',
    url: 'https://b6t.de',
    siteName: 'Royal Academy K.I.',
    images: [
      {
        url: '/logo-royal-academy.svg',
        width: 800,
        height: 600,
        alt: 'Royal Academy K.I. Logo',
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Royal Academy K.I. - KI-Training Academy Plattform',
    description: 'Erstellen Sie Ihre eigene KI-gestützte Training Academy mit modernster Technologie.',
    images: ['/logo-royal-academy.svg'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}