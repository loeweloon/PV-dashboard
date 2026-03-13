import { useApp } from '../AppContext'

export default function Timeline({ timeline, onUpdateItem }) {
  const { editMode, openEditTextModal } = useApp()

  return (
    <div className="panel timeline-panel">
      <div className="section-label">Upcoming Key Events</div>
      <div className="timeline">
        {timeline.map((section, si) => (
          <div key={si}>
            <div className="tl-year">{section.year}</div>
            {section.items.map(item => (
              <div key={item.id} className="tl-item">
                <div className="tl-dot" style={{ background: item.color }} />
                <span
                  className={`tl-name${editMode ? ' editable' : ''}`}
                  onClick={() =>
                    editMode && openEditTextModal('Project Name', item.name, val => onUpdateItem(item.id, 'name', val))
                  }
                >
                  {item.name}
                </span>
                <span
                  className={`tl-event${editMode ? ' editable' : ''}`}
                  onClick={() =>
                    editMode && openEditTextModal('Event', item.event, val => onUpdateItem(item.id, 'event', val))
                  }
                >
                  {item.event}
                </span>
                <span
                  className={`tl-date${editMode ? ' editable' : ''}`}
                  onClick={() =>
                    editMode && openEditTextModal('Date', item.date, val => onUpdateItem(item.id, 'date', val))
                  }
                >
                  {item.date}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
