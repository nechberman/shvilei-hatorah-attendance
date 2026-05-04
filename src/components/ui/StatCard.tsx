import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  total?: number
  icon: LucideIcon
  color: 'orange' | 'green' | 'red' | 'blue' | 'purple' | 'amber'
  percent?: number
  subtitle?: string
}

const colorMap = {
  orange: { gradient: 'from-orange-400 to-orange-600', ring: 'ring-orange-100', bar: 'from-orange-400 to-orange-500', text: 'text-orange-500' },
  green:  { gradient: 'from-emerald-400 to-green-600', ring: 'ring-green-100',  bar: 'from-emerald-400 to-green-500', text: 'text-emerald-600' },
  red:    { gradient: 'from-red-400 to-rose-600',      ring: 'ring-red-100',    bar: 'from-red-400 to-rose-500',      text: 'text-red-500'   },
  blue:   { gradient: 'from-blue-400 to-indigo-600',   ring: 'ring-blue-100',   bar: 'from-blue-400 to-indigo-500',   text: 'text-blue-500'  },
  purple: { gradient: 'from-violet-400 to-purple-600', ring: 'ring-purple-100', bar: 'from-violet-400 to-purple-500', text: 'text-violet-500' },
  amber:  { gradient: 'from-amber-400 to-yellow-600',  ring: 'ring-amber-100',  bar: 'from-amber-400 to-yellow-500',  text: 'text-amber-500' },
}

export default function StatCard({ label, value, total, icon: Icon, color, percent, subtitle }: StatCardProps) {
  const c = colorMap[color]
  const pct = percent ?? (total && typeof value === 'number' ? Math.round((value / total) * 100) : undefined)

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-sm ring-4 ${c.ring}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="text-left">
          <p className="text-3xl font-black text-gray-800 leading-none tracking-tight">{value}</p>
          {total !== undefined && (
            <p className="text-xs text-gray-400 mt-1">מתוך {total}</p>
          )}
        </div>
      </div>

      <p className="text-sm font-semibold text-gray-600">{label}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}

      {pct !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${c.bar} transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className={`text-xs font-bold mt-1.5 ${c.text}`}>{pct}%</p>
        </div>
      )}
    </div>
  )
}
