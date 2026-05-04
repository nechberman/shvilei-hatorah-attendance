import { useEffect, useState } from 'react'
import { Users, UserCheck, UserX, BookOpen, Sun, Moon, LayoutDashboard, BookMarked } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useHebrewCalendar } from '../hooks/useHebrewCalendar'
import StatCard from '../components/ui/StatCard'
import DonutChart from '../components/ui/DonutChart'
import PageHeader from '../components/ui/PageHeader'

interface DayStats {
  total: number
  present: number
  absent: number
  prayer: number
  morning: number
  afternoon: number
}

interface ClassStat {
  class_name: string
  total: number
  present: number
  percent: number
}

export default function Dashboard() {
  const { canSeeAll, myClassIds } = useAuth()
  const { hebrewDate, gregorianDate, parasha } = useHebrewCalendar()
  const [stats, setStats] = useState<DayStats>({ total: 0, present: 0, absent: 0, prayer: 0, morning: 0, afternoon: 0 })
  const [classStats, setClassStats] = useState<ClassStat[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    loadStats()
  }, [canSeeAll, myClassIds.join(',')])

  async function loadStats() {
    setLoading(true)
    try {
      let studentsQuery = supabase.from('students').select('id, class_id, classes(name)').eq('is_active', true)
      if (!canSeeAll && myClassIds.length > 0) studentsQuery = studentsQuery.in('class_id', myClassIds)

      const { data: students } = await studentsQuery
      if (!students) return

      const studentIds = students.map(s => s.id)

      const { data: attendance } = await supabase
        .from('attendance')
        .select('student_id, session, status')
        .in('student_id', studentIds)
        .eq('date', today)

      const att = attendance ?? []
      const presentIds = new Set(att.filter(a => a.status === 'present').map(a => a.student_id))
      const absentIds = new Set(att.filter(a => a.status === 'absent').map(a => a.student_id))

      const prayerPresent = att.filter(a => a.session === 'prayer' && a.status === 'present').length
      const morningPresent = att.filter(a => a.session === 'morning' && a.status === 'present').length
      const afternoonPresent = att.filter(a => a.session === 'afternoon' && a.status === 'present').length

      setStats({
        total: students.length,
        present: presentIds.size,
        absent: absentIds.size,
        prayer: prayerPresent,
        morning: morningPresent,
        afternoon: afternoonPresent,
      })

      const classMap = new Map<string, { name: string; total: number; present: number }>()
      for (const s of students) {
        const cls = s.classes as { name: string } | null
        const name = cls?.name ?? 'לא ידוע'
        if (!classMap.has(s.class_id)) classMap.set(s.class_id, { name, total: 0, present: 0 })
        const c = classMap.get(s.class_id)!
        c.total++
        if (presentIds.has(s.id)) c.present++
      }

      const cs: ClassStat[] = Array.from(classMap.values()).map(c => ({
        class_name: c.name,
        total: c.total,
        present: c.present,
        percent: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0,
      })).sort((a, b) => b.percent - a.percent)

      setClassStats(cs)
    } finally {
      setLoading(false)
    }
  }

  const overallPercent = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="דשבורד" subtitle="סקירה כללית של המוסד" icon={LayoutDashboard} />

      <div className="p-6 space-y-5">
        {/* Date + Parasha banner */}
        <div
          className="rounded-2xl px-6 py-4 flex items-center justify-between overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #0c1827 0%, #1e3a5f 60%, #0c2340 100%)' }}
        >
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-16 rounded-full opacity-20 blur-2xl"
            style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />

          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
              <BookOpen size={22} className="text-amber-300" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">{hebrewDate}</p>
              <p className="text-white/50 text-sm">{gregorianDate}</p>
            </div>
          </div>

          {parasha && (
            <div className="relative flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-xl px-4 py-2.5">
              <BookMarked size={16} className="text-amber-300 shrink-0" />
              <div className="text-left">
                <p className="text-amber-100 text-xs font-medium opacity-70">פרשת השבוע</p>
                <p className="text-amber-200 font-bold text-sm leading-tight">{parasha}</p>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Top stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="סה״כ תלמידים" value={stats.total} icon={Users} color="blue" />
              <StatCard label="נוכחים היום" value={stats.present} total={stats.total} icon={UserCheck} color="green" percent={overallPercent} />
              <StatCard label="חסרים היום" value={stats.absent} total={stats.total} icon={UserX} color="red" percent={stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0} />
            </div>

            {/* Session stats */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="תפילת שחרית" value={stats.prayer} total={stats.total} icon={BookOpen} color="purple" />
              <StatCard label="סדר בוקר" value={stats.morning} total={stats.total} icon={Sun} color="amber" />
              <StatCard label="סדר צהריים" value={stats.afternoon} total={stats.total} icon={Moon} color="orange" />
            </div>

            {/* Bottom: donut + class breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Donut chart */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-800 text-base mb-5">נוכחות כללית היום</h2>
                <div className="flex items-center gap-8">
                  <DonutChart percent={overallPercent} size={140} label="נוכחות כללית" />
                  <div className="space-y-3 flex-1">
                    {[
                      { label: 'נוכחים', value: stats.present, color: 'bg-emerald-500' },
                      { label: 'חסרים', value: stats.absent, color: 'bg-red-500' },
                      { label: 'לא דווח', value: stats.total - stats.present - stats.absent, color: 'bg-gray-200' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2.5">
                        <div className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
                        <span className="text-sm text-gray-500 flex-1">{item.label}</span>
                        <span className="text-sm font-bold text-gray-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Class breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-800 text-base mb-5">נוכחות לפי כיתות</h2>
                <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
                  {classStats.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">אין נתונים להצגה</p>
                  )}
                  {classStats.map(cs => (
                    <div key={cs.class_name}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-semibold text-gray-700">{cs.class_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs">{cs.present}/{cs.total}</span>
                          <span className={`text-xs font-bold min-w-[36px] text-right ${
                            cs.percent >= 70 ? 'text-emerald-600' : cs.percent >= 40 ? 'text-amber-600' : 'text-red-600'
                          }`}>{cs.percent}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${cs.percent}%`,
                            background: cs.percent >= 70
                              ? 'linear-gradient(90deg, #10b981, #34d399)'
                              : cs.percent >= 40
                              ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                              : 'linear-gradient(90deg, #dc2626, #f87171)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
