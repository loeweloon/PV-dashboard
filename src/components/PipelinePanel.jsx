import { useApp } from '../AppContext'

export default function PipelinePanel({ pipeline, onUpdateBar }) {
  const { editMode, openEditTextModal } = useApp()

  return (
    <div className="panel pipeline-panel">
      <div className="section-label">Pipeline by GDV (Active Projects)</div>
      <div className="pipeline-bars">
        {pipeline.map(bar => (
          <div className="bar-row" key={bar.id}>
            <span
              className={`bar-label${editMode ? ' editable' : ''}`}
              onClick={() =>
                editMode && openEditTextModal('Project Name', bar.label, val => onUpdateBar(bar.id, 'label', val))
              }
            >
              {bar.label}
            </span>
            <div className="bar-track">
              <div
                className={`bar-fill ${bar.type}`}
                style={{ width: `${bar.width}%`, animationDelay: bar.delay }}
              />
            </div>
            <span
              className={`bar-val${editMode ? ' editable' : ''}`}
              onClick={() =>
                editMode && openEditTextModal('GDV Value', bar.value, val => onUpdateBar(bar.id, 'value', val))
              }
            >
              {bar.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
