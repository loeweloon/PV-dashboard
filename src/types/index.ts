// src/types/index.ts
// ─── Shared data models mirroring the Supabase schema ───────────────────────

export type ProjectStatus =
  | 'completed'
  | 'construction'
  | 'launched'
  | 'planning'
  | 'pending'
  | 'stop'
  | 'hold'

export interface Project {
  id: string                  // uuid from Supabase
  name: string
  group: string
  company: string
  location: string
  dev_type: string
  land_tenure: string
  units: number | null        // null = TBC
  gdv: string                 // stored as text e.g. "RM 484 mil"
  launch: string
  completion: string
  status: ProjectStatus
  description: string
  pm: string
  team: string
  created_at: string
  updated_at: string
}

export interface SalesRecord {
  id: string
  project_id: string
  project_name: string        // denormalized for display
  group: string
  units: number
  booked: number
  spa: number
  cancelled: number
  value: number               // RM value of SPA signed
  updated_at: string
}

export interface Salesperson {
  id: string
  name: string
  project: string
  booked: number
  target: number
  updated_at: string
}

export interface AdCampaign {
  id: string
  name: string
  platform: string
  start_date: string
  end_date: string
  budget: number
  spend: number
  impressions: number
  leads: number
  status: 'live' | 'scheduled' | 'ended'
  updated_at: string
}

export interface Event {
  id: string
  name: string
  date: string
  location: string
  type: 'own' | 'join'
  updated_at: string
}

export interface LeadCampaign {
  id: string
  campaign: string
  platform: string
  project: string
  leads: number
  cpl: number
  budget: number
  updated_at: string
}

export interface PlatformStat {
  id: string
  name: string
  icon: string
  color: string
  impressions: number
  updated_at: string
}

export interface ChartWidget {
  id: string
  type: ChartType
  title: string
  sub: string
  span: 1 | 2 | 3
  sort_order: number
}

export type ChartType =
  | 'donuts'
  | 'funnel'
  | 'spa-bar'
  | 'booked-bar'
  | 'conv-bar'
  | 'val-bar'
  | 'cancel-bar'
  | 'custom'

// ─── Derived / computed types ────────────────────────────────────────────────

export interface MergedSalesRow extends SalesRecord {
  status: ProjectStatus
  gdv: string
  convRate: number            // 0–1
}

export interface SalesKPIs {
  totalBooked: number
  totalSPA: number
  totalCancelled: number
  totalValue: number
  convRate: number
}

export interface FunnelStep {
  label: string
  value: number
  pct: number
  color: string
}
