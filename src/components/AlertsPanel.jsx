import { useApp } from '../AppContext'

export default function AlertsPanel({ alerts, onUpdateAlert, onDeleteAlert, onAddAlert }) {
  const { editMode, openModal } = useApp()

  const handleAlertClick = (alert) => {
    if (!editMode) return
    openModal({
      type: 'editAlert',
      title: 'Edit Alert',
      sub: 'Update this attention item',
      initialData: { type: alert.type, tag: alert.tag, title: alert.title, desc: alert.desc },
      onApply: (data) => onUpdateAlert(alert.id, data),
      onDelete: () => onDeleteAlert(alert.id),
    })
  }

  const handleAddAlert = () => {
    openModal({
      type: 'addAlert',
      title: 'Add Alert Item',
      sub: 'New attention item for management',
      initialData: { type: 'urgent', tag: '', title: '', desc: '' },
      onApply: (data) => onAddAlert(data),
    })
  }

  return (
    <div className="panel alerts-panel">
      <div className="section-label">Attention Required</div>
      <div className="alerts-list">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`alert-item ${alert.type}`}
            onClick={() => handleAlertClick(alert)}
          >
            <div className="alert-tag">{alert.tag}</div>
            <div className="alert-title">{alert.title}</div>
            <div className="alert-desc">{alert.desc}</div>
          </div>
        ))}
      </div>
      <button className="add-alert-btn" onClick={handleAddAlert}>
        + Add Alert Item
      </button>
    </div>
  )
}
