// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Project, MergedSalesRow, SalesRecord, SalesKPIs, FunnelStep } from '@/types'

// ─── Tailwind class helper ────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Number formatters ────────────────────────────────────────────────────────
export function fmtRM(val: number): string {
  if (val >= 1_000_000_000) return `RM ${(val / 1_000_000_000).toFixed(2)}B`
  if (val >= 1_000_000)     return `RM ${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000)         return `RM ${(val / 1_000).toFixed(0)}K`
  return `RM ${val.toLocaleString()}`
}

export function fmtNum(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}K`
  return val.toLocaleString()
}

export function fmtPct(val: number, decimals = 1): string {
  return `${(val * 100).toFixed(decimals)}%`
}

// ─── Status maps ──────────────────────────────────────────────────────────────
export const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  completed:    { label: 'Completed',       color: '#3dd68c', bg: 'rgba(61,214,140,0.12)'  },
  construction: { label: 'Construction',    color: '#4a9eff', bg: 'rgba(74,158,255,0.12)'  },
  launched:     { label: 'Launched',        color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  planning:     { label: 'Planning',        color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  pending:      { label: 'Pending Approval',color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  stop:         { label: 'Stopped',         color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  hold:         { label: 'On Hold',         color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}

export const ACTIVE_STATUSES = ['launched', 'construction', 'completed'] as const

// ─── Sales data helpers ───────────────────────────────────────────────────────

export function getProjectUnits(projects: Project[], projectName: string): number | null {
  const match = projects.find(p =>
    p.name.toUpperCase() === projectName.toUpperCase() ||
    p.name.toUpperCase().startsWith(projectName.toUpperCase().split(' ')[0])
  )
  return match?.units ?? null
}

export function mergeWithProjects(
  salesRecords: SalesRecord[],
  projects: Project[]
): MergedSalesRow[] {
  const activeProjects = projects.filter(p => ACTIVE_STATUSES.includes(p.status as any))

  // Start from existing sales records, patch in live units from projects
  const merged: MergedSalesRow[] = salesRecords.map(r => {
    const proj = projects.find(p =>
      p.name.toUpperCase().includes(r.project_name.toUpperCase().split(' ')[0]) ||
      r.project_name.toUpperCase().includes(p.name.toUpperCase().split(' ')[0])
    )
    const liveUnits = proj?.units ?? r.units
    const convRate  = r.booked > 0 ? r.spa / r.booked : 0
    return {
      ...r,
      units:    liveUnits,
      status:   (proj?.status ?? 'launched') as any,
      gdv:      proj?.gdv ?? '—',
      convRate,
    }
  })

  // Auto-inject active projects not yet in sales records
  activeProjects.forEach(p => {
    const exists = merged.some(r =>
      r.project_name.toUpperCase().includes(p.name.toUpperCase().split(' ')[0]) ||
      p.name.toUpperCase().includes(r.project_name.toUpperCase().split(' ')[0])
    )
    if (!exists) {
      merged.push({
        id: `auto-${p.id}`,
        project_id: p.id,
        project_name: p.name,
        group: p.group,
        units: p.units ?? 0,
        booked: 0, spa: 0, cancelled: 0, value: 0,
        updated_at: '',
        status: p.status as any,
        gdv: p.gdv,
        convRate: 0,
      })
    }
  })

  return merged
}

export function computeSalesKPIs(rows: MergedSalesRow[]): SalesKPIs {
  const totalBooked    = rows.reduce((s, r) => s + r.booked, 0)
  const totalSPA       = rows.reduce((s, r) => s + r.spa, 0)
  const totalCancelled = rows.reduce((s, r) => s + r.cancelled, 0)
  const totalValue     = rows.reduce((s, r) => s + r.value, 0)
  const convRate       = totalBooked > 0 ? totalSPA / totalBooked : 0
  return { totalBooked, totalSPA, totalCancelled, totalValue, convRate }
}

export function computeFunnel(rows: MergedSalesRow[]): FunnelStep[] {
  const units     = rows.reduce((s, r) => s + r.units, 0)
  const booked    = rows.reduce((s, r) => s + r.booked, 0)
  const spa       = rows.reduce((s, r) => s + r.spa, 0)
  const cancelled = rows.reduce((s, r) => s + r.cancelled, 0)
  const net       = spa - cancelled
  return [
    { label: 'Total Units', value: units,    pct: 100,                                               color: '#e8e4de' },
    { label: 'Booked',      value: booked,   pct: units  > 0 ? Math.round(booked/units*100)    : 0, color: '#4a9eff' },
    { label: 'SPA Signed',  value: spa,      pct: booked > 0 ? Math.round(spa/booked*100)      : 0, color: '#3dd68c' },
    { label: 'Cancelled',   value: cancelled,pct: booked > 0 ? Math.round(cancelled/booked*100): 0, color: '#f87171' },
    { label: 'Net SPA',     value: net,      pct: booked > 0 ? Math.round(net/booked*100)      : 0, color: '#b8e04a' },
  ]
}

// ─── CSV parser ───────────────────────────────────────────────────────────────
export function parseCSV(text: string): Record<string, string>[] {
  const lines   = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  return lines.slice(1).map(line => {
    const vals: Record<string, string> = {}
    line.split(',').forEach((v, i) => { vals[headers[i]] = v.trim().replace(/"/g, '') })
    return vals
  }).filter(row => Object.values(row).some(v => v))
}
