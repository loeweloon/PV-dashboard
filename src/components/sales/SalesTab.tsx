// src/components/sales/SalesTab.tsx
'use client'

import { useState, useMemo, useRef } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { useDashboard } from '@/hooks/DashboardContext'
import {
  Card, CardHeader, Button, KpiCard, Modal,
  RowActions, EmptyState, FilterBar, SearchInput,
  CSVUpload, useToast,
} from '@/components/shared/ui'
import { computeSalesKPIs, computeFunnel, fmtRM, fmtNum, fmtPct, parseCSV, cn } from '@/lib/utils'
import type { ChartWidget, ChartType, SalesRecord, Salesperson, MergedSalesRow } from '@/types'

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'donuts',    label: 'Per-Project Donuts' },
  { value: 'funnel',    label: 'Sales Funnel' },
  { value: 'spa-bar',   label: 'Bar — SPA Signed' },
  { value: 'booked-bar',label: 'Bar — Bookings' },
  { value: 'conv-bar',  label: 'Bar — Conversion Rate' },
  { value: 'val-bar',   label: 'Bar — SPA Value' },
  { value: 'cancel-bar',label: 'Bar — Cancellations' },
  { value: 'custom',    label: 'Custom Placeholder' },
]

const SP_COLORS = ['#b8e04a','#4a9eff','#3dd68c','#f59e0b','#a78bfa','#f87171','#22d3c8','#e8c97a']

// ─── Per-Project Donut (pure SVG) ─────────────────────────────────────────────
function ProjectDonut({ row }: { row: MergedSalesRow }) {
  const total = row.units || 1
  const spa  = Math.min(row.spa, total)
  const book = Math.min(row.booked - row.spa, total - spa)
  const canc = Math.min(row.cancelled, total)
  const rem  = Math.max(0, total - spa - book)

  const segments = [
    { val: spa,  color: '#3dd68c', label: 'SPA' },
    { val: book, color: '#4a9eff', label: 'Booked' },
    { val: canc, color: '#f87171', label: 'Cancel' },
    { val: rem,  color: '#e8e4de', label: 'Remaining' },
  ].filter(s => s.val > 0)

  const R = 38, STROKE = 14, circ = 2 * Math.PI * R
  let offset = -circ / 4
  const paths = segments.map(s => {
    const arc = (s.val / total) * circ
    const el = (
      <circle key={s.label} cx="50" cy="50" r={R} fill="none"
        stroke={s.color} strokeWidth={STROKE}
        strokeDasharray={`${arc} ${circ}`} strokeDashoffset={-offset} />
    )
    offset += arc
    return el
  })

  const convPct = row.booked > 0 ? Math.round(row.spa / row.booked * 100) : 0
  const name = row.project_name.length > 22 ? row.project_name.slice(0, 20) + '…' : row.project_name

  return (
    <div className="flex flex-col items-center gap-2 p-3.5 bg-[var(--bg)] rounded-[var(--r-sm)] border border-[var(--border2)] hover:bg-white hover:shadow-[var(--shadow)] hover:border-[var(--border)] transition-all">
      <div className="text-[11px] font-semibold text-[var(--ink)] text-center leading-tight">{name}</div>
      <svg viewBox="0 0 100 100" width={90} height={90}>
        <circle cx="50" cy="50" r={R} fill="none" stroke="#f0ede8" strokeWidth={STROKE} />
        {paths}
        <text x="50" y="47" textAnchor="middle" fontFamily="var(--font-syne)" fontSize="13" fontWeight="700" fill="#2a2925">
          {convPct}%
        </text>
        <text x="50" y="58" textAnchor="middle" fontFamily="var(--font-dm-sans)" fontSize="7" fill="#a09d98">
          conv.
        </text>
      </svg>
      <div className="text-[9px] text-[var(--ink3)]">{fmtNum(total)} units total</div>
      <div className="flex flex-wrap gap-1 justify-center">
        {segments.filter(s => s.label !== 'Remaining').map(s => (
          <div key={s.label} className="flex items-center gap-1 text-[9px] text-[var(--ink2)]">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
            {s.val.toLocaleString()} {s.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Chart widget renderer ────────────────────────────────────────────────────
function ChartBody({ widget, data }: { widget: ChartWidget; data: MergedSalesRow[] }) {
  switch (widget.type) {
    case 'donuts': {
      const withUnits = data.filter(r => r.units > 0)
      if (!withUnits.length) return <EmptyState icon="🏠" title="No unit data yet" sub="Add launched projects in the Projects tab" />
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {withUnits.map(r => <ProjectDonut key={r.id} row={r} />)}
        </div>
      )
    }
    case 'funnel': {
      const steps = computeFunnel(data)
      return (
        <div className="space-y-2">
          {steps.map(s => (
            <div key={s.label} className="flex items-center justify-between p-2.5 rounded-[var(--r-sm)] border-l-[3px]"
              style={{ background: s.color + '22', borderLeftColor: s.color }}>
              <div>
                <div className="text-[11px] font-medium text-[var(--ink)]">{s.label}</div>
                <div className="text-[10px] text-[var(--ink3)]">{s.pct}%</div>
              </div>
              <div className="font-[family-name:var(--font-syne)] font-bold text-lg text-[var(--ink)]">
                {s.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )
    }
    case 'spa-bar':
    case 'booked-bar':
    case 'cancel-bar': {
      const field = widget.type === 'spa-bar' ? 'spa' : widget.type === 'booked-bar' ? 'booked' : 'cancelled'
      const color  = widget.type === 'spa-bar' ? '#3dd68c' : widget.type === 'booked-bar' ? '#4a9eff' : '#f87171'
      const sorted = [...data].filter(r => (r as any)[field] > 0).sort((a, b) => (b as any)[field] - (a as any)[field]).slice(0, 10)
      const chartData = sorted.map(r => ({ name: r.project_name.split(' ').slice(0, 2).join(' '), value: (r as any)[field] }))
      if (!chartData.length) return <EmptyState title="No data yet" />
      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 8 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: '#a09d98' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b6860' }} axisLine={false} tickLine={false} width={80} />
            <Tooltip formatter={(v: any) => v.toLocaleString()} contentStyle={{ borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill={color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )
    }
    case 'conv-bar': {
      const sorted = [...data].filter(r => r.booked > 0)
        .sort((a, b) => (b.spa/b.booked) - (a.spa/a.booked)).slice(0, 10)
      const chartData = sorted.map(r => ({
        name: r.project_name.split(' ').slice(0, 2).join(' '),
        value: Math.round(r.spa / r.booked * 100),
      }))
      if (!chartData.length) return <EmptyState title="No data yet" />
      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 8 }}>
            <XAxis type="number" unit="%" tick={{ fontSize: 10, fill: '#a09d98' }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b6860' }} axisLine={false} tickLine={false} width={80} />
            <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((e, i) => <Cell key={i} fill={e.value >= 80 ? '#3dd68c' : e.value >= 60 ? '#f59e0b' : '#f87171'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )
    }
    case 'val-bar': {
      const sorted = [...data].filter(r => r.value > 0).sort((a, b) => b.value - a.value).slice(0, 10)
      const chartData = sorted.map(r => ({ name: r.project_name.split(' ').slice(0, 2).join(' '), value: r.value }))
      if (!chartData.length) return <EmptyState title="No data yet" />
      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 8 }}>
            <XAxis type="number" tickFormatter={v => fmtRM(v)} tick={{ fontSize: 9, fill: '#a09d98' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b6860' }} axisLine={false} tickLine={false} width={80} />
            <Tooltip formatter={(v: any) => fmtRM(v)} contentStyle={{ borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="value" fill="#7aab1e" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    }
    default:
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-[var(--ink3)]">
          <span className="text-2xl">📊</span>
          <span className="text-[11px]">Click ✎ to configure</span>
        </div>
      )
  }
}

// ─── Widget card ──────────────────────────────────────────────────────────────
function WidgetCard({
  widget, data, onEdit, onRemove, dragHandle,
}: {
  widget: ChartWidget; data: MergedSalesRow[]
  onEdit: () => void; onRemove: () => void
  dragHandle: React.ReactNode
}) {
  const colSpan = widget.span === 3 ? 'lg:col-span-3' : widget.span === 2 ? 'lg:col-span-2' : 'lg:col-span-1'
  return (
    <Card className={cn('col-span-1', colSpan)}>
      <CardHeader title={widget.title} sub={widget.sub}>
        <div className="flex items-center gap-1">
          {dragHandle}
          <button onClick={onEdit} className="w-5 h-5 text-[10px] text-[var(--ink3)] hover:text-[var(--ink)] flex items-center justify-center">✎</button>
          <button onClick={onRemove} className="w-5 h-5 text-[10px] text-red-400 hover:text-red-600 flex items-center justify-center">✕</button>
        </div>
      </CardHeader>
      <div className="p-4">
        <ChartBody widget={widget} data={data} />
      </div>
    </Card>
  )
}

// ─── Main Sales Tab ───────────────────────────────────────────────────────────
export function SalesTab() {
  const {
    mergedSales, salespersons, chartWidgets,
    upsertSalesRecord, deleteSalesRecord,
    upsertSalesperson, deleteSalesperson,
    upsertChartWidget, deleteChartWidget, reorderWidgets,
    bulkLoadSales, bulkLoadSalespersons,
  } = useDashboard()
  const { showToast, ToastEl } = useToast()

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir]   = useState<1 | -1>(1)
  const [widgetModal, setWidgetModal] = useState<{ open: boolean; widget: Partial<ChartWidget> | null }>({ open: false, widget: null })
  const [salesModal, setSalesModal]   = useState<{ open: boolean; row: Partial<SalesRecord> | null }>({ open: false, row: null })
  const [spModal, setSpModal]         = useState<{ open: boolean; sp: Partial<Salesperson> | null }>({ open: false, sp: null })

  const FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'construction', label: 'Construction', dot: '#4a9eff' },
    { value: 'launched',     label: 'Launched',     dot: '#f59e0b' },
    { value: 'completed',    label: 'Completed',    dot: '#3dd68c' },
  ]

  const filteredData = useMemo(() => {
    let rows = [...mergedSales]
    if (filter !== 'all') rows = rows.filter(r => r.status === filter)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r => r.project_name.toLowerCase().includes(q) || r.group.toLowerCase().includes(q))
    }
    return rows
  }, [mergedSales, filter, search])

  const kpis = useMemo(() => computeSalesKPIs(filteredData), [filteredData])

  // ── Drag-drop reorder ─────────────────────────────────────────────────────
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const reordered = [...chartWidgets]
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)
    await reorderWidgets(reordered)
    showToast('Layout saved')
  }

  // ── Chart widget modals ───────────────────────────────────────────────────
  const openAddWidget = () => setWidgetModal({ open: true, widget: { type: 'donuts', title: '', sub: '', span: 2 } })
  const openEditWidget = (w: ChartWidget) => setWidgetModal({ open: true, widget: { ...w } })

  const [wForm, setWForm] = useState<Partial<ChartWidget>>({})

  const handleSaveWidget = async () => {
    if (!widgetModal.widget) return
    const found = CHART_TYPES.find(t => t.value === wForm.type)
    await upsertChartWidget({
      ...widgetModal.widget,
      ...wForm,
      sub: wForm.sub || found?.label || '',
      sort_order: widgetModal.widget.sort_order ?? chartWidgets.length,
    })
    setWidgetModal({ open: false, widget: null })
    showToast('Chart saved')
  }

  // ── Sales table ───────────────────────────────────────────────────────────
  const handleSaveSales = async (form: Partial<SalesRecord>) => {
    await upsertSalesRecord(form)
    setSalesModal({ open: false, row: null })
    showToast('✓ Saved')
  }

  const handleDeleteSales = async (id: string) => {
    if (!confirm('Remove this sales record?')) return
    await deleteSalesRecord(id)
    showToast('Removed')
  }

  // ── Salesperson ───────────────────────────────────────────────────────────
  const handleSaveSp = async (form: Partial<Salesperson>) => {
    await upsertSalesperson(form)
    setSpModal({ open: false, sp: null })
    showToast('✓ Saved')
  }

  const handleDeleteSp = async (id: string) => {
    if (!confirm('Remove this salesperson?')) return
    await deleteSalesperson(id)
    showToast('Removed')
  }

  return (
    <div className="relative z-[1] p-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <KpiCard label="Total Bookings"  value={kpis.totalBooked.toLocaleString()} sub="All active projects" dark />
        <KpiCard label="SPA Signed"      value={kpis.totalSPA.toLocaleString()}    color="#3dd68c" />
        <KpiCard label="Cancelled"       value={kpis.totalCancelled.toLocaleString()} color="#f87171" />
        <KpiCard label="Conversion Rate" value={fmtPct(kpis.convRate)}             color="#7aab1e" />
        <KpiCard label="Net SPA Value"   value={fmtRM(kpis.totalValue)}            color="#4a9eff" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <FilterBar options={FILTER_OPTIONS} active={filter} onChange={setFilter} />
        <div className="ml-auto flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search project…" />
          <Button variant="lime" size="sm" onClick={openAddWidget}>＋ Add Chart</Button>
          <CSVUpload
            label="📥 Upload Sales CSV"
            onLoad={text => {
              const rows = parseCSV(text).map(r => ({
                project_name: r.project || r['project name'] || 'Unknown',
                group: r.group || '',
                units: parseInt(r.units || r['total units'] || '0') || 0,
                booked: parseInt(r.booked || r.bookings || '0') || 0,
                spa: parseInt(r.spa || r['spa signed'] || '0') || 0,
                cancelled: parseInt(r.cancelled || r.cancellations || '0') || 0,
                value: parseFloat(r.value || r['spa value'] || '0') || 0,
              }))
              bulkLoadSales(rows).then(() => showToast(`✓ Loaded ${rows.length} records`))
            }}
          />
        </div>
      </div>

      {/* ── Charts Grid (draggable) ── */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="charts" direction="horizontal">
          {provided => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6"
            >
              {chartWidgets.map((w, i) => (
                <Draggable key={w.id} draggableId={w.id} index={i}>
                  {(drag, snapshot) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className={cn(snapshot.isDragging && 'opacity-70 scale-[1.02] shadow-[var(--shadow-lg)]')}
                    >
                      <WidgetCard
                        widget={w}
                        data={filteredData}
                        onEdit={() => { setWForm({ ...w }); openEditWidget(w) }}
                        onRemove={async () => { await deleteChartWidget(w.id); showToast('Chart removed') }}
                        dragHandle={
                          <span {...drag.dragHandleProps} className="text-[var(--ink3)] cursor-grab text-base px-0.5">⠿</span>
                        }
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* ── Tables ── */}
      {/* Project Sales Detail */}
      <Card className="mb-4">
        <CardHeader title="Project Sales Detail" sub="Bookings · SPA · Cancellations">
          <Button variant="lime" size="sm" onClick={() => setSalesModal({ open: true, row: null })}>+ Add</Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Project</th><th>Group</th><th>Total Units</th>
                <th>Booked</th><th>SPA Signed</th><th>Cancelled</th>
                <th>Breakdown</th><th>Conv. Rate</th><th>SPA Value</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan={10}><EmptyState icon="📊" title="No sales data yet" sub="Projects tab → change status to Launched/Construction/Completed" /></td></tr>
              ) : filteredData.map(r => {
                const conv = r.booked > 0 ? (r.spa / r.booked * 100).toFixed(1) : '0'
                const convColor = parseFloat(conv) >= 80 ? '#3dd68c' : parseFloat(conv) >= 60 ? '#f59e0b' : '#f87171'
                const wSpa  = r.booked > 0 ? Math.round(r.spa / r.booked * 100) : 0
                const wCanc = r.booked > 0 ? Math.round(r.cancelled / r.booked * 100) : 0
                const srcId = r.id.startsWith('auto-') ? undefined : r.id
                return (
                  <tr key={r.id} className="group">
                    <td className="font-medium">
                      {r.project_name}
                      {r.id.startsWith('auto-') && (
                        <span className="ml-1 text-[9px] text-[var(--lime-dark)] font-bold bg-[var(--lime-bg)] px-1.5 py-0.5 rounded">AUTO</span>
                      )}
                    </td>
                    <td className="text-[11px] text-[var(--ink2)]">{r.group}</td>
                    <td><span className="font-[family-name:var(--font-dm-mono)] text-[11px]">{r.units.toLocaleString()}</span></td>
                    <td><span className="font-[family-name:var(--font-dm-mono)] text-[12px]">{r.booked.toLocaleString()}</span></td>
                    <td><span className="font-[family-name:var(--font-dm-mono)] text-[12px] text-[#1a9e5a] font-semibold">{r.spa.toLocaleString()}</span></td>
                    <td><span className="font-[family-name:var(--font-dm-mono)] text-[12px] text-[#dc2626]">{r.cancelled.toLocaleString()}</span></td>
                    <td>
                      <div className="flex h-2 w-20 rounded overflow-hidden bg-[var(--bg)]">
                        <div style={{ width: `${wSpa}%`, background: '#3dd68c' }} />
                        <div style={{ width: `${100 - wSpa - wCanc}%`, background: '#4a9eff' }} />
                        <div style={{ width: `${wCanc}%`, background: '#f87171' }} />
                      </div>
                    </td>
                    <td>
                      <span className="text-[11px] font-semibold" style={{ color: convColor }}>{conv}%</span>
                    </td>
                    <td className="font-[family-name:var(--font-dm-mono)] text-[11px] text-[var(--lime-dark)] font-semibold">
                      {fmtRM(r.value)}
                    </td>
                    <td>
                      {srcId && (
                        <RowActions
                          onEdit={() => setSalesModal({ open: true, row: r })}
                          onDelete={() => handleDeleteSales(srcId)}
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Salesperson Table */}
      <Card>
        <CardHeader title="Salesperson Performance" sub="Units booked · All projects">
          <Button variant="lime" size="sm" onClick={() => setSpModal({ open: true, sp: null })}>+ Add</Button>
          <CSVUpload
            label="📥 Upload"
            onLoad={text => {
              const rows = parseCSV(text).map(r => ({
                name: r.name || r.salesperson || 'Unknown',
                project: r.project || '',
                booked: parseInt(r.booked || r.bookings || r.units || '0') || 0,
                target: parseInt(r.target || '0') || 0,
              }))
              bulkLoadSalespersons(rows).then(() => showToast(`✓ Loaded ${rows.length} records`))
            }}
          />
        </CardHeader>
        <div className="p-4 space-y-2">
          {salespersons.length === 0 ? (
            <EmptyState icon="👤" title="No salespersons yet" sub='Click "+ Add" to register one' />
          ) : salespersons.map((sp, i) => {
            const initials = sp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            const color    = SP_COLORS[i % SP_COLORS.length]
            const maxBook  = Math.max(...salespersons.map(s => s.booked), 1)
            const pct      = (sp.booked / maxBook) * 100
            return (
              <div key={sp.id} className="group flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: color + '22', color, borderColor: color + '44' }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-[var(--ink)]">{sp.name}</div>
                  <div className="text-[10px] text-[var(--ink3)]">{sp.project}</div>
                  <div className="h-1.5 bg-[var(--bg)] rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
                <div className="font-[family-name:var(--font-syne)] font-bold text-[16px]" style={{ color }}>{sp.booked}</div>
                <RowActions
                  onEdit={() => setSpModal({ open: true, sp: { ...sp } })}
                  onDelete={() => handleDeleteSp(sp.id)}
                />
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Chart Widget Modal ── */}
      <Modal
        title={widgetModal.widget?.id ? 'Edit Chart' : 'Add Chart'}
        open={widgetModal.open}
        onClose={() => setWidgetModal({ open: false, widget: null })}
        onApply={handleSaveWidget}
        applyLabel="Save Chart"
      >
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" value={wForm.title ?? ''} onChange={e => setWForm(f => ({ ...f, title: e.target.value }))} placeholder="Chart title" />
        </div>
        <div className="form-group">
          <label className="form-label">Chart Type</label>
          <select className="form-select" value={wForm.type ?? 'donuts'} onChange={e => setWForm(f => ({ ...f, type: e.target.value as ChartType }))}>
            {CHART_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Width</label>
          <select className="form-select" value={String(wForm.span ?? 2)} onChange={e => setWForm(f => ({ ...f, span: parseInt(e.target.value) as 1 | 2 | 3 }))}>
            <option value="1">Narrow (1 col)</option>
            <option value="2">Medium (2 col)</option>
            <option value="3">Wide (full)</option>
          </select>
        </div>
      </Modal>

      {/* ── Sales Record Modal ── */}
      <Modal
        title={salesModal.row?.id ? 'Edit Sales Record' : 'Add Sales Record'}
        open={salesModal.open}
        onClose={() => setSalesModal({ open: false, row: null })}
        onApply={() => salesModal.row && handleSaveSales(salesModal.row)}
      >
        {['project_name', 'group', 'units', 'booked', 'spa', 'cancelled', 'value'].map(field => (
          <div key={field} className="form-group">
            <label className="form-label">{field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
            <input
              className="form-input"
              type={['units','booked','spa','cancelled','value'].includes(field) ? 'number' : 'text'}
              value={(salesModal.row as any)?.[field] ?? ''}
              onChange={e => setSalesModal(s => ({
                ...s,
                row: { ...s.row, [field]: ['units','booked','spa','cancelled'].includes(field) ? parseInt(e.target.value) || 0 : field === 'value' ? parseFloat(e.target.value) || 0 : e.target.value },
              }))}
            />
          </div>
        ))}
      </Modal>

      {/* ── Salesperson Modal ── */}
      <Modal
        title={spModal.sp?.id ? 'Edit Salesperson' : 'Add Salesperson'}
        open={spModal.open}
        onClose={() => setSpModal({ open: false, sp: null })}
        onApply={() => spModal.sp && handleSaveSp(spModal.sp)}
      >
        {['name','project','booked','target'].map(field => (
          <div key={field} className="form-group">
            <label className="form-label">{field.replace(/\b\w/g, c => c.toUpperCase())}</label>
            <input
              className="form-input"
              type={['booked','target'].includes(field) ? 'number' : 'text'}
              value={(spModal.sp as any)?.[field] ?? ''}
              onChange={e => setSpModal(s => ({
                ...s,
                sp: { ...s.sp, [field]: ['booked','target'].includes(field) ? parseInt(e.target.value) || 0 : e.target.value },
              }))}
            />
          </div>
        ))}
      </Modal>

      {ToastEl}
    </div>
  )
}
