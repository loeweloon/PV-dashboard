import { useState, useEffect } from 'react'
import { STATUS_MAP } from '../data/statuses'

const ALERT_TYPES = ['urgent', 'watch', 'info', 'milestone', 'complete']

function EditTextForm({ data, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">{data.label}</label>
      <input
        className="form-input"
        value={data.value}
        onChange={e => onChange('value', e.target.value)}
        autoFocus
      />
    </div>
  )
}

function ProjectForm({ data, onChange }) {
  return (
    <div className="form-grid">
      <div className="form-group" style={{ gridColumn: '1/-1' }}>
        <label className="form-label">Project Name</label>
        <input className="form-input" value={data.name} onChange={e => onChange('name', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Group</label>
        <input className="form-input" value={data.group} onChange={e => onChange('group', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Location</label>
        <input className="form-input" value={data.location} onChange={e => onChange('location', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Total Units</label>
        <input className="form-input" value={data.units} onChange={e => onChange('units', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Est. GDV</label>
        <input className="form-input" value={data.gdv} onChange={e => onChange('gdv', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Launch Date</label>
        <input className="form-input" value={data.launch} onChange={e => onChange('launch', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Completion Date</label>
        <input className="form-input" value={data.completion} onChange={e => onChange('completion', e.target.value)} />
      </div>
      <div className="form-group" style={{ gridColumn: '1/-1' }}>
        <label className="form-label">Status</label>
        <select className="form-select" value={data.status} onChange={e => onChange('status', e.target.value)}>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function StatusForm({ data, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">Current Status → New Status</label>
      <select className="form-select" value={data.status} onChange={e => onChange('status', e.target.value)}>
        {Object.entries(STATUS_MAP).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
    </div>
  )
}

function AlertForm({ data, onChange, onDelete }) {
  return (
    <>
      <div className="form-group">
        <label className="form-label">Alert Type</label>
        <select className="form-select" value={data.type} onChange={e => onChange('type', e.target.value)}>
          {ALERT_TYPES.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Tag Label</label>
        <input className="form-input" value={data.tag} onChange={e => onChange('tag', e.target.value)} placeholder="e.g. ⚠ Urgent" />
      </div>
      <div className="form-group">
        <label className="form-label">Title</label>
        <input className="form-input" value={data.title} onChange={e => onChange('title', e.target.value)} placeholder="e.g. Project X — Issue" />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-textarea" value={data.desc} onChange={e => onChange('desc', e.target.value)} placeholder="Describe the issue..." />
      </div>
      {onDelete && (
        <div className="form-group">
          <label className="form-label">Action</label>
          <button
            type="button"
            onClick={onDelete}
            style={{ padding: '6px 14px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '4px', color: 'var(--red)', fontSize: '11px', cursor: 'pointer' }}
          >
            Delete this alert
          </button>
        </div>
      )}
    </>
  )
}

export default function Modal({ modal, onClose }) {
  const [formData, setFormData] = useState(() => modal?.initialData || {})

  useEffect(() => {
    setFormData(modal?.initialData || {})
  }, [modal])

  if (!modal) return null

  const update = (key, val) => setFormData(prev => ({ ...prev, [key]: val }))

  const handleApply = () => {
    modal.onApply(formData)
    onClose()
  }

  const handleDelete = () => {
    modal.onDelete?.()
    onClose()
  }

  const renderBody = () => {
    switch (modal.type) {
      case 'editText':
        return <EditTextForm data={formData} onChange={update} />
      case 'editProject':
      case 'addProject':
        return <ProjectForm data={formData} onChange={update} />
      case 'editStatus':
        return <StatusForm data={formData} onChange={update} />
      case 'editAlert':
        return <AlertForm data={formData} onChange={update} onDelete={modal.onDelete ? handleDelete : null} />
      case 'addAlert':
        return <AlertForm data={formData} onChange={update} />
      default:
        return null
    }
  }

  return (
    <div
      className="modal-overlay open"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{modal.title}</div>
        <div className="modal-sub">{modal.sub}</div>
        <div>{renderBody()}</div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-apply" onClick={handleApply}>Apply Changes</button>
        </div>
      </div>
    </div>
  )
}
