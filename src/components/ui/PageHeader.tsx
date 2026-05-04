import type { LucideIcon } from 'lucide-react'
import { BookMarked } from 'lucide-react'
import { useHebrewCalendar } from '../../hooks/useHebrewCalendar'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  children?: React.ReactNode
}

export default function PageHeader({ title, subtitle, icon: Icon, iconColor = 'text-orange-500', children }: PageHeaderProps) {
  const { hebrewDate, gregorianDate, parasha, loading } = useHebrewCalendar()

  return (
    <div className="bg-white border-b border-gray-100 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <Icon size={20} className={iconColor} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {children}

          {/* Date + Parasha block */}
          <div className="flex items-center gap-2.5 text-left">
            {!loading && parasha && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                <BookMarked size={13} className="text-amber-600 shrink-0" />
                <span className="text-xs font-semibold text-amber-700">{parasha}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-700 leading-tight">{hebrewDate}</p>
              <p className="text-xs text-gray-400">{gregorianDate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
