import type { Metadata } from 'next'
import { PropsWithChildren } from 'react'

import { ThemeProvider } from '../lib/theme-provider'

import './globals.css'

export const metadata: Metadata = {
  title: 'Sona - App Shell',
  description: 'Local-first Korean study desktop shell.',
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}