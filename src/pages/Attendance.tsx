import { useEffect, useState, useCallback } from 'react'
import { ChevronRight, ChevronLeft, CalendarCheck, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import AttendanceButton from '../components/ui/AttendanceButton'
import Avatar from '../components/ui/Avatar'
import PageHeader from '../components/ui/PageHeader'
import type { Student, AttendanceRecord, AttendanceStatus, AttendanceSession } from '../types'
import { SESSION_LABELS } from '../types'

type AttendanceMap = Record<string, Record<AttendanceSession, AttendanceStatus | null>>
type SavingMap = Record<string, Record<AttendanceSession, boolean>>

const SESSIONS: AttendanceSession[] = ['prayer', 'morning', 'afternoon']

export default function Attendance() {
  const { canSeeAll, myClassIds, myMorningClassIds, myAfternoonClassIds, staff } = useAuth()
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [attendance, setAttendance] = useState<AttendanceMap>({})
  const [saving, setSaving] = useState<SavingMap>({})
  const [loading, setLoading] = useState(true)

  const canMarkSession = useCallback((session: AttendanceSession, classId: string): boolean => {
    if (canSeeAll) return true
    if (session === 'morning' || session === 'prayer') return myMorningClassIds.includes(classId)
    if (session === 'afternoon') return myAfternoonClassIds.includes(classId)
    return false
  }, [canSeeAll, myMorningClassIds, myAfternoonClassIds])

  useEffect(() => {
    loadClasses()
  }, [])

  useEffect(() => {
    loadStudentsAndAttendance()
  }, [date, selectedClass, canSeeAll, myClassIds.join(',')])

  async function loadClasses() {
    let q = supabase.from('classes').select('id, name').order('name')
    const { data } = await q
    if (data) setClasses(data)
  }

  async function loadStudentsAndAttendance() {
    setLoading(true)
    try {
      let q = supabase
        .from('students')
        .select('*, class:classes(id, name)')
        .eq('is_active', true)
        .order('last_name')

      if (!canSeeAll && myClassIds.length > 0) q = q.in('class_id', myClassIds)
      if (selectedClass !== 'all') q = q.eq('class_id', selectedClass)

      const { data: studentsData } = await q
      if (!studentsData) return

      setStudents(studentsData as Student[])

      const studentIds = studentsData.map(s => s.id)
      const { data: attData } = await supabase
        .from('attendance')
        .select('*')
        .in('student_id', studentIds)
        .eq('date', date)

      const map: AttendanceMap = {}
      for (const s of studentsData) {
        map[s.id] = { prayer: null, morning: null, afternoon: null }
      }
      for (const a of (attData ?? []) as AttendanceRecord[]) {
        if (map[a.student_id]) map[a.student_id][a.session] = a.status
      }
      setAttendance(map)
    } finally {
      setLoading(false)
    }
  }

  async function handleAttendance(studentId: string, session: AttendanceSession, status: AttendanceStatus) {
    // Optimistic update
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [session]: status }
    }))
    setSaving(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [session]: true }
    }))

    const { error } = await supabase
      .from('attendance')
      .upsert({
        student_id: studentId,
        date,
        session,
        status,
        marked_by: staff?.id ?? null,
      }, { onConflict: 'student_id,date,session' })

    setSaving(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [session]: false }
    }))

    if (error) {
      // Revert on error
      setAttendance(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], [session]: null }
      }))
    }
  }

  function changeDate(delta: number) {
    const d = new Date(date)
    d.setDate(d.getDate() + delta)
    setDate(d.toISOString().split('T')[0])
  }

  const dateLabel = new Intl.DateTimeFormat('he-IL', { dateStyle: 'full' }).format(new Date(date + 'T12:00:00'))
  const hebrewDate = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { dateStyle: 'long' }).format(new Date(date + 'T12:00:00'))

  const presentCount = Object.values(attendance).filter(a =>
    Object.values(a).some(s => s === 'present')
  ).length

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="נוכחות יומית"
        subtitle="סמן את נוכחות התלמידים"
        icon={CalendarCheck}
      >
        {/* Class filter */}
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          >
            <option value="all">כל הכיתות</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </PageHeader>

      <div className="p-6">
        {/* Date selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <button onClick={() => changeDate(-1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
              <ChevronRight size={18} />
            </button>
            <div className="text-center">
              <p className="font-bold text-gray-800">{hebrewDate}</p>
              <p className="text-sm text-gray-400">{dateLabel}</p>
            </div>
            <button onClick={() => changeDate(1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'סה״כ תלמידים', value: students.length, color: 'bg-blue-50 text-blue-600' },
            { label: 'תפילה', value: Object.values(attendance).filter(a => a.prayer === 'present').length, color: 'bg-purple-50 text-purple-600' },
            { label: 'בוקר', value: Object.values(attendance).filter(a => a.morning === 'present').length, color: 'bg-amber-50 text-amber-600' },
            { label: 'צהריים', value: Object.values(attendance).filter(a => a.afternoon === 'present').length, color: 'bg-orange-50 text-orange-600' },
          ].map(item => (
            <div key={item.label} className={`rounded-xl p-3 ${item.color} text-center`}>
              <p className="text-xl font-bold">{item.value}</p>
              <p className="text-xs font-medium opacity-80 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Student list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto] items-center px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-gray-500 w-48">שם התלמיד</span>
              <div className="flex gap-2">
                {SESSIONS.map(s => (
                  <span key={s} className="text-xs font-semibold text-gray-500 w-[90px] text-center">{SESSION_LABELS[s]}</span>
                ))}
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              {presentCount} נוכחים מתוך {students.length}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CalendarCheck size={40} className="mx-auto mb-3 opacity-30" />
              <p>אין תלמידים להצגה</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {students.map(student => (
                <div key={student.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                  <Avatar name={`${student.first_name} ${student.last_name}`} size="sm" />
                  <div className="w-40 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {student.last_name} {student.first_name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{(student.class as { name: string } | null)?.name}</p>
                  </div>
                  <div className="flex gap-2">
                    {SESSIONS.map(session => (
                      <AttendanceButton
                        key={session}
                        status={attendance[student.id]?.[session] ?? null}
                        saving={saving[student.id]?.[session]}
                        disabled={!canMarkSession(session, student.class_id)}
                        onSelect={status => handleAttendance(student.id, session, status)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
