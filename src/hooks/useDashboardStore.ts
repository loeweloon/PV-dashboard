// src/hooks/useDashboardStore.ts
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { mergeWithProjects } from '@/lib/utils'
import type {
  Project, SalesRecord, Salesperson,
  AdCampaign, Event, LeadCampaign,
  PlatformStat, ChartWidget, MergedSalesRow,
} from '@/types'

// ─── State shape ──────────────────────────────────────────────────────────────
export interface DashboardState {
  projects:      Project[]
  salesRecords:  SalesRecord[]
  salespersons:  Salesperson[]
  adCampaigns:   AdCampaign[]
  events:        Event[]
  leadCampaigns: LeadCampaign[]
  platformStats: PlatformStat[]
  chartWidgets:  ChartWidget[]
  mergedSales:   MergedSalesRow[]   // computed, always in sync
  loading:       boolean
  error:         string | null
  lastSaved:     Date | null
}

const INITIAL: DashboardState = {
  projects: [], salesRecords: [], salespersons: [], adCampaigns: [],
  events: [], leadCampaigns: [], platformStats: [], chartWidgets: [],
  mergedSales: [], loading: true, error: null, lastSaved: null,
}

// ─── Actions ─────────────────────────────────────────────────────────────────
export interface DashboardActions {
  // Projects
  addProject:    (p: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  // Sales
  upsertSalesRecord: (r: Partial<SalesRecord>) => Promise<void>
  deleteSalesRecord: (id: string) => Promise<void>
  // Salespersons
  upsertSalesperson: (s: Partial<Salesperson>) => Promise<void>
  deleteSalesperson: (id: string) => Promise<void>
  // Marketing
  upsertAdCampaign:   (a: Partial<AdCampaign>)   => Promise<void>
  deleteAdCampaign:   (id: string)                => Promise<void>
  upsertEvent:        (e: Partial<Event>)          => Promise<void>
  deleteEvent:        (id: string)                 => Promise<void>
  upsertLeadCampaign: (l: Partial<LeadCampaign>)  => Promise<void>
  deleteLeadCampaign: (id: string)                 => Promise<void>
  updatePlatformStat: (id: string, impressions: number) => Promise<void>
  // Chart widgets
  upsertChartWidget:  (w: Partial<ChartWidget>)   => Promise<void>
  deleteChartWidget:  (id: string)                 => Promise<void>
  reorderWidgets:     (ordered: ChartWidget[])     => Promise<void>
  // CSV bulk load
  bulkLoadSales:      (rows: Partial<SalesRecord>[]) => Promise<void>
  bulkLoadSalespersons:(rows: Partial<Salesperson>[]) => Promise<void>
  bulkLoadAdCampaigns:(rows: Partial<AdCampaign>[])   => Promise<void>
  bulkLoadLeadCampaigns:(rows: Partial<LeadCampaign>[]) => Promise<void>
  // Refresh
  refresh: () => Promise<void>
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useDashboardStore(): DashboardState & DashboardActions {
  const [state, setState] = useState<DashboardState>(INITIAL)
  const stateRef = useRef(state)
  stateRef.current = state

  // Helper: patch state and recompute mergedSales
  const patch = useCallback((updates: Partial<DashboardState>) => {
    setState(prev => {
      const next = { ...prev, ...updates, lastSaved: new Date() }
      next.mergedSales = mergeWithProjects(
        next.salesRecords,
        next.projects,
      )
      return next
    })
  }, [])

  // ── Fetch all data from Supabase ──────────────────────────────────────────
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const [
        { data: projects },
        { data: salesRecords },
        { data: salespersons },
        { data: adCampaigns },
        { data: events },
        { data: leadCampaigns },
        { data: platformStats },
        { data: chartWidgets },
      ] = await Promise.all([
        supabase.from('projects').select('*').order('name'),
        supabase.from('sales_records').select('*').order('project_name'),
        supabase.from('salespersons').select('*').order('booked', { ascending: false }),
        supabase.from('ad_campaigns').select('*').order('start_date', { ascending: false }),
        supabase.from('events').select('*').order('date'),
        supabase.from('lead_campaigns').select('*').order('leads', { ascending: false }),
        supabase.from('platform_stats').select('*').order('impressions', { ascending: false }),
        supabase.from('chart_widgets').select('*').order('sort_order'),
      ])
      const p = (projects ?? []) as Project[]
      const s = (salesRecords ?? []) as SalesRecord[]
      patch({
        projects: p,
        salesRecords: s,
        salespersons: (salespersons ?? []) as Salesperson[],
        adCampaigns:  (adCampaigns ?? []) as AdCampaign[],
        events:       (events ?? []) as Event[],
        leadCampaigns:(leadCampaigns ?? []) as LeadCampaign[],
        platformStats:(platformStats ?? []) as PlatformStat[],
        chartWidgets: (chartWidgets ?? []) as ChartWidget[],
        loading: false,
      })
    } catch (e: any) {
      setState(prev => ({ ...prev, loading: false, error: e.message }))
    }
  }, [patch])

  useEffect(() => { refresh() }, [refresh])

  // ── Real-time subscriptions ───────────────────────────────────────────────
  useEffect(() => {
    const tables = [
      'projects', 'sales_records', 'salespersons', 'ad_campaigns',
      'events', 'lead_campaigns', 'platform_stats', 'chart_widgets',
    ]
    const channels = tables.map(table =>
      supabase.channel(`realtime:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => refresh())
        .subscribe()
    )
    return () => { channels.forEach(c => supabase.removeChannel(c)) }
  }, [refresh])

  // ── Generic upsert helper ─────────────────────────────────────────────────
  async function dbUpsert(table: string, row: Record<string, any>, key = 'id') {
    const { data, error } = await supabase
      .from(table).upsert(row, { onConflict: key }).select().single()
    if (error) throw error
    return data
  }

  async function dbDelete(table: string, id: string) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
  }

  // ── Project actions ───────────────────────────────────────────────────────
  const addProject = useCallback(async (p: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    await dbUpsert('projects', p)
    await refresh()
  }, [refresh])

  const updateProject = useCallback(async (id: string, patch_: Partial<Project>) => {
    await dbUpsert('projects', { id, ...patch_ })
    await refresh()
  }, [refresh])

  const deleteProject = useCallback(async (id: string) => {
    await dbDelete('projects', id)
    await refresh()
  }, [refresh])

  // ── Sales actions ─────────────────────────────────────────────────────────
  const upsertSalesRecord = useCallback(async (r: Partial<SalesRecord>) => {
    await dbUpsert('sales_records', r)
    await refresh()
  }, [refresh])

  const deleteSalesRecord = useCallback(async (id: string) => {
    await dbDelete('sales_records', id)
    await refresh()
  }, [refresh])

  // ── Salesperson actions ───────────────────────────────────────────────────
  const upsertSalesperson = useCallback(async (s: Partial<Salesperson>) => {
    await dbUpsert('salespersons', s)
    await refresh()
  }, [refresh])

  const deleteSalesperson = useCallback(async (id: string) => {
    await dbDelete('salespersons', id)
    await refresh()
  }, [refresh])

  // ── Marketing actions ─────────────────────────────────────────────────────
  const upsertAdCampaign = useCallback(async (a: Partial<AdCampaign>) => {
    await dbUpsert('ad_campaigns', a); await refresh()
  }, [refresh])

  const deleteAdCampaign = useCallback(async (id: string) => {
    await dbDelete('ad_campaigns', id); await refresh()
  }, [refresh])

  const upsertEvent = useCallback(async (e: Partial<Event>) => {
    await dbUpsert('events', e); await refresh()
  }, [refresh])

  const deleteEvent = useCallback(async (id: string) => {
    await dbDelete('events', id); await refresh()
  }, [refresh])

  const upsertLeadCampaign = useCallback(async (l: Partial<LeadCampaign>) => {
    await dbUpsert('lead_campaigns', l); await refresh()
  }, [refresh])

  const deleteLeadCampaign = useCallback(async (id: string) => {
    await dbDelete('lead_campaigns', id); await refresh()
  }, [refresh])

  const updatePlatformStat = useCallback(async (id: string, impressions: number) => {
    await dbUpsert('platform_stats', { id, impressions }); await refresh()
  }, [refresh])

  // ── Chart widget actions ──────────────────────────────────────────────────
  const upsertChartWidget = useCallback(async (w: Partial<ChartWidget>) => {
    await dbUpsert('chart_widgets', w); await refresh()
  }, [refresh])

  const deleteChartWidget = useCallback(async (id: string) => {
    await dbDelete('chart_widgets', id); await refresh()
  }, [refresh])

  const reorderWidgets = useCallback(async (ordered: ChartWidget[]) => {
    await Promise.all(
      ordered.map((w, i) => dbUpsert('chart_widgets', { id: w.id, sort_order: i }))
    )
    await refresh()
  }, [refresh])

  // ── CSV bulk loaders ──────────────────────────────────────────────────────
  const bulkLoadSales = useCallback(async (rows: Partial<SalesRecord>[]) => {
    await supabase.from('sales_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (rows.length) await supabase.from('sales_records').insert(rows)
    await refresh()
  }, [refresh])

  const bulkLoadSalespersons = useCallback(async (rows: Partial<Salesperson>[]) => {
    await supabase.from('salespersons').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (rows.length) await supabase.from('salespersons').insert(rows)
    await refresh()
  }, [refresh])

  const bulkLoadAdCampaigns = useCallback(async (rows: Partial<AdCampaign>[]) => {
    await supabase.from('ad_campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (rows.length) await supabase.from('ad_campaigns').insert(rows)
    await refresh()
  }, [refresh])

  const bulkLoadLeadCampaigns = useCallback(async (rows: Partial<LeadCampaign>[]) => {
    await supabase.from('lead_campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (rows.length) await supabase.from('lead_campaigns').insert(rows)
    await refresh()
  }, [refresh])

  return {
    ...state,
    addProject, updateProject, deleteProject,
    upsertSalesRecord, deleteSalesRecord,
    upsertSalesperson, deleteSalesperson,
    upsertAdCampaign, deleteAdCampaign,
    upsertEvent, deleteEvent,
    upsertLeadCampaign, deleteLeadCampaign,
    updatePlatformStat,
    upsertChartWidget, deleteChartWidget, reorderWidgets,
    bulkLoadSales, bulkLoadSalespersons,
    bulkLoadAdCampaigns, bulkLoadLeadCampaigns,
    refresh,
  }
}
