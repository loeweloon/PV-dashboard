// src/components/shared/Header.tsx
'use client'

import { useDashboard } from '@/hooks/DashboardContext'
import { Button } from './ui'

export type TabId = 'projects' | 'marketing' | 'sales'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'projects',  label: 'Projects',  icon: '🏗️' },
  { id: 'marketing', label: 'Marketing', icon: '📣' },
  { id: 'sales',     label: 'Sales',     icon: '📈' },
]

export function Header({
  activeTab, onTabChange, editMode, onToggleEdit,
}: {
  activeTab: TabId
  onTabChange: (t: TabId) => void
  editMode: boolean
  onToggleEdit: () => void
}) {
  const { lastSaved, loading } = useDashboard()

  const savedStr = lastSaved
    ? lastSaved.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <header className="sticky top-0 z-[100] bg-white border-b border-[var(--border)] shadow-[0_1px_0_var(--border2)]">
      <div className="flex items-center justify-between h-[58px] px-8">
        {/* Left: logo + tabs */}
        <div className="flex items-center gap-5">
          <a href="/" className="flex items-center gap-2.5 no-underline">
            <span className="bg-[var(--dark)] text-[var(--lime)] font-[family-name:var(--font-syne)] font-extrabold text-[13px] px-2.5 py-1.5 rounded-[8px] tracking-[0.02em]">
              PV
            </span>
            <span className="font-[family-name:var(--font-syne)] font-bold text-[14px] text-[var(--ink)] tracking-[-0.01em] hidden sm:block">
              Executive Dashboard
            </span>
          </a>

          <nav className="flex items-center gap-0.5">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={[
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--r-pill)] border-none text-[12px] font-medium cursor-pointer transition-all whitespace-nowrap',
                  activeTab === t.id
                    ? 'bg-[var(--dark)] text-white font-semibold'
                    : 'bg-transparent text-[var(--ink3)] hover:bg-[var(--bg)] hover:text-[var(--ink)]',
                ].join(' ')}
              >
                <span className="text-sm opacity-80">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: live indicator + edit + sync */}
        <div className="flex items-center gap-2">
          {/* Live sync indicator */}
          <div className="flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-pill)] px-2.5 py-1">
            <span className={[
              'w-1.5 h-1.5 rounded-full',
              loading ? 'bg-yellow-400 animate-pulse' : 'bg-[var(--c-completed)] animate-pulse',
            ].join(' ')} style={{ '--c-completed': '#3dd68c' } as any} />
            <span className="text-[10px] text-[var(--ink3)] font-medium">
              {loading ? 'Syncing…' : savedStr ? `Saved ${savedStr}` : 'Live'}
            </span>
          </div>

          {activeTab === 'projects' && (
            <Button
              variant={editMode ? 'lime' : 'ghost'}
              size="sm"
              onClick={onToggleEdit}
            >
              {editMode ? '✓ Done' : '✎ Edit Mode'}
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            ⬇ Export
          </Button>
        </div>
      </div>
    </header>
  )
}
