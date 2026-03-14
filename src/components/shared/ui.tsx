// src/components/shared/ui.tsx
'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'primary' | 'danger' | 'lime'
  size?: 'xs' | 'sm' | 'md'
}
export function Button({ variant = 'ghost', size = 'sm', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--r-pill)] border font-[family-name:var(--font-dm-sans)] font-medium transition-all cursor-pointer',
        size === 'xs' && 'px-2.5 py-1 text-[10px]',
        size === 'sm' && 'px-3 py-1.5 text-[11px]',
        size === 'md' && 'px-4 py-2 text-[12px]',
        variant === 'ghost'   && 'bg-white border-[var(--border)] text-[var(--ink2)] hover:bg-[var(--bg)] hover:text-[var(--ink)]',
        variant === 'primary' && 'bg-[var(--dark)] border-[var(--dark)] text-white hover:bg-[var(--dark2)]',
        variant === 'danger'  && 'bg-transparent border-red-300/50 text-red-500 hover:bg-red-50',
        variant === 'lime'    && 'bg-[var(--lime-bg)] border-[var(--lime-dark)]/40 text-[var(--lime-dark)] hover:bg-[var(--lime-bg)]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// ─── StatusPill ───────────────────────────────────────────────────────────────
const STATUS_PILL_MAP: Record<string, string> = {
  completed: 'pill-completed', construction: 'pill-construction',
  launched: 'pill-launched', planning: 'pill-planning',
  pending: 'pill-pending', stop: 'pill-stop', hold: 'pill-hold',
}
const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed', construction: 'Construction', launched: 'Launched',
  planning: 'Planning', pending: 'Pending', stop: 'Stopped', hold: 'On Hold',
}
export function StatusPill({ status, onClick }: { status: string; onClick?: () => void }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-[var(--r-pill)] text-[10px] font-semibold tracking-wide whitespace-nowrap',
        STATUS_PILL_MAP[status] ?? 'pill-planning',
        onClick && 'cursor-pointer hover:brightness-90',
      )}
      onClick={onClick}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('card', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border2)]">
      <div>
        <div className="font-[family-name:var(--font-syne)] font-bold text-[13px] text-[var(--ink)]">{title}</div>
        {sub && <div className="text-[10px] text-[var(--ink3)] mt-0.5">{sub}</div>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
export function KpiCard({
  label, value, sub, color, dark,
}: {
  label: string; value: string | number; sub?: string; color?: string; dark?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-[var(--r)] border p-4 flex flex-col gap-1',
      dark ? 'bg-[var(--dark)] border-[var(--dark)]' : 'bg-white border-[var(--border2)] shadow-[var(--shadow)]',
    )}>
      <div className={cn('text-[10px] font-semibold tracking-widest uppercase', dark ? 'text-[var(--ink3)]' : 'text-[var(--ink3)]')}>
        {label}
      </div>
      <div className={cn(
        'font-[family-name:var(--font-syne)] font-bold text-2xl leading-none',
        dark ? 'text-white' : '',
      )} style={color ? { color } : undefined}>
        {value}
      </div>
      {sub && <div className={cn('text-[10px]', dark ? 'text-[var(--ink3)]' : 'text-[var(--ink3)]')}>{sub}</div>}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  title: string
  sub?: string
  open: boolean
  onClose: () => void
  onApply?: () => void
  applyLabel?: string
  children: ReactNode
}
export function Modal({ title, sub, open, onClose, onApply, applyLabel = 'Apply', children }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else      document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: 'rgba(17,17,16,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-[var(--r)] shadow-[var(--shadow-lg)] w-full max-w-md animate-fade-up">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[var(--border2)]">
          <div>
            <div className="font-[family-name:var(--font-syne)] font-bold text-[15px] text-[var(--ink)]">{title}</div>
            {sub && <div className="text-[11px] text-[var(--ink3)] mt-0.5">{sub}</div>}
          </div>
          <button onClick={onClose} className="text-[var(--ink3)] hover:text-[var(--ink)] text-lg leading-none">✕</button>
        </div>
        {/* Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto">
          {children}
        </div>
        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[var(--border2)]">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {onApply && (
            <Button variant="primary" onClick={onApply}>{applyLabel}</Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const showToast = (msg: string) => {
    setMessage(msg)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(null), 2800)
  }

  const ToastEl = message ? (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] bg-[var(--dark)] text-white px-4 py-2.5 rounded-[var(--r-pill)] text-[12px] font-medium shadow-[var(--shadow-lg)] animate-fade-up"
    >
      {message}
    </div>
  ) : null

  return { showToast, ToastEl }
}

// ─── Row action buttons ───────────────────────────────────────────────────────
export function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={e => { e.stopPropagation(); onEdit() }}
        className="w-6 h-6 rounded-md border border-[rgba(122,171,30,0.3)] bg-white text-[var(--lime-dark)] text-[11px] flex items-center justify-center hover:bg-[var(--lime-bg)] transition-colors"
        title="Edit"
      >✎</button>
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="w-6 h-6 rounded-md border border-red-200 bg-white text-red-400 text-[11px] flex items-center justify-center hover:bg-red-50 transition-colors"
        title="Delete"
      >✕</button>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📊', title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-[var(--ink3)]">
      <span className="text-3xl">{icon}</span>
      <span className="text-[13px] font-medium text-[var(--ink2)]">{title}</span>
      {sub && <span className="text-[11px]">{sub}</span>}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-[var(--border2)] rounded', className)} />
  )
}

// ─── Filter pills ─────────────────────────────────────────────────────────────
export function FilterBar({ options, active, onChange }: {
  options: { value: string; label: string; dot?: string }[]
  active: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] text-[11px] font-medium border transition-all',
            active === o.value
              ? 'bg-[var(--dark)] text-white border-[var(--dark)]'
              : 'bg-white text-[var(--ink2)] border-[var(--border)] hover:bg-[var(--bg)]',
          )}
        >
          {o.dot && (
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: o.dot }} />
          )}
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── CSV upload button ────────────────────────────────────────────────────────
export function CSVUpload({ onLoad, label = '📥 Upload CSV' }: {
  onLoad: (text: string) => void
  label?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => ref.current?.click()}>{label}</Button>
      <input
        ref={ref}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = ev => { onLoad(ev.target?.result as string); e.target.value = '' }
          reader.readAsText(file)
        }}
      />
    </>
  )
}

// ─── Search input ─────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="flex items-center gap-2 bg-white border border-[var(--border)] rounded-[var(--r-pill)] px-3 py-1.5">
      <span className="text-[var(--ink3)] text-sm">⌕</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search…'}
        className="bg-transparent outline-none text-[12px] text-[var(--ink)] placeholder:text-[var(--ink3)] w-40"
      />
    </div>
  )
}
