import { useApp } from '../AppContext'

export default function Footer({ footerNote, onUpdateFooterNote }) {
  const { editMode, openEditTextModal } = useApp()

  return (
    <footer>
      <div
        className={`footer-note${editMode ? ' editable' : ''}`}
        onClick={() =>
          editMode && openEditTextModal('Footer Note', footerNote, onUpdateFooterNote)
        }
      >
        {footerNote}
      </div>
      <div className="footer-mark">Platinum Victory Group</div>
    </footer>
  )
}
