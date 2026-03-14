// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

let _client: ReturnType<typeof createClient> | null = null

function getClient(): ReturnType<typeof createClient> {
  if (!_client) {
    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnon) {
      throw new Error('Missing Supabase env vars. Copy .env.local.example → .env.local and fill in your keys.')
    }
    _client = createClient(supabaseUrl, supabaseAnon)
  }
  return _client
}

// Lazy proxy — client is only instantiated on first property access,
// so missing env vars don't crash the app at module load / SSR.
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop: string) {
    return getClient()[prop as keyof ReturnType<typeof createClient>]
  },
})

// ─── Typed helpers ────────────────────────────────────────────────────────────

export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function upsertProject(project: Partial<import('@/types').Project>) {
  const { data, error } = await supabase
    .from('projects')
    .upsert(project, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

export async function fetchSalesRecords() {
  const { data, error } = await supabase
    .from('sales_records')
    .select('*')
    .order('project_name')
  if (error) throw error
  return data
}

export async function upsertSalesRecord(record: Partial<import('@/types').SalesRecord>) {
  const { data, error } = await supabase
    .from('sales_records')
    .upsert(record, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchAdCampaigns() {
  const { data, error } = await supabase
    .from('ad_campaigns')
    .select('*')
    .order('start_date', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date')
  if (error) throw error
  return data
}

export async function fetchLeadCampaigns() {
  const { data, error } = await supabase
    .from('lead_campaigns')
    .select('*')
    .order('leads', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchPlatformStats() {
  const { data, error } = await supabase
    .from('platform_stats')
    .select('*')
    .order('impressions', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchSalespersons() {
  const { data, error } = await supabase
    .from('salespersons')
    .select('*')
    .order('booked', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchChartWidgets() {
  const { data, error } = await supabase
    .from('chart_widgets')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data
}

export async function upsertChartWidget(widget: Partial<import('@/types').ChartWidget>) {
  const { data, error } = await supabase
    .from('chart_widgets')
    .upsert(widget, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}
