import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { ActivityProvider } from '@/components/activity-provider'
import { DynamicTitle } from '@/components/dynamic-title'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KiduRide - Car Pool Coordination',
  description: 'Coordinate rides for children with drivers and parents',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ActivityProvider>
            <DynamicTitle />
            {children}
          </ActivityProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}

