// src/components/marketing/MarketingTab.tsx
'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '@/hooks/DashboardContext'
import {
  Card, CardHeader, Button, KpiCard, Modal,
  RowActions, EmptyState, useToast, CSVUpload,
} from '@/components/shared/ui'
import { fmtNum, parseCSV } from '@/lib/utils'
import type { AdCampaign, Event, LeadCampaign } from '@/types'

const PLATFORM_ICONS: Record<string, string> = {
  Facebook:'📘', Instagram:'📷', Google:'🔍', TikTok:'🎵',
  PropertyGuru:'🏠', iProperty:'🔑', YouTube:'▶️', WhatsApp:'💬',
  Twitter:'🐦', LinkedIn:'💼',
}
const PLATFORM_COLORS: Record<string, string> = {
  Facebook:'#1877F2', Instagram:'#E4405F', Google:'#4285F4',
  TikTok:'#010101', PropertyGuru:'#f59e0b', iProperty:'#dc2626',
  YouTube:'#FF0000', WhatsApp:'#25D366',
}

// ─── Ad card ──────────────────────────────────────────────────────────────────
function AdCard({ ad, onEdit, onDelete }: {
  ad: AdCampaign
  onEdit: () => void
  onDelete: () => void
}) {
  const color = PLATFORM_COLORS[ad.platform] ?? '#94a3b8'
  const icon  = PLATFORM_ICONS[ad.platform]  ?? '📣'
  const cpl   = ad.leads > 0 ? (ad.spend / ad.leads).toFixed(2) : '—'
  const statusDot = ad.status === 'live' ? '#3dd68c' : ad.status === 'scheduled' ? '#f59e0b' : '#94a3b8'

  return (
    <div className="group relative bg-[var(--bg)] rounded-[var(--r-sm)] border border-[var(--border2)] p-3.5 hover:bg-white hover:shadow-[var(--shadow)] hover:border-[var(--border)] transition-all">
      {/* Platform badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-[10px] font-semibold" style={{ color }}>{ad.platform}</span>
        </div>
        <span className="flex items-center gap-1 text-[9px] text-[var(--ink3)]">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusDot }} />
          {ad.status}
        </span>
      </div>
      {/* Name */}
      <div className="text-[12px] font-semibold text-[var(--ink)] mb-1 leading-snug">{ad.name}</div>
      {/* Dates */}
      <div className="text-[10px] text-[var(--ink3)] mb-3">
        {ad.start_date} → {ad.end_date}
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { label: 'Impressions', value: fmtNum(ad.impressions) },
          { label: 'Leads',       value: ad.leads.toLocaleString() },
          { label: 'Spend',       value: `RM ${ad.spend.toLocaleString()}` },
          { label: 'CPL',         value: `RM ${cpl}` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-[6px] px-2 py-1.5">
            <div className="text-[8px] text-[var(--ink3)] uppercase tracking-wider">{s.label}</div>
            <div className="text-[11px] font-[family-name:var(--font-dm-mono)] font-medium text-[var(--ink)]">{s.value}</div>
          </div>
        ))}
      </div>
      {/* Actions (hover) */}
      <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit}   className="w-6 h-6 rounded-md border border-[rgba(122,171,30,0.3)] bg-white text-[var(--lime-dark)] text-[11px] flex items-center justify-center hover:bg-[var(--lime-bg)]">✎</button>
        <button onClick={onDelete} className="w-6 h-6 rounded-md border border-red-200 bg-white text-red-400 text-[11px] flex items-center justify-center hover:bg-red-50">✕</button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function MarketingTab() {
  const {
    adCampaigns, events, leadCampaigns, platformStats,
    upsertAdCampaign, deleteAdCampaign,
    upsertEvent, deleteEvent,
    upsertLeadCampaign, deleteLeadCampaign,
    updatePlatformStat,
    bulkLoadAdCampaigns, bulkLoadLeadCampaigns,
  } = useDashboard()
  const { showToast, ToastEl } = useToast()

  const [adModal, setAdModal]       = useState<{ open: boolean; ad: Partial<AdCampaign> | null }>({ open: false, ad: null })
  const [evtModal, setEvtModal]     = useState<{ open: boolean; event: Partial<Event> | null }>({ open: false, event: null })
  const [leadModal, setLeadModal]   = useState<{ open: boolean; lead: Partial<LeadCampaign> | null }>({ open: false, lead: null })
  const [platModal, setPlatModal]   = useState<{ open: boolean; stat: any }>({ open: false, stat: null })

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalImpressions = adCampaigns.reduce((s, a) => s + a.impressions, 0)
  const totalLeads       = adCampaigns.reduce((s, a) => s + a.leads, 0)
  const activeCampaigns  = adCampaigns.filter(a => a.status === 'live').length
  const totalSpend       = adCampaigns.reduce((s, a) => s + a.spend, 0)
  const avgCPL           = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(0) : '—'

  return (
    <div className="relative z-[1] p-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Total Impressions"  value={fmtNum(totalImpressions)} dark />
        <KpiCard label="Total Leads"        value={totalLeads.toLocaleString()} color="#3dd68c" />
        <KpiCard label="Active Campaigns"   value={activeCampaigns}           color="#f59e0b" />
        <KpiCard label="Avg. CPL"           value={avgCPL === '—' ? '—' : `RM ${avgCPL}`} color="#4a9eff" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* ── Running Ads ── */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Running Ads" sub="Active · Scheduled · Ended">
              <Button variant="lime" size="sm" onClick={() => setAdModal({ open: true, ad: { status: 'live', platform: 'Facebook' } })}>+ Add Campaign</Button>
              <CSVUpload onLoad={text => {
                const rows = parseCSV(text).map(r => ({
                  name: r.name || r['campaign name'] || 'Unnamed',
                  platform: r.platform || 'Facebook',
                  start_date: r.start || r['start date'] || '',
                  end_date:   r.end   || r['end date']   || '',
                  budget:     parseFloat(r.budget) || 0,
                  spend:      parseFloat(r.spend)  || 0,
                  impressions:parseFloat(r.impressions) || 0,
                  leads:      parseFloat(r.leads)  || 0,
                  status:     (r.status || 'live') as AdCampaign['status'],
                }))
                bulkLoadAdCampaigns(rows).then(() => showToast(`✓ Loaded ${rows.length} campaigns`))
              }} />
            </CardHeader>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {adCampaigns.length === 0
                ? <EmptyState icon="📣" title="No ad campaigns yet" />
                : adCampaigns.map(ad => (
                    <AdCard key={ad.id} ad={ad}
                      onEdit={() => setAdModal({ open: true, ad: { ...ad } })}
                      onDelete={async () => { if (confirm(`Delete "${ad.name}"?`)) { await deleteAdCampaign(ad.id); showToast('Removed') } }}
                    />
                  ))
              }
            </div>
          </Card>
        </div>

        {/* ── Events + Platform Impressions ── */}
        <div className="flex flex-col gap-4">
          {/* Events */}
          <Card>
            <CardHeader title="Roadshows & Events" sub="Upcoming & recent">
              <Button variant="lime" size="sm" onClick={() => setEvtModal({ open: true, event: { type: 'own' } })}>+ Add</Button>
            </CardHeader>
            <div className="p-3 space-y-2">
              {events.length === 0
                ? <EmptyState icon="📅" title="No events yet" />
                : events.map(ev => {
                    const d = new Date(ev.date)
                    const day = d.getDate()
                    const mon = d.toLocaleString('en', { month: 'short' }).toUpperCase()
                    return (
                      <div key={ev.id} className="group flex items-center gap-3">
                        <div className="flex-shrink-0 bg-[var(--dark)] text-white rounded-[8px] w-11 text-center py-1.5">
                          <div className="text-[16px] font-[family-name:var(--font-syne)] font-bold leading-none">{day}</div>
                          <div className="text-[8px] font-semibold tracking-widest opacity-60">{mon}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-[var(--ink)] truncate">{ev.name}</div>
                          <div className="text-[10px] text-[var(--ink3)]">{ev.location}</div>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-[var(--r-pill)] ${ev.type === 'own' ? 'bg-[var(--lime-bg)] text-[var(--lime-dark)]' : 'bg-[var(--bg)] text-[var(--ink3)]'}`}>
                          {ev.type === 'own' ? 'OWN' : 'JOIN'}
                        </span>
                        <RowActions
                          onEdit={() => setEvtModal({ open: true, event: { ...ev } })}
                          onDelete={async () => { if (confirm(`Delete "${ev.name}"?`)) { await deleteEvent(ev.id); showToast('Removed') } }}
                        />
                      </div>
                    )
                  })
              }
            </div>
          </Card>

          {/* Platform impressions */}
          <Card>
            <CardHeader title="Digital Impressions" sub="By platform · This month" />
            <div className="p-3 space-y-2">
              {platformStats.map(p => {
                const max = platformStats[0]?.impressions || 1
                const pct = Math.round(p.impressions / max * 100)
                return (
                  <div key={p.id} className="flex items-center gap-2 group">
                    <span className="text-base">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-[var(--ink)]">{p.name}</div>
                      <div className="h-1.5 bg-[var(--bg)] rounded-full mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
                      </div>
                    </div>
                    <div className="font-[family-name:var(--font-dm-mono)] text-[10px] text-[var(--ink2)] w-14 text-right">{fmtNum(p.impressions)}</div>
                    <button onClick={() => setPlatModal({ open: true, stat: { ...p } })} className="opacity-0 group-hover:opacity-100 w-5 h-5 text-[10px] text-[var(--lime-dark)] flex items-center justify-center transition-opacity">✎</button>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Lead campaign performance table */}
      <Card>
        <CardHeader title="Lead Campaign Performance" sub="Leads · CPL · Budget">
          <Button variant="lime" size="sm" onClick={() => setLeadModal({ open: true, lead: {} })}>+ Add</Button>
          <CSVUpload onLoad={text => {
            const rows = parseCSV(text).map(r => ({
              campaign: r.campaign || r.name || 'Unnamed',
              platform: r.platform || '',
              project:  r.project  || '',
              leads:    parseFloat(r.leads)  || 0,
              cpl:      parseFloat(r.cpl || r['cost per lead']) || 0,
              budget:   parseFloat(r.budget) || 0,
            }))
            bulkLoadLeadCampaigns(rows).then(() => showToast(`✓ Loaded ${rows.length} campaigns`))
          }} />
        </CardHeader>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Campaign</th><th>Platform</th><th>Project</th>
                <th>Leads</th><th>CPL (RM)</th><th>Budget (RM)</th><th>Rating</th><th></th>
              </tr>
            </thead>
            <tbody>
              {leadCampaigns.length === 0
                ? <tr><td colSpan={8}><EmptyState icon="🎯" title="No lead campaigns yet" /></td></tr>
                : leadCampaigns.map(l => {
                    const grade = l.cpl < 50 ? { label: '🟢 Good', color: '#1a9e5a' } : l.cpl < 100 ? { label: '🟡 Avg', color: '#b45309' } : { label: '🔴 High CPL', color: '#dc2626' }
                    const maxLeads = Math.max(...leadCampaigns.map(x => x.leads), 1)
                    return (
                      <tr key={l.id} className="group">
                        <td className="font-medium">{l.campaign}</td>
                        <td className="text-[11px] text-[var(--ink2)]">{l.platform}</td>
                        <td className="text-[11px] text-[var(--ink2)]">{l.project}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-[family-name:var(--font-dm-mono)] text-[12px]">{l.leads}</span>
                            <div className="h-1 bg-[var(--bg)] rounded-full w-16 overflow-hidden">
                              <div className="h-full bg-[#4a9eff] rounded-full" style={{ width: `${Math.round(l.leads/maxLeads*100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="font-[family-name:var(--font-dm-mono)] text-[11px]">{l.cpl}</td>
                        <td className="font-[family-name:var(--font-dm-mono)] text-[11px]">{l.budget.toLocaleString()}</td>
                        <td><span className="text-[10px] font-semibold" style={{ color: grade.color }}>{grade.label}</span></td>
                        <td>
                          <RowActions
                            onEdit={() => setLeadModal({ open: true, lead: { ...l } })}
                            onDelete={async () => { if (confirm(`Delete "${l.campaign}"?`)) { await deleteLeadCampaign(l.id); showToast('Removed') } }}
                          />
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Ad Modal ── */}
      <Modal title={adModal.ad?.id ? 'Edit Campaign' : 'Add Campaign'} open={adModal.open}
        onClose={() => setAdModal({ open: false, ad: null })}
        onApply={async () => { await upsertAdCampaign(adModal.ad!); setAdModal({ open: false, ad: null }); showToast('✓ Saved') }}>
        {(['name','platform','start_date','end_date'] as (keyof AdCampaign)[]).map(f => (
          <div key={f} className="form-group">
            <label className="form-label">{String(f).replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</label>
            {f === 'platform' ? (
              <select className="form-select" value={(adModal.ad as any)?.[f]??''} onChange={e=>setAdModal(s=>({...s,ad:{...s.ad,[f]:e.target.value}}))}>
                {Object.keys(PLATFORM_ICONS).map(p=><option key={p}>{p}</option>)}
              </select>
            ) : (
              <input className="form-input" type={f.includes('date')?'date':'text'} value={(adModal.ad as any)?.[f]??''} onChange={e=>setAdModal(s=>({...s,ad:{...s.ad,[f]:e.target.value}}))} />
            )}
          </div>
        ))}
        {(['budget','spend','impressions','leads'] as (keyof AdCampaign)[]).map(f => (
          <div key={f} className="form-group">
            <label className="form-label">{String(f).replace(/\b\w/g,c=>c.toUpperCase())}</label>
            <input className="form-input" type="number" value={(adModal.ad as any)?.[f]??0} onChange={e=>setAdModal(s=>({...s,ad:{...s.ad,[f]:parseFloat(e.target.value)||0}}))} />
          </div>
        ))}
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={adModal.ad?.status??'live'} onChange={e=>setAdModal(s=>({...s,ad:{...s.ad,status:e.target.value as any}}))}>
            <option value="live">Live</option><option value="scheduled">Scheduled</option><option value="ended">Ended</option>
          </select>
        </div>
      </Modal>

      {/* ── Event Modal ── */}
      <Modal title={evtModal.event?.id ? 'Edit Event' : 'Add Event'} open={evtModal.open}
        onClose={() => setEvtModal({ open: false, event: null })}
        onApply={async () => { await upsertEvent(evtModal.event!); setEvtModal({ open: false, event: null }); showToast('✓ Saved') }}>
        {[{f:'name',label:'Event Name'},{f:'date',label:'Date',type:'date'},{f:'location',label:'Location'}].map(({f,label,type})=>(
          <div key={f} className="form-group">
            <label className="form-label">{label}</label>
            <input className="form-input" type={type??'text'} value={(evtModal.event as any)?.[f]??''} onChange={e=>setEvtModal(s=>({...s,event:{...s.event,[f]:e.target.value}}))} />
          </div>
        ))}
        <div className="form-group">
          <label className="form-label">Type</label>
          <select className="form-select" value={evtModal.event?.type??'own'} onChange={e=>setEvtModal(s=>({...s,event:{...s.event,type:e.target.value as any}}))}>
            <option value="own">Own Event</option><option value="join">Join Event</option>
          </select>
        </div>
      </Modal>

      {/* ── Lead Modal ── */}
      <Modal title={leadModal.lead?.id ? 'Edit Lead Campaign' : 'Add Lead Campaign'} open={leadModal.open}
        onClose={() => setLeadModal({ open: false, lead: null })}
        onApply={async () => { await upsertLeadCampaign(leadModal.lead!); setLeadModal({ open: false, lead: null }); showToast('✓ Saved') }}>
        {[{f:'campaign',label:'Campaign Name'},{f:'platform',label:'Platform'},{f:'project',label:'Project'}].map(({f,label})=>(
          <div key={f} className="form-group">
            <label className="form-label">{label}</label>
            <input className="form-input" value={(leadModal.lead as any)?.[f]??''} onChange={e=>setLeadModal(s=>({...s,lead:{...s.lead,[f]:e.target.value}}))} />
          </div>
        ))}
        {[{f:'leads',label:'Leads'},{f:'cpl',label:'CPL (RM)'},{f:'budget',label:'Budget (RM)'}].map(({f,label})=>(
          <div key={f} className="form-group">
            <label className="form-label">{label}</label>
            <input className="form-input" type="number" value={(leadModal.lead as any)?.[f]??0} onChange={e=>setLeadModal(s=>({...s,lead:{...s.lead,[f]:parseFloat(e.target.value)||0}}))} />
          </div>
        ))}
      </Modal>

      {/* ── Platform Modal ── */}
      <Modal title="Edit Platform Impressions" open={platModal.open}
        onClose={() => setPlatModal({ open: false, stat: null })}
        onApply={async () => { await updatePlatformStat(platModal.stat.id, platModal.stat.impressions); setPlatModal({ open: false, stat: null }); showToast('✓ Updated') }}>
        <div className="form-group">
          <label className="form-label">Platform</label>
          <input className="form-input" value={platModal.stat?.name??''} disabled />
        </div>
        <div className="form-group">
          <label className="form-label">Impressions</label>
          <input className="form-input" type="number" value={platModal.stat?.impressions??0}
            onChange={e=>setPlatModal(s=>({...s,stat:{...s.stat,impressions:parseInt(e.target.value)||0}}))} />
        </div>
      </Modal>

      {ToastEl}
    </div>
  )
}
