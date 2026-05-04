import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowRight, FolderOpen, Phone, MapPin, Calendar, Hash,
  User, Edit2, Save, X, UserCheck, UserX, Clock, Thermometer, Pill
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Avatar from '../components/ui/Avatar'
import DonutChart from '../components/ui/DonutChart'
import type { Student, AttendanceRecord, MedicalTreatment, WeeklyAssessment } from '../types'

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [student, setStudent] = useState<Student | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [medical, setMedical] = useState<MedicalTreatment[]>([])
  const [assessments, setAssessments] = useState<WeeklyAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Student>>({})

  useEffect(() => { if (id) loadData(id) }, [id])

  async function loadData(studentId: string) {
    setLoading(true)
    const [{ data: s }, { data: att }, { data: med }, { data: asmt }] = await Promise.all([
      supabase.from('students').select('*, class:classes(id,name)').eq('id', studentId).single(),
      supabase.from('attendance').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(60),
      supabase.from('medical_treatments').select('*').eq('student_id', studentId),
      supabase.from('weekly_assessments').select('*').eq('student_id', studentId).order('week_start', { ascending: false }).limit(10),
    ])
    if (s) { setStudent(s as Student); setEditForm(s as Student) }
    if (att) setAttendance(att as AttendanceRecord[])
    if (med) setMedical(med as MedicalTreatment[])
    if (asmt) setAssessments(asmt as WeeklyAssessment[])
    setLoading(false)
  }

  async function saveEdit() {
    if (!id || !editForm) return
    await supabase.from('students').update({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      father_name: editForm.father_name,
      id_number: editForm.id_number,
      birth_date: editForm.birth_date,
      phone: editForm.phone,
      father_phone: editForm.father_phone,
      mother_phone: editForm.mother_phone,
      city: editForm.city,
      address: editForm.address,
      drive_folder_url: editForm.drive_folder_url,
    }).eq('id', id)
    setEditing(false)
    loadData(id)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  )

  if (!student) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-400">תלמיד לא נמצא</div>
  )

  const presentCount = attendance.filter(a => a.status === 'present').length
  const absentCount = attendance.filter(a => a.status === 'absent').length
  const lateCount = attendance.filter(a => a.status === 'late').length
  const sickCount = attendance.filter(a => a.status === 'sick').length
  const totalMarked = presentCount + absentCount + lateCount + sickCount
  const attendancePct = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0

  const avgMorning = assessments.filter(a => a.morning_rating).reduce((s, a) => s + (a.morning_rating ?? 0), 0) /
    (assessments.filter(a => a.morning_rating).length || 1)
  const avgAfternoon = assessments.filter(a => a.afternoon_rating).reduce((s, a) => s + (a.afternoon_rating ?? 0), 0) /
    (assessments.filter(a => a.afternoon_rating).length || 1)

  const cls = student.class as { name: string } | null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/students')}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
            <ArrowRight size={18} />
          </button>
          <Avatar name={`${student.first_name} ${student.last_name}`} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">{student.last_name} {student.first_name}</h1>
            <p className="text-sm text-gray-400">{cls?.name}</p>
          </div>
          <div className="mr-auto flex gap-2">
            {student.drive_folder_url && (
              <a href={student.drive_folder_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium transition-colors">
                <FolderOpen size={14} />
                תיק תלמיד
              </a>
            )}
            {isAdmin && !editing && (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-orange-50 hover:bg-orange-100 text-orange-600 font-medium transition-colors">
                <Edit2 size={14} />
                עריכה
              </button>
            )}
            {editing && (
              <>
                <button onClick={saveEdit}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-green-500 hover:bg-green-600 text-white font-medium transition-colors">
                  <Save size={14} />
                  שמור
                </button>
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium transition-colors">
                  <X size={14} />
                  ביטול
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Personal info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><User size={15} />פרטים אישיים</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'שם פרטי', key: 'first_name' as const, icon: User },
              { label: 'שם משפחה', key: 'last_name' as const, icon: User },
              { label: 'שם אבא', key: 'father_name' as const, icon: User },
              { label: 'ת.ז.', key: 'id_number' as const, icon: Hash },
              { label: 'תאריך לידה', key: 'birth_date' as const, icon: Calendar },
            ].map(({ label, key, icon: Icon }) => (
              <div key={key}>
                <label className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Icon size={10} />{label}</label>
                {editing ? (
                  <input
                    type={key === 'birth_date' ? 'date' : 'text'}
                    value={(editForm[key] as string) ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value || null }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-800">{(student[key] as string) || '—'}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Phone size={15} />פרטי קשר</h2>
          <div className="space-y-3">
            {[
              { label: 'טלפון תלמיד', key: 'phone' as const },
              { label: 'טלפון אבא', key: 'father_phone' as const },
              { label: 'טלפון אמא', key: 'mother_phone' as const },
              { label: 'עיר', key: 'city' as const },
              { label: 'כתובת', key: 'address' as const },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
                {editing ? (
                  <input
                    value={(editForm[key] as string) ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value || null }))}
                    className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                ) : (
                  <p className="text-sm text-gray-700">{(student[key] as string) || '—'}</p>
                )}
              </div>
            ))}
            {editing && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-24 shrink-0">קישור Drive</span>
                <input
                  value={editForm.drive_folder_url ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, drive_folder_url: e.target.value || null }))}
                  className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400"
                  dir="ltr"
                  placeholder="https://drive.google.com/..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Attendance stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><UserCheck size={15} />סטטיסטיקת נוכחות</h2>
          <div className="flex items-center gap-6">
            <DonutChart percent={attendancePct} size={100} label="נוכחות" />
            <div className="grid grid-cols-2 gap-2 flex-1">
              {[
                { label: 'נוכח', value: presentCount, icon: UserCheck, color: 'text-green-600 bg-green-50' },
                { label: 'נעדר', value: absentCount, icon: UserX, color: 'text-red-600 bg-red-50' },
                { label: 'איחור', value: lateCount, icon: Clock, color: 'text-amber-600 bg-amber-50' },
                { label: 'חולה', value: sickCount, icon: Thermometer, color: 'text-violet-600 bg-violet-50' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className={`rounded-xl p-2.5 ${color}`}>
                  <p className="text-lg font-bold">{value}</p>
                  <p className="text-xs font-medium opacity-80">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly assessment stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><span>📊</span>תפקוד שבועי</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs text-amber-600 mb-1">ממוצע בוקר</p>
              <p className="text-2xl font-bold text-amber-700">{assessments.filter(a => a.morning_rating).length > 0 ? avgMorning.toFixed(1) : '—'}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-blue-600 mb-1">ממוצע צהריים</p>
              <p className="text-2xl font-bold text-blue-700">{assessments.filter(a => a.afternoon_rating).length > 0 ? avgAfternoon.toFixed(1) : '—'}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">{assessments.length} שבועות מתועדים</p>
        </div>

        {/* Medical treatments */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
          <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Pill size={15} />טיפול תרופתי</h2>
          {medical.length === 0 ? (
            <p className="text-gray-400 text-sm">לא נרשם טיפול תרופתי</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {medical.map(m => (
                <div key={m.id} className="flex items-start gap-3 bg-violet-50 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                    <Pill size={14} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{m.medication_name}</p>
                    {m.dosage && <p className="text-xs text-gray-500">מינון: {m.dosage}</p>}
                    {m.timing && <p className="text-xs text-gray-500">עיתוי: {m.timing}</p>}
                    {m.notes && <p className="text-xs text-gray-400 mt-0.5">{m.notes}</p>}
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
