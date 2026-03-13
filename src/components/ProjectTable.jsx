import { useState } from 'react'
import { useApp } from '../AppContext'
import { STATUS_MAP } from '../data/statuses'

const FILTERS = [
  { key: 'all',          label: 'All Projects'         },
  { key: 'construction', label: 'Under Construction'   },
  { key: 'launched',     label: 'Launched'             },
  { key: 'planning',     label: 'Planning'             },
  { key: 'pending',      label: 'Pending Approvals'    },
  { key: 'completed',    label: 'Completed'            },
  { key: 'stop',         label: 'On Hold / Stopped'    },
]

function isVisible(project, filter) {
  if (filter === 'all') return true
  if (filter === 'stop') return project.status === 'stop' || project.status === 'hold'
  return project.status === filter
}

export default function ProjectTable({ projects, onUpdateProject, onDeleteProject, onAddProject }) {
  const { editMode, openModal } = useApp()
  const [filter, setFilter] = useState('all')

  const handleEditRow = (i) => {
    const p = projects[i]
    openModal({
      type: 'editProject',
      title: 'Edit Project',
      sub: `Row ${i + 1} of ${projects.length}`,
      initialData: { ...p },
      onApply: (data) => onUpdateProject(i, data),
    })
  }

  const handleStatusClick = (i) => {
    if (!editMode) return
    const p = projects[i]
    openModal({
      type: 'editStatus',
      title: 'Change Status',
      sub: p.name,
      initialData: { status: p.status },
      onApply: ({ status }) => onUpdateProject(i, { ...p, status }),
    })
  }

  const handleAddProject = () => {
    openModal({
      type: 'addProject',
      title: 'Add New Project',
      sub: 'Fill in project details',
      initialData: { name: '', group: '', location: '', units: 'TBC', gdv: 'TBC', launch: 'TBC', completion: 'TBC', status: 'planning' },
      onApply: (data) => onAddProject({ ...data, name: data.name || 'New Project', group: data.group || '—', location: data.location || '—' }),
    })
  }

  return (
    <div className="panel table-panel">
      <div className="section-label">Active Project Register</div>
      <div className="table-controls">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-btn${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <table>
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Group</th>
            <th>Location</th>
            <th>Units</th>
            <th>Est. GDV</th>
            <th>Launch</th>
            <th>Completion</th>
            <th>Status</th>
            {editMode && <th style={{ width: 60 }} />}
          </tr>
        </thead>
        <tbody>
          {projects.map((p, i) => {
            const s = STATUS_MAP[p.status] || STATUS_MAP.planning
            if (!isVisible(p, filter)) return null
            return (
              <tr key={i} className={`tr-${p.status}`} style={{ animationDelay: `${i * 0.02}s` }}>
                <td>{p.name}</td>
                <td>{p.group}</td>
                <td>{p.location}</td>
                <td className="units-tag">{p.units}</td>
                <td className="gdv-tag">{p.gdv}</td>
                <td>{p.launch}</td>
                <td>{p.completion}</td>
                <td>
                  <span
                    className={`status-pill ${s.pill}`}
                    onClick={() => handleStatusClick(i)}
                  >
                    {s.label}
                  </span>
                </td>
                {editMode && (
                  <td>
                    <div className="row-actions" style={{ opacity: 1 }}>
                      <button className="row-btn edit-row" title="Edit" onClick={() => handleEditRow(i)}>✎</button>
                      <button className="row-btn del-row" title="Delete" onClick={() => {
                        if (window.confirm(`Delete "${p.name}"?`)) {
                          onDeleteProject(i)
                        }
                      }}>✕</button>
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      <button className="add-row-btn" onClick={handleAddProject}>
        + Add New Project
      </button>
    </div>
  )
}
