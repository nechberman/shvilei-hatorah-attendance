import { useEffect, useState, useCallback } from 'react'
import { ChevronRight, ChevronLeft, BarChart3, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Avatar from '../components/ui/Avatar'
import PageHeader from '../components/ui/PageHeader'
import { clsx } from 'clsx'
import type { Student, WeeklyAssessment as WeeklyAssessmentType } from '../types'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  // Week starts on Sunday
  d.setDate(d.getDate() - day)
  return d
}

function formatWeekLabel(weekStart: Date): string {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 5) // Friday
  const fmt = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long' })
  return `${fmt.format(weekStart)} – ${fmt.format(end)}`
}

const RATING_COLORS = ['', 'bg-red-500', 'bg-orange-400', 'bg-amber-400', 'bg-lime-500', 'bg-green-500']

interface AssessmentMap {
  [studentId: string]: WeeklyAssessmentType
}

export default function WeeklyAssessment() {
  const { canSeeAll, myClassIds, myMorningClassIds, myAfternoonClassIds, staff } = useAuth()
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [students, setStudents] = useState<Student[]>([])
  const [assessments, setAssessments] = useState<AssessmentMap>({})
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState('all')
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])

  const weekStartStr = weekStart.toISOString().split('T')[0]

  useEffect(() => { loadClasses() }, [])
  useEffect(() => { loadData() }, [weekStartStr, selectedClass, canSeeAll, myClassIds.join(',')])

  async function loadClasses() {
    const { data } = await supabase.from('classes').select('id, name').order('name')
    if (data) setClasses(data)
  }

  async function loadData() {
    setLoading(true)
    try {
      let q = supabase.from('students').select('*, class:classes(id,name)').eq('is_active', true).order('last_name')
      if (!canSeeAll && myClassIds.length > 0) q = q.in('class_id', myClassIds)
      if (selectedClass !== 'all') q = q.eq('class_id', selectedClass)
      const { data: studentsData } = await q
      if (!studentsData) return
      setStudents(studentsData as Student[])

      const { data: asmts } = await supabase
        .from('weekly_assessments')
        .select('*')
        .in('student_id', studentsData.map(s => s.id))
        .eq('week_start', weekStartStr)

      const map: AssessmentMap = {}
      for (const a of (asmts ?? []) as WeeklyAssessmentType[]) map[a.student_id] = a
      setAssessments(map)
    } finally {
      setLoading(false)
    }
  }

  const canMarkMorning = useCallback((classId: string) => {
    return canSeeAll || myMorningClassIds.includes(classId)
  }, [canSeeAll, myMorningClassIds])

  const canMarkAfternoon = useCallback((classId: string) => {
    return canSeeAll || myAfternoonClassIds.includes(classId)
  }, [canSeeAll, myAfternoonClassIds])

  async function updateAssessment(studentId: string, field: keyof WeeklyAssessmentType, value: number | null) {
    const current = assessments[studentId] ?? { student_id: studentId, week_start: weekStartStr }
    const updated = { ...current, [field]: value }

    setAssessments(prev => ({ ...prev, [studentId]: updated as WeeklyAssessmentType }))
    setSavingIds(prev => new Set([...prev, studentId]))

    await supabase.from('weekly_assessments').upsert({
      student_id: studentId,
      week_start: weekStartStr,
      morning_rating: updated.morning_rating ?? null,
      afternoon_rating: updated.afternoon_rating ?? null,
      morning_grade: updated.morning_grade ?? null,
      afternoon_grade: updated.afternoon_grade ?? null,
      notes: updated.notes ?? null,
      marked_by: staff?.id ?? null,
    }, { onConflict: 'student_id,week_start' })

    setSavingIds(prev => { const s = new Set(prev); s.delete(studentId); return s })
  }

  function changeWeek(delta: number) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + delta * 7)
    setWeekStart(d)
  }

  const isCurrentWeek = weekStartStr === getWeekStart(new Date()).toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="תפקוד שבועי" subtitle="דירוג תלמידים לפי שבוע" icon={BarChart3}>
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
        >
          <option value="all">כל הכיתות</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </PageHeader>

      <div className="p-6">
        {/* Week selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <button onClick={() => changeWeek(-1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
              <ChevronRight size={18} />
            </button>
            <div className="text-center">
              <p className="font-bold text-gray-800">{formatWeekLabel(weekStart)}</p>
              {isCurrentWeek && (
                <span className="inline-block text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium mt-1">השבוע הנוכחי</span>
              )}
            </div>
            <button onClick={() => changeWeek(1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>

        {/* Student cards grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {students.map(student => {
              const a = assessments[student.id]
              const isSaving = savingIds.has(student.id)
              const canMorning = canMarkMorning(student.class_id)
              const canAfternoon = canMarkAfternoon(student.class_id)

              return (
                <div key={student.id} className={clsx('bg-white rounded-2xl border border-gray-100 shadow-sm p-4 transition-all', isSaving && 'opacity-80')}>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name={`${student.first_name} ${student.last_name}`} size="md" />
                    <div>
                      <p className="font-bold text-gray-800">{student.last_name} {student.first_name}</p>
                      <p className="text-xs text-gray-400">{(student.class as { name: string } | null)?.name}</p>
                    </div>
                    {isSaving && <div className="mr-auto w-4 h-4 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin" />}
                  </div>

                  <div className="space-y-3">
                    {/* Morning row */}
                    <div className={clsx('rounded-xl p-3', canMorning ? 'bg-amber-50' : 'bg-gray-50')}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-amber-700">בוקר</span>
                        {a?.morning_grade !== null && a?.morning_grade !== undefined && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">ציון: {a.morning_grade}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[1,2,3,4,5].map(n => (
                          <button
                            key={n}
                            disabled={!canMorning}
                            onClick={() => updateAssessment(student.id, 'morning_rating', a?.morning_rating === n ? null : n)}
                            className={clsx(
                              'w-7 h-7 rounded-lg text-xs font-bold transition-all border',
                              a?.morning_rating === n
                                ? `${RATING_COLORS[n]} text-white border-transparent`
                                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300',
                              !canMorning && 'opacity-40 cursor-not-allowed'
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      {canMorning && (
                        <input
                          type="number"
                          min="0" max="100"
                          placeholder="ציון בוקר..."
                          value={a?.morning_grade ?? ''}
                          onChange={e => updateAssessment(student.id, 'morning_grade', e.target.value ? Number(e.target.value) : null)}
                          className="w-full text-xs border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white placeholder:text-gray-300"
                        />
                      )}
                    </div>

                    {/* Afternoon row */}
                    <div className={clsx('rounded-xl p-3', canAfternoon ? 'bg-blue-50' : 'bg-gray-50')}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-700">צהריים</span>
                        {a?.afternoon_grade !== null && a?.afternoon_grade !== undefined && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">ציון: {a.afternoon_grade}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[1,2,3,4,5].map(n => (
                          <button
                            key={n}
                            disabled={!canAfternoon}
                            onClick={() => updateAssessment(student.id, 'afternoon_rating', a?.afternoon_rating === n ? null : n)}
                            className={clsx(
                              'w-7 h-7 rounded-lg text-xs font-bold transition-all border',
                              a?.afternoon_rating === n
                                ? `${RATING_COLORS[n]} text-white border-transparent`
                                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300',
                              !canAfternoon && 'opacity-40 cursor-not-allowed'
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      {canAfternoon && (
                        <input
                          type="number"
                          min="0" max="100"
                          placeholder="ציון צהריים..."
                          value={a?.afternoon_grade ?? ''}
                          onChange={e => updateAssessment(student.id, 'afternoon_grade', e.target.value ? Number(e.target.value) : null)}
                          className="w-full text-xs border border-blue-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white placeholder:text-gray-300"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
