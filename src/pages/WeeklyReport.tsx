import { useEffect, useState } from 'react'
import { FileText, ChevronRight, ChevronLeft, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/ui/PageHeader'
import type { AttendanceStatus } from '../types'
import { ATTENDANCE_STATUS_LABELS } from '../types'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  return d
}

interface WeekRow {
  student_id: string
  student_name: string
  class_name: string
  prayer_status: AttendanceStatus | null
  morning_status: AttendanceStatus | null
  afternoon_status: AttendanceStatus | null
  morning_rating: number | null
  afternoon_rating: number | null
  present_days: number
  absent_days: number
}

export default function WeeklyReport() {
  const { canSeeAll, myClassIds } = useAuth()
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [rows, setRows] = useState<WeekRow[]>([])
  const [loading, setLoading] = useState(true)
  const [classFilter, setClassFilter] = useState('all')
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])

  const weekStartStr = weekStart.toISOString().split('T')[0]
  const weekDates: string[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => { loadClasses() }, [])
  useEffect(() => { loadReport() }, [weekStartStr, classFilter, canSeeAll, myClassIds.join(',')])

  async function loadClasses() {
    const { data } = await supabase.from('classes').select('id, name').order('name')
    if (data) setClasses(data)
  }

  async function loadReport() {
    setLoading(true)
    try {
      let q = supabase.from('students').select('id, first_name, last_name, class_id, class:classes(name)').eq('is_active', true).order('last_name')
      if (!canSeeAll && myClassIds.length > 0) q = q.in('class_id', myClassIds)
      if (classFilter !== 'all') q = q.eq('class_id', classFilter)

      const { data: students } = await q
      if (!students) return

      const ids = students.map(s => s.id)

      const [{ data: att }, { data: asmts }] = await Promise.all([
        supabase.from('attendance').select('*').in('student_id', ids).in('date', weekDates),
        supabase.from('weekly_assessments').select('*').in('student_id', ids).eq('week_start', weekStartStr),
      ])

      const result: WeekRow[] = students.map(s => {
        const cls = s.class as { name: string } | null
        const sAtt = (att ?? []).filter(a => a.student_id === s.id)
        const asmt = (asmts ?? []).find(a => a.student_id === s.id)
        const presentDays = new Set(sAtt.filter(a => a.status === 'present').map(a => a.date)).size
        const absentDays = new Set(sAtt.filter(a => a.status === 'absent').map(a => a.date)).size

        const todayAtt = sAtt.filter(a => a.date === new Date().toISOString().split('T')[0])
        const getSession = (ses: string) => todayAtt.find(a => a.session === ses)?.status ?? null

        return {
          student_id: s.id,
          student_name: `${s.last_name} ${s.first_name}`,
          class_name: cls?.name ?? '',
          prayer_status: getSession('prayer') as AttendanceStatus | null,
          morning_status: getSession('morning') as AttendanceStatus | null,
          afternoon_status: getSession('afternoon') as AttendanceStatus | null,
          morning_rating: asmt?.morning_rating ?? null,
          afternoon_rating: asmt?.afternoon_rating ?? null,
          present_days: presentDays,
          absent_days: absentDays,
        }
      })

      setRows(result)
    } finally {
      setLoading(false)
    }
  }

  function changeWeek(delta: number) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + delta * 7)
    setWeekStart(d)
  }

  const fmt = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short' })
  const weekLabel = `${fmt.format(weekStart)} – ${fmt.format(new Date(weekStart.getTime() + 5 * 86400000))}`

  const statusBadge = (s: AttendanceStatus | null) => {
    if (!s) return <span className="text-gray-300 text-xs">—</span>
    const colors: Record<string, string> = {
      present: 'bg-green-100 text-green-700',
      absent: 'bg-red-100 text-red-700',
      late: 'bg-amber-100 text-amber-700',
      sick: 'bg-violet-100 text-violet-700',
      not_participating: 'bg-gray-100 text-gray-600',
    }
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[s] ?? ''}`}>{ATTENDANCE_STATUS_LABELS[s]}</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="דיווח שבועי" subtitle="סיכום נוכחות ותפקוד לפי שבוע" icon={FileText}>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
          <option value="all">כל הכיתות</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </PageHeader>

      <div className="p-6">
        {/* Week nav */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex items-center justify-between">
          <button onClick={() => changeWeek(-1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
            <ChevronRight size={18} />
          </button>
          <div className="text-center">
            <p className="font-bold text-gray-800">{weekLabel}</p>
            <p className="text-xs text-gray-400 mt-0.5">{rows.length} תלמידים</p>
          </div>
          <button onClick={() => changeWeek(1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
            <ChevronLeft size={18} />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 font-semibold text-gray-500">תלמיד</th>
                <th className="text-right px-3 py-3 font-semibold text-gray-500">כיתה</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-500">תפילה</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-500">בוקר</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-500">צהריים</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-500">דירוג בוקר</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-500">דירוג צהריים</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-500">נוכח (ימים)</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-500">חסר (ימים)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-16 text-gray-400">
                  <div className="flex justify-center"><div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" /></div>
                </td></tr>
              ) : rows.map(row => (
                <tr key={row.student_id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.student_name}</td>
                  <td className="px-3 py-3 text-gray-500">{row.class_name}</td>
                  <td className="px-3 py-3 text-center">{statusBadge(row.prayer_status)}</td>
                  <td className="px-3 py-3 text-center">{statusBadge(row.morning_status)}</td>
                  <td className="px-3 py-3 text-center">{statusBadge(row.afternoon_status)}</td>
                  <td className="px-3 py-3 text-center">
                    {row.morning_rating ? <span className="font-bold text-amber-600">{row.morning_rating}/5</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {row.afternoon_rating ? <span className="font-bold text-blue-600">{row.afternoon_rating}/5</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-3 text-center"><span className="text-green-600 font-semibold">{row.present_days}</span></td>
                  <td className="px-3 py-3 text-center"><span className="text-red-500 font-semibold">{row.absent_days}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
