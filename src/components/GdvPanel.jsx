import { useApp } from '../AppContext'

export default function GdvPanel({ gdvTotal, gdvRows, onUpdateTotal, onUpdateRow }) {
  const { editMode, openEditTextModal } = useApp()

  return (
    <div className="panel gdv-panel">
      <div className="section-label">Estimated GDV — Top Projects</div>
      <div className="gdv-total">
        <div
          className={`gdv-amount${editMode ? ' editable' : ''}`}
          onClick={() =>
            editMode && openEditTextModal('Total Portfolio GDV', gdvTotal, onUpdateTotal)
          }
        >
          {gdvTotal}
        </div>
        <div className="gdv-desc">Portfolio GDV (Active + Pipeline)</div>
      </div>
      <div className="gdv-breakdown">
        {gdvRows.map(row => (
          <div key={row.id} className={`gdv-row${row.type ? ' ' + row.type : ''}`}>
            <span
              className={`gdv-project${editMode ? ' editable' : ''}`}
              onClick={() =>
                editMode && openEditTextModal('Project', row.project, val => onUpdateRow(row.id, 'project', val))
              }
            >
              {row.project}
            </span>
            <span
              className={`gdv-fig${editMode ? ' editable' : ''}`}
              onClick={() =>
                editMode && openEditTextModal('GDV', row.fig, val => onUpdateRow(row.id, 'fig', val))
              }
            >
              {row.fig}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
