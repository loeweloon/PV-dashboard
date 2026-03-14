// src/components/projects/ProjectsTab.tsx
'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '@/hooks/DashboardContext'
import {
  Card, CardHeader, StatusPill, Button,
  Modal, RowActions, EmptyState, Skeleton,
  FilterBar, SearchInput, useToast,
} from '@/components/shared/ui'
import { STATUS_MAP, fmtNum, cn } from '@/lib/utils'
import type { Project, ProjectStatus } from '@/types'

const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([v, s]) => ({
  value: v, label: s.label, dot: s.color,
}))
const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  ...STATUS_OPTIONS,
]

const EMPTY_PROJECT: Omit<Project, 'id' | 'created_at' | 'updated_at'> = {
  name: '', group: '', company: '', location: '', dev_type: '',
  land_tenure: '', units: null, gdv: 'TBC', launch: 'TBC',
  completion: 'TBC', status: 'planning', description: '', pm: '', team: '',
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────
function KpiStrip({ projects }: { projects: Project[] }) {
  const total     = projects.length
  const launched  = projects.filter(p => p.status === 'launched').length
  const constr    = projects.filter(p => p.status === 'construction').length
  const completed = projects.filter(p => p.status === 'completed').length
  const totalUnits= projects.reduce((s, p) => s + (p.units ?? 0), 0)

  const kpis = [
    { label: 'Total Projects', value: total,                    color: '' },
    { label: 'Launched',       value: launched,                 color: '#f59e0b' },
    { label: 'Construction',   value: constr,                   color: '#4a9eff' },
    { label: 'Completed',      value: completed,                color: '#3dd68c' },
    { label: 'Total Units',    value: fmtNum(totalUnits),       color: 'var(--lime-dark)' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
      {kpis.map((k, i) => (
        <div key={i} className={cn(
          'rounded-[var(--r)] border px-4 py-3',
          i === 0 ? 'bg-[var(--dark)] border-[var(--dark)]' : 'bg-white border-[var(--border2)] shadow-[var(--shadow)]',
        )}>
          <div className="text-[10px] font-semibold tracking-widest uppercase text-[var(--ink3)] mb-1">{k.label}</div>
          <div
            className="font-[family-name:var(--font-syne)] font-bold text-2xl leading-none"
            style={{ color: i === 0 ? 'white' : k.color || 'var(--ink)' }}
          >{k.value}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Project modal ────────────────────────────────────────────────────────────
function ProjectModal({
  open, onClose, project, onSave,
}: {
  open: boolean
  onClose: () => void
  project: Partial<Project> | null
  onSave: (data: Partial<Project>) => void
}) {
  const [form, setForm] = useState<Partial<Project>>(project ?? EMPTY_PROJECT)
  const isNew = !project?.id

  const set = (k: keyof Project, v: any) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal
      title={isNew ? 'Add Project' : 'Edit Project'}
      sub={isNew ? 'Register a new development project' : form.name}
      open={open}
      onClose={onClose}
      onApply={() => { onSave(form); onClose() }}
      applyLabel={isNew ? 'Add Project' : 'Save Changes'}
    >
      <div className="grid grid-cols-2 gap-x-3">
        <div className="col-span-2 form-group">
          <label className="form-label">Project Name *</label>
          <input className="form-input" value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. MHP3 Residences" />
        </div>
        <div className="form-group">
          <label className="form-label">Group</label>
          <input className="form-input" value={form.group ?? ''} onChange={e => set('group', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Company</label>
          <input className="form-input" value={form.company ?? ''} onChange={e => set('company', e.target.value)} />
        </div>
        <div className="col-span-2 form-group">
          <label className="form-label">Location</label>
          <input className="form-input" value={form.location ?? ''} onChange={e => set('location', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Dev Type</label>
          <input className="form-input" value={form.dev_type ?? ''} onChange={e => set('dev_type', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Land Tenure</label>
          <select className="form-select" value={form.land_tenure ?? ''} onChange={e => set('land_tenure', e.target.value)}>
            <option value="">—</option>
            <option>Freehold</option>
            <option>Leasehold</option>
            <option>Freehold (TBC)</option>
            <option>Leasehold (TBC)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Total Units</label>
          <input className="form-input" type="number" value={form.units ?? ''} onChange={e => set('units', e.target.value ? parseInt(e.target.value) : null)} placeholder="TBC" />
        </div>
        <div className="form-group">
          <label className="form-label">GDV</label>
          <input className="form-input" value={form.gdv ?? ''} onChange={e => set('gdv', e.target.value)} placeholder="e.g. RM 484 mil" />
        </div>
        <div className="form-group">
          <label className="form-label">Launch</label>
          <input className="form-input" value={form.launch ?? ''} onChange={e => set('launch', e.target.value)} placeholder="e.g. Q3 2025" />
        </div>
        <div className="form-group">
          <label className="form-label">Completion</label>
          <input className="form-input" value={form.completion ?? ''} onChange={e => set('completion', e.target.value)} placeholder="e.g. Q4 2027" />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status ?? 'planning'} onChange={e => set('status', e.target.value as ProjectStatus)}>
            {Object.entries(STATUS_MAP).map(([v, s]) => (
              <option key={v} value={v}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">PM</label>
          <input className="form-input" value={form.pm ?? ''} onChange={e => set('pm', e.target.value)} />
        </div>
        <div className="col-span-2 form-group">
          <label className="form-label">Description / Notes</label>
          <textarea className="form-textarea" rows={2} value={form.description ?? ''} onChange={e => set('description', e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ProjectsTab({ editMode }: { editMode: boolean }) {
  const { projects, loading, addProject, updateProject, deleteProject } = useDashboard()
  const { showToast, ToastEl } = useToast()

  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [sortField, setSortField] = useState<keyof Project | ''>('')
  const [sortDir, setSortDir]   = useState<1 | -1>(1)
  const [modal, setModal]       = useState<{ open: boolean; project: Partial<Project> | null }>({ open: false, project: null })

  const filtered = useMemo(() => {
    let rows = [...projects]
    if (filter !== 'all') rows = rows.filter(p => p.status === filter)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(p =>
        [p.name, p.group, p.location, p.dev_type, p.status].some(v => v?.toLowerCase().includes(q))
      )
    }
    if (sortField) {
      rows.sort((a, b) => {
        const av = String(a[sortField] ?? '').toLowerCase()
        const bv = String(b[sortField] ?? '').toLowerCase()
        return av < bv ? -sortDir : av > bv ? sortDir : 0
      })
    }
    return rows
  }, [projects, filter, search, sortField, sortDir])

  const handleSort = (f: keyof Project) => {
    if (sortField === f) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortField(f); setSortDir(1) }
  }

  const openAdd  = () => setModal({ open: true, project: null })
  const openEdit = (p: Project) => setModal({ open: true, project: { ...p } })
  const closeModal = () => setModal({ open: false, project: null })

  const handleSave = async (data: Partial<Project>) => {
    if (modal.project?.id) {
      await updateProject(modal.project.id, data)
      showToast('✓ Project updated')
    } else {
      await addProject(data as Omit<Project, 'id' | 'created_at' | 'updated_at'>)
      showToast('✓ Project added')
    }
  }

  const handleDelete = async (p: Project) => {
    if (!confirm(`Delete "${p.name}"?`)) return
    await deleteProject(p.id)
    showToast('Project removed')
  }

  const COLS: { key: keyof Project; label: string }[] = [
    { key: 'name', label: 'Project' }, { key: 'group', label: 'Group' },
    { key: 'location', label: 'Location' }, { key: 'dev_type', label: 'Type' },
    { key: 'units', label: 'Units' }, { key: 'gdv', label: 'GDV' },
    { key: 'launch', label: 'Launch' }, { key: 'completion', label: 'Completion' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <div className="relative z-[1] p-6">
      {/* KPIs */}
      <KpiStrip projects={projects} />

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <FilterBar options={FILTER_OPTIONS} active={filter} onChange={setFilter} />
        <div className="ml-auto flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search projects…" />
          <span className="text-[10px] text-[var(--ink3)]">{filtered.length} of {projects.length}</span>
          {editMode && (
            <Button variant="lime" size="sm" onClick={openAdd}>+ Add Project</Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                {COLS.map(c => (
                  <th key={c.key} onClick={() => handleSort(c.key)}>
                    {c.label} {sortField === c.key ? (sortDir === 1 ? '↑' : '↓') : ''}
                  </th>
                ))}
                <th>Land Tenure</th>
                {editMode && <th></th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {COLS.map((_, j) => (
                      <td key={j}><Skeleton className="h-3 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length + 2}>
                    <EmptyState icon="🏗️" title="No projects found" sub="Try adjusting your filter or search" />
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="group">
                    <td className="font-medium text-[var(--ink)] max-w-[180px] truncate" title={p.name}>{p.name}</td>
                    <td className="text-[11px] text-[var(--ink2)]">{p.group}</td>
                    <td className="text-[11px] text-[var(--ink2)] max-w-[140px] truncate" title={p.location}>{p.location}</td>
                    <td className="text-[10px] text-[var(--ink3)]">{p.dev_type}</td>
                    <td><span className="font-[family-name:var(--font-dm-mono)] text-[11px] bg-[var(--bg)] px-2 py-0.5 rounded">{p.units ?? 'TBC'}</span></td>
                    <td className="font-[family-name:var(--font-dm-mono)] text-[11px] text-[var(--lime-dark)] font-semibold">{p.gdv}</td>
                    <td className="text-[11px]">{p.launch}</td>
                    <td className="text-[11px]">{p.completion}</td>
                    <td>
                      <StatusPill
                        status={p.status}
                        onClick={editMode ? () => openEdit(p) : undefined}
                      />
                    </td>
                    <td className="text-[10px] text-[var(--ink3)]">{p.land_tenure || '—'}</td>
                    {editMode && (
                      <td>
                        <RowActions onEdit={() => openEdit(p)} onDelete={() => handleDelete(p)} />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {editMode && (
          <button
            onClick={openAdd}
            className="w-[calc(100%-44px)] mx-[22px] my-2.5 py-2 bg-[var(--bg)] border border-dashed border-[var(--border)] rounded-[var(--r-sm)] text-[var(--lime-dark)] text-[11px] font-semibold tracking-widest uppercase cursor-pointer hover:bg-[var(--lime-bg)] hover:border-[var(--lime-dark)] transition-all"
          >
            + Add Row
          </button>
        )}
      </Card>

      {/* Modal */}
      <ProjectModal
        open={modal.open}
        onClose={closeModal}
        project={modal.project}
        onSave={handleSave}
      />

      {ToastEl}
    </div>
  )
}
