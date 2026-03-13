import { useApp } from '../AppContext'

function KpiCard({ kpi, onUpdateValue, onUpdateSub }) {
  const { editMode, openEditTextModal } = useApp()

  return (
    <div className={`kpi-card ${kpi.color}`} style={{ animationDelay: kpi.delay }}>
      <span className="kpi-icon">{kpi.icon}</span>
      <div
        className={`kpi-value${editMode ? ' editable' : ''}`}
        onClick={() =>
          editMode && openEditTextModal(kpi.label, kpi.value, onUpdateValue)
        }
      >
        {kpi.value}
      </div>
      <div className="kpi-label">{kpi.label}</div>
      <div
        className={`kpi-sub${editMode ? ' editable' : ''}`}
        onClick={() =>
          editMode && openEditTextModal(`${kpi.label} Subtitle`, kpi.sub, onUpdateSub)
        }
      >
        {kpi.sub}
      </div>
    </div>
  )
}

export default function KpiStrip({ kpis, onUpdateKpi }) {
  return (
    <div className="kpi-strip">
      {kpis.map(kpi => (
        <KpiCard
          key={kpi.id}
          kpi={kpi}
          onUpdateValue={val => onUpdateKpi(kpi.id, 'value', val)}
          onUpdateSub={val => onUpdateKpi(kpi.id, 'sub', val)}
        />
      ))}
    </div>
  )
}
