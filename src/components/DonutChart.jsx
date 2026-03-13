import { useApp } from '../AppContext'

export default function DonutChart({ legend, onUpdateLegend }) {
  const { editMode, openEditTextModal } = useApp()

  return (
    <div className="panel donut-panel">
      <div className="section-label">Portfolio Status Mix</div>
      <div className="donut-wrap">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="46" fill="none" stroke="#1a2540" strokeWidth="16" />
          <circle cx="60" cy="60" r="46" fill="none" stroke="#2ecc8f" strokeWidth="16" strokeDasharray="150 289" strokeDashoffset="72"  transform="rotate(-90 60 60)" style={{ animation: 'donutIn 1.2s ease both .3s' }} />
          <circle cx="60" cy="60" r="46" fill="none" stroke="#4a9eff" strokeWidth="16" strokeDasharray="63 289"  strokeDashoffset="-78"  transform="rotate(-90 60 60)" style={{ animation: 'donutIn 1.2s ease both .45s' }} />
          <circle cx="60" cy="60" r="46" fill="none" stroke="#22d3c8" strokeWidth="16" strokeDasharray="69 289"  strokeDashoffset="-141" transform="rotate(-90 60 60)" style={{ animation: 'donutIn 1.2s ease both .60s' }} />
          <circle cx="60" cy="60" r="46" fill="none" stroke="#f59e2a" strokeWidth="16" strokeDasharray="46 289"  strokeDashoffset="-210" transform="rotate(-90 60 60)" style={{ animation: 'donutIn 1.2s ease both .75s' }} />
          <circle cx="60" cy="60" r="46" fill="none" stroke="#a78bfa" strokeWidth="16" strokeDasharray="46 289"  strokeDashoffset="-256" transform="rotate(-90 60 60)" style={{ animation: 'donutIn 1.2s ease both .90s' }} />
          <text x="60" y="55" textAnchor="middle" fill="#e8c97a" fontFamily="Playfair Display,serif" fontSize="18" fontWeight="700">50</text>
          <text x="60" y="70" textAnchor="middle" fill="rgba(244,241,236,0.5)" fontFamily="DM Sans,sans-serif" fontSize="9" letterSpacing="1">Projects</text>
        </svg>
        <div className="donut-legend">
          {legend.map(item => (
            <div key={item.id} className="legend-item">
              <div className="legend-dot" style={{ background: item.color }} />
              <span className="legend-name">{item.name}</span>
              <span
                className={`legend-pct${editMode ? ' editable' : ''}`}
                onClick={() =>
                  editMode && openEditTextModal(`${item.name} Count`, item.count, val => onUpdateLegend(item.id, val))
                }
              >
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
