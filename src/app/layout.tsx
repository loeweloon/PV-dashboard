// src/app/layout.tsx
import type { Metadata } from 'next'
import { DashboardProvider } from '@/hooks/DashboardContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Platinum Victory — Executive Dashboard',
  description: 'Internal executive dashboard — Platinum Victory Group',
  robots: 'noindex, nofollow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DashboardProvider>
          {children}
        </DashboardProvider>
      </body>
    </html>
  )
}
