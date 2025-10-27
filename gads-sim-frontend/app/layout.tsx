import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import DialogflowChatbot from '@/components/DialogflowChatbot'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Google Ads Search Campaign Simulator',
  description: 'Educational platform for learning Google Ads through realistic simulations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <DialogflowChatbot />
          {children}
        </Providers>
      </body>
    </html>
  )
}
