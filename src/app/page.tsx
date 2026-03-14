// src/app/page.tsx
'use client'

import { useState } from 'react'
import { Header, type TabId } from '@/components/shared/Header'
import { ProjectsTab } from '@/components/projects/ProjectsTab'
import { MarketingTab } from '@/components/marketing/MarketingTab'
import { SalesTab }     from '@/components/sales/SalesTab'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('projects')
  const [editMode, setEditMode]   = useState(false)

  return (
    <div className="relative z-[1] flex flex-col min-h-screen">
      <Header
        activeTab={activeTab}
        onTabChange={tab => { setActiveTab(tab); setEditMode(false) }}
        editMode={editMode}
        onToggleEdit={() => setEditMode(e => !e)}
      />

      <main className="flex-1">
        {activeTab === 'projects'  && <ProjectsTab editMode={editMode} />}
        {activeTab === 'marketing' && <MarketingTab />}
        {activeTab === 'sales'     && <SalesTab />}
      </main>

      <footer className="border-t border-[var(--border2)] px-8 py-3 text-[10px] text-[var(--ink3)] flex items-center justify-between">
        <span>Confidential · For internal management use only · Platinum Victory Group</span>
        <span>Data as at {new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </footer>
    </div>
  )
}
