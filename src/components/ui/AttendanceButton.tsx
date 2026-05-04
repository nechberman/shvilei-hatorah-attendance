import { useState, useRef, useEffect } from 'react'
import { Check, X, Clock, Thermometer, EyeOff, ChevronDown, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { AttendanceStatus } from '../../types'
import { ATTENDANCE_STATUS_LABELS } from '../../types'

interface AttendanceButtonProps {
  status: AttendanceStatus | null
  saving?: boolean
  onSelect: (status: AttendanceStatus) => void
  disabled?: boolean
}

const statusConfig: Record<AttendanceStatus, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  present:          { icon: Check,        color: 'text-white', bg: 'bg-green-500',  border: 'border-green-500' },
  absent:           { icon: X,            color: 'text-white', bg: 'bg-red-500',    border: 'border-red-500'   },
  late:             { icon: Clock,        color: 'text-white', bg: 'bg-amber-500',  border: 'border-amber-500' },
  sick:             { icon: Thermometer,  color: 'text-white', bg: 'bg-violet-500', border: 'border-violet-500'},
  not_participating:{ icon: EyeOff,       color: 'text-white', bg: 'bg-gray-400',   border: 'border-gray-400'  },
}

const statusOrder: AttendanceStatus[] = ['present', 'absent', 'late', 'sick', 'not_participating']

export default function AttendanceButton({ status, saving, onSelect, disabled }: AttendanceButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const cfg = status ? statusConfig[status] : null
  const Icon = cfg?.icon

  return (
    <div ref={ref} className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'btn-pop flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium min-w-[90px] justify-center transition-all',
          saving && 'opacity-60 cursor-wait',
          cfg
            ? `${cfg.bg} ${cfg.border} ${cfg.color}`
            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'
        )}
      >
        {saving
          ? <Loader2 size={13} className="animate-spin" />
          : Icon
          ? <Icon size={13} />
          : null
        }
        <span>{status ? ATTENDANCE_STATUS_LABELS[status] : 'בחר'}</span>
        {!saving && <ChevronDown size={11} className="opacity-60" />}
      </button>

      {open && !disabled && (
        <div className="absolute top-full mt-1 right-0 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-40 fade-in">
          {statusOrder.map(s => {
            const c = statusConfig[s]
            const SIcon = c.icon
            return (
              <button
                key={s}
                onClick={() => { onSelect(s); setOpen(false) }}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                  status === s && 'bg-gray-50 font-semibold'
                )}
              >
                <span className={clsx('w-6 h-6 rounded-md flex items-center justify-center', c.bg)}>
                  <SIcon size={12} className="text-white" />
                </span>
                <span className="text-gray-700">{ATTENDANCE_STATUS_LABELS[s]}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
