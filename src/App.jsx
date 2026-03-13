import { useState, useEffect, useCallback } from 'react'
import { AppContext } from './AppContext'

import Header       from './components/Header'
import EditBar      from './components/EditBar'
import Toast        from './components/Toast'
import Modal        from './components/Modal'
import KpiStrip     from './components/KpiStrip'
import PipelinePanel from './components/PipelinePanel'
import GdvPanel     from './components/GdvPanel'
import AlertsPanel  from './components/AlertsPanel'
import ProjectTable from './components/ProjectTable'
import DonutChart   from './components/DonutChart'
import Timeline     from './components/Timeline'
import Footer       from './components/Footer'

import { initialProjects } from './data/projects'
import { initialAlerts }   from './data/alerts'
import { initialPipeline } from './data/pipeline'
import { initialGdvTotal, initialGdvRows } from './data/gdv'
import { initialTimeline } from './data/timeline'
import { initialKpis }     from './data/kpis'
import { initialLegend }   from './data/legend'

export default function App() {
  // ── Core state ──
  const [editMode, setEditMode] = useState(false)
  const [modal, setModal]       = useState(null)
  const [toast, setToast]       = useState({ visible: false, message: '' })

  // ── Data state ──
  const [projects,    setProjects]    = useState(() => {
    try { const s = localStorage.getItem('pvDashboardProjects'); return s ? JSON.parse(s) : initialProjects } catch { return initialProjects }
  })
  const [alerts,      setAlerts]      = useState(initialAlerts)
  const [pipeline,    setPipeline]    = useState(initialPipeline)
  const [gdvTotal,    setGdvTotal]    = useState(initialGdvTotal)
  const [gdvRows,     setGdvRows]     = useState(initialGdvRows)
  const [timeline,    setTimeline]    = useState(initialTimeline)
  const [kpis,        setKpis]        = useState(initialKpis)
  const [legend,      setLegend]      = useState(initialLegend)
  const [reportDate,  setReportDate]  = useState('As at 25 February 2026')
  const [footerNote,  setFooterNote]  = useState('Confidential · For internal management use only · Data as at 25 February 2026')
  const [liveDate,    setLiveDate]    = useState('')

  // ── Live date ──
  useEffect(() => {
    const fmt = () => {
      const d = new Date()
      setLiveDate(d.toLocaleString('en-MY', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))
    }
    fmt()
    const id = setInterval(fmt, 60000)
    return () => clearInterval(id)
  }, [])

  // ── Sync edit-mode class on body ──
  useEffect(() => {
    document.body.classList.toggle('edit-mode', editMode)
  }, [editMode])

  // ── Toast ──
  const showToast = useCallback((msg) => {
    setToast({ visible: true, message: msg })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2800)
  }, [])

  // ── Toggle edit mode ──
  const toggleEditMode = useCallback(() => {
    setEditMode(prev => {
      const next = !prev
      if (next) showToast('Edit mode ON — click any highlighted element to edit')
      return next
    })
  }, [showToast])

  // ── Modal helpers ──
  const openModal = useCallback((config) => setModal(config), [])
  const closeModal = useCallback(() => setModal(null), [])

  const openEditTextModal = useCallback((label, value, onUpdate) => {
    openModal({
      type: 'editText',
      title: `Edit: ${label}`,
      sub: 'Click Apply to save',
      label,
      initialData: { label, value },
      onApply: ({ value: newVal }) => {
        onUpdate(newVal)
        showToast(`${label} updated`)
      },
    })
  }, [openModal, showToast])

  // ── Save ──
  const handleSave = useCallback(() => {
    localStorage.setItem('pvDashboardProjects', JSON.stringify(projects))
    showToast('✓ Changes saved to browser storage')
  }, [projects, showToast])

  // ── Export (JSON data dump) ──
  const handleExport = useCallback(() => {
    const data = { projects, alerts, kpis, pipeline, gdvTotal, gdvRows, timeline, legend, reportDate, footerNote }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `PV_Dashboard_Data_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    showToast('Dashboard data exported!')
  }, [projects, alerts, kpis, pipeline, gdvTotal, gdvRows, timeline, legend, reportDate, footerNote, showToast])

  // ── KPI updater ──
  const handleUpdateKpi = useCallback((id, field, val) => {
    setKpis(prev => prev.map(k => k.id === id ? { ...k, [field]: val } : k))
    showToast(`${field} updated`)
  }, [showToast])

  // ── Pipeline updater ──
  const handleUpdateBar = useCallback((id, field, val) => {
    setPipeline(prev => prev.map(b => b.id === id ? { ...b, [field]: val } : b))
  }, [])

  // ── GDV updaters ──
  const handleUpdateGdvRow = useCallback((id, field, val) => {
    setGdvRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r))
  }, [])

  // ── Alert updaters ──
  const handleUpdateAlert = useCallback((id, data) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, ...data } : a))
    showToast('Alert updated')
  }, [showToast])

  const handleDeleteAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
    showToast('Alert removed')
  }, [showToast])

  const handleAddAlert = useCallback((data) => {
    setAlerts(prev => [...prev, { ...data, id: Date.now() }])
    showToast('Alert added')
  }, [showToast])

  // ── Project updaters ──
  const handleUpdateProject = useCallback((i, data) => {
    setProjects(prev => prev.map((p, idx) => idx === i ? data : p))
    showToast('Project updated')
  }, [showToast])

  const handleDeleteProject = useCallback((i) => {
    setProjects(prev => prev.filter((_, idx) => idx !== i))
    showToast('Project removed')
  }, [showToast])

  const handleAddProject = useCallback((data) => {
    setProjects(prev => [...prev, data])
    showToast('Project added')
  }, [showToast])

  // ── Timeline updater ──
  const handleUpdateTimelineItem = useCallback((id, field, val) => {
    setTimeline(prev => prev.map(section => ({
      ...section,
      items: section.items.map(item => item.id === id ? { ...item, [field]: val } : item),
    })))
  }, [])

  // ── Legend updater ──
  const handleUpdateLegend = useCallback((id, count) => {
    setLegend(prev => prev.map(l => l.id === id ? { ...l, count } : l))
  }, [])

  // ── Context value ──
  const ctx = { editMode, toggleEditMode, openModal, closeModal, openEditTextModal, showToast }

  return (
    <AppContext.Provider value={ctx}>
      <EditBar onSave={handleSave} onExport={handleExport} />
      <Toast message={toast.message} visible={toast.visible} />
      {modal && <Modal modal={modal} onClose={closeModal} />}

      <Header
        liveDate={liveDate}
        reportDate={reportDate}
        onUpdateReportDate={setReportDate}
      />

      <main>
        <KpiStrip kpis={kpis} onUpdateKpi={handleUpdateKpi} />

        <PipelinePanel pipeline={pipeline} onUpdateBar={handleUpdateBar} />

        <GdvPanel
          gdvTotal={gdvTotal}
          gdvRows={gdvRows}
          onUpdateTotal={setGdvTotal}
          onUpdateRow={handleUpdateGdvRow}
        />

        <AlertsPanel
          alerts={alerts}
          onUpdateAlert={handleUpdateAlert}
          onDeleteAlert={handleDeleteAlert}
          onAddAlert={handleAddAlert}
        />

        <ProjectTable
          projects={projects}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onAddProject={handleAddProject}
        />

        <DonutChart legend={legend} onUpdateLegend={handleUpdateLegend} />

        <Timeline timeline={timeline} onUpdateItem={handleUpdateTimelineItem} />
      </main>

      <Footer footerNote={footerNote} onUpdateFooterNote={setFooterNote} />
    </AppContext.Provider>
  )
}
