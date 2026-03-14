// src/hooks/DashboardContext.tsx
'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useDashboardStore, type DashboardState, type DashboardActions } from './useDashboardStore'

type ContextValue = DashboardState & DashboardActions

const DashboardContext = createContext<ContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const store = useDashboardStore()
  return (
    <DashboardContext.Provider value={store}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard(): ContextValue {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used inside <DashboardProvider>')
  return ctx
}
