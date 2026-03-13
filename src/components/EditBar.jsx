import { useApp } from '../AppContext'

export default function EditBar({ onSave, onExport }) {
  const { editMode, toggleEditMode } = useApp()

  return (
    <div className="edit-bar">
      <button
        className={`export-btn${editMode ? ' visible' : ''}`}
        onClick={onExport}
      >
        ⬇ Export
      </button>
      <button
        className={`save-btn${editMode ? ' visible' : ''}`}
        onClick={onSave}
      >
        ✓ Save Changes
      </button>
      <div
        className={`edit-toggle${editMode ? ' active' : ''}`}
        onClick={toggleEditMode}
      >
        <div className="edit-dot" />
        <span>{editMode ? 'Editing...' : 'Edit Mode'}</span>
      </div>
    </div>
  )
}
