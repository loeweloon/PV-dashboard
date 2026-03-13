import { useApp } from '../AppContext'

export default function Header({ liveDate, reportDate, footerNote: _fn, onUpdateReportDate }) {
  const { editMode, openEditTextModal } = useApp()

  return (
    <header>
      <div className="header-left">
        <div className="brand-row">
          <div className="brand-mark">PV</div>
          <h1>Platinum Victory</h1>
        </div>
        <div className="header-sub">
          Project Portfolio · Executive Dashboard · Marketing Intelligence
        </div>
      </div>
      <div className="header-right">
        <div className="live-date">{liveDate}</div>
        <div
          className={`report-label${editMode ? ' editable' : ''}`}
          onClick={() =>
            editMode &&
            openEditTextModal('Report Date', reportDate, onUpdateReportDate)
          }
        >
          {reportDate}
        </div>
      </div>
    </header>
  )
}
