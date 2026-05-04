import { useEffect, useState } from 'react'
import { Pill, Plus, X, Edit2, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Avatar from '../components/ui/Avatar'
import PageHeader from '../components/ui/PageHeader'
import type { Student, MedicalTreatment as MedicalTreatmentType } from '../types'
import { clsx } from 'clsx'

interface StudentWithTreatments extends Student {
  treatments: MedicalTreatmentType[]
}

interface TreatmentForm {
  medication_name: string
  dosage: string
  timing: string
  notes: string
}

export default function MedicalTreatment() {
  const { canSeeAll, myClassIds, staff } = useAuth()
  const [students, setStudents] = useState<StudentWithTreatments[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [addingFor, setAddingFor] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TreatmentForm>({ medication_name: '', dosage: '', timing: '', notes: '' })

  useEffect(() => { loadData() }, [canSeeAll, myClassIds.join(',')])

  async function loadData() {
    setLoading(true)
    try {
      let q = supabase.from('students').select('*, class:classes(id,name)').eq('is_active', true).order('last_name')
      if (!canSeeAll && myClassIds.length > 0) q = q.in('class_id', myClassIds)
      const { data: studentsData } = await q
      if (!studentsData) return

      const { data: treatmentsData } = await supabase
        .from('medical_treatments')
        .select('*')
        .in('student_id', studentsData.map(s => s.id))
        .order('created_at')

      const result: StudentWithTreatments[] = studentsData.map(s => ({
        ...(s as Student),
        treatments: (treatmentsData ?? []).filter(t => t.student_id === s.id) as MedicalTreatmentType[],
      }))

      setStudents(result)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(studentId: string) {
    if (!form.medication_name.trim()) return

    if (editingId) {
      await supabase.from('medical_treatments').update({
        medication_name: form.medication_name,
        dosage: form.dosage || null,
        timing: form.timing || null,
        notes: form.notes || null,
      }).eq('id', editingId)
    } else {
      await supabase.from('medical_treatments').insert({
        student_id: studentId,
        medication_name: form.medication_name,
        dosage: form.dosage || null,
        timing: form.timing || null,
        notes: form.notes || null,
        created_by: staff?.id ?? null,
      })
    }

    setForm({ medication_name: '', dosage: '', timing: '', notes: '' })
    setAddingFor(null)
    setEditingId(null)
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק טיפול זה?')) return
    await supabase.from('medical_treatments').delete().eq('id', id)
    loadData()
  }

  function startEdit(t: MedicalTreatmentType) {
    setEditingId(t.id)
    setAddingFor(t.student_id)
    setForm({
      medication_name: t.medication_name,
      dosage: t.dosage ?? '',
      timing: t.timing ?? '',
      notes: t.notes ?? '',
    })
  }

  const filtered = students.filter(s =>
    search === '' ||
    `${s.last_name} ${s.first_name}`.includes(search) ||
    (s.class as { name: string } | null)?.name?.includes(search)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="טיפול תרופתי" subtitle="ניהול וצפייה בטיפולים התרופתיים של התלמידים" icon={Pill}>
        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="חיפוש לפי שם תלמיד..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-8 pl-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white w-52"
          />
        </div>
      </PageHeader>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(student => (
              <div key={student.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Student header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <Avatar name={`${student.first_name} ${student.last_name}`} size="sm" />
                    <div>
                      <p className="font-bold text-gray-800">{student.last_name} {student.first_name}</p>
                      <p className="text-xs text-gray-400">{(student.class as { name: string } | null)?.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setAddingFor(student.id); setEditingId(null); setForm({ medication_name: '', dosage: '', timing: '', notes: '' }) }}
                    className="flex items-center gap-1.5 text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    <Plus size={13} />
                    הוסף טיפול
                  </button>
                </div>

                {/* Treatments */}
                <div className="px-5 py-3">
                  {student.treatments.length === 0 && addingFor !== student.id && (
                    <div className="flex items-center gap-2 text-gray-300 text-sm py-2">
                      <Pill size={14} />
                      <span>אין טיפולים תרופתיים</span>
                    </div>
                  )}
                  {student.treatments.map(t => (
                    <div key={t.id} className={clsx('flex items-start gap-3 py-2 border-b border-gray-50 last:border-0', editingId === t.id && 'opacity-40')}>
                      <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Pill size={13} className="text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">{t.medication_name}</p>
                        <div className="flex gap-3 mt-0.5">
                          {t.dosage && <span className="text-xs text-gray-500">מינון: {t.dosage}</span>}
                          {t.timing && <span className="text-xs text-gray-500">עיתוי: {t.timing}</span>}
                        </div>
                        {t.notes && <p className="text-xs text-gray-400 mt-0.5">{t.notes}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(t)} className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add/Edit form */}
                  {addingFor === student.id && (
                    <div className="mt-3 bg-orange-50 rounded-xl p-4 border border-orange-100">
                      <p className="text-sm font-semibold text-orange-700 mb-3">{editingId ? 'עריכת טיפול' : 'טיפול חדש'}</p>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input placeholder="שם התרופה *" value={form.medication_name}
                          onChange={e => setForm(f => ({ ...f, medication_name: e.target.value }))}
                          className="col-span-2 px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white" />
                        <input placeholder="מינון (למשל: 50mg)" value={form.dosage}
                          onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))}
                          className="px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white" />
                        <input placeholder="עיתוי (למשל: פעם ביום בבוקר)" value={form.timing}
                          onChange={e => setForm(f => ({ ...f, timing: e.target.value }))}
                          className="px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white" />
                        <input placeholder="הערות..." value={form.notes}
                          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                          className="col-span-2 px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSave(student.id)}
                          className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg font-medium transition-colors">
                          {editingId ? 'שמור' : 'הוסף'}
                        </button>
                        <button onClick={() => { setAddingFor(null); setEditingId(null) }}
                          className="px-4 py-1.5 bg-white text-gray-500 text-sm rounded-lg font-medium transition-colors hover:bg-gray-100">
                          ביטול
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
