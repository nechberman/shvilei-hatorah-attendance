import { useEffect, useState } from 'react'
import { School, Plus, X, Edit2, Check, Users, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/ui/PageHeader'
import Avatar from '../components/ui/Avatar'
import type { Student, StaffMember } from '../types'
import { ROLE_LABELS } from '../types'
import { clsx } from 'clsx'

interface ClassWithDetails {
  id: string
  name: string
  students: Student[]
  morning_staff: StaffMember | null
  afternoon_staff: StaffMember | null
}

export default function ClassManagement() {
  const [classes, setClasses] = useState<ClassWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: cls }, { data: students }, { data: assignments }] = await Promise.all([
      supabase.from('classes').select('*').order('name'),
      supabase.from('students').select('*, class:classes(id,name)').eq('is_active', true).order('last_name'),
      supabase.from('class_assignments').select('*, staff:staff(*), class:classes(*)'),
    ])

    const result: ClassWithDetails[] = (cls ?? []).map(c => {
      const classStudents = (students ?? []).filter(s => s.class_id === c.id) as Student[]
      const morningAssign = (assignments ?? []).find(a => a.class_id === c.id && a.session === 'morning')
      const afternoonAssign = (assignments ?? []).find(a => a.class_id === c.id && a.session === 'afternoon')
      return {
        id: c.id,
        name: c.name,
        students: classStudents,
        morning_staff: morningAssign?.staff as StaffMember | null ?? null,
        afternoon_staff: afternoonAssign?.staff as StaffMember | null ?? null,
      }
    })
    setClasses(result)
    setLoading(false)
  }

  async function handleAddClass() {
    const name = newClassName.trim()
    if (!name) { setAddError('שם הכיתה לא יכול להיות ריק'); return }
    setAddError(null)
    const { error } = await supabase.from('classes').insert({ name })
    if (error) { setAddError(error.message); return }
    setNewClassName('')
    setShowAddForm(false)
    loadData()
  }

  async function handleRenameClass(id: string) {
    const name = editName.trim()
    if (!name) return
    await supabase.from('classes').update({ name }).eq('id', id)
    setEditingId(null)
    loadData()
  }

  async function handleDeleteClass(id: string) {
    const cls = classes.find(c => c.id === id)
    if (cls && cls.students.length > 0) {
      setDeleteConfirm(null)
      return
    }
    await supabase.from('classes').delete().eq('id', id)
    setDeleteConfirm(null)
    loadData()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="ניהול כיתות" subtitle={`${classes.length} כיתות`} icon={School}>
        <button
          onClick={() => { setShowAddForm(true); setAddError(null) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #f97316, #dc2626)' }}
        >
          <Plus size={15} />
          כיתה חדשה
        </button>
      </PageHeader>

      <div className="p-6">
        {/* Add form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-700">כיתה חדשה</h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                autoFocus
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddClass()}
                placeholder="שם הכיתה..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button onClick={handleAddClass}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-xl font-medium transition-colors">
                הוסף
              </button>
            </div>
            {addError && <p className="text-xs text-red-500 mt-2">{addError}</p>}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {classes.map(cls => (
              <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Class header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #f97316, #dc2626)' }}>
                    <School size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingId === cls.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleRenameClass(cls.id) }}
                          className="flex-1 px-2 py-1 text-sm border border-orange-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                        <button onClick={() => handleRenameClass(cls.id)}
                          className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200">
                          <Check size={13} />
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800">{cls.name}</h3>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Users size={10} />
                          {cls.students.length}
                        </span>
                      </div>
                    )}
                  </div>
                  {editingId !== cls.id && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingId(cls.id); setEditName(cls.name) }}
                        className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-500">
                        <Edit2 size={12} />
                      </button>
                      {cls.students.length === 0 && (
                        deleteConfirm === cls.id ? (
                          <button onClick={() => handleDeleteClass(cls.id)}
                            className="px-2 py-1 rounded-lg bg-red-100 text-red-600 text-xs font-medium hover:bg-red-200">
                            אשר מחיקה
                          </button>
                        ) : (
                          <button onClick={() => setDeleteConfirm(cls.id)}
                            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500">
                            <Trash2 size={12} />
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Staff assignments */}
                <div className="px-5 py-3 border-b border-gray-50 space-y-1.5">
                  {[
                    { label: 'בוקר', staff: cls.morning_staff },
                    { label: 'צהריים', staff: cls.afternoon_staff },
                  ].map(({ label, staff }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">{label}</span>
                      {staff ? (
                        <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                          <Avatar name={staff.full_name} size="xs" />
                          {staff.full_name}
                          <span className="text-gray-300">·</span>
                          <span className="text-gray-400">{ROLE_LABELS[staff.role]}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300 italic">לא משויך</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Students list */}
                <button
                  onClick={() => setExpandedId(expandedId === cls.id ? null : cls.id)}
                  className="w-full px-5 py-2.5 text-right text-xs text-orange-500 font-semibold hover:bg-orange-50/50 transition-colors flex items-center justify-between"
                >
                  <span>{expandedId === cls.id ? 'הסתר תלמידים' : 'הצג תלמידים'}</span>
                  <span className="text-gray-400">{cls.students.length} תלמידים</span>
                </button>

                {expandedId === cls.id && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50 max-h-60 overflow-y-auto">
                    {cls.students.length === 0 ? (
                      <p className="text-center py-4 text-xs text-gray-400">אין תלמידים בכיתה</p>
                    ) : (
                      cls.students.map(s => (
                        <div key={s.id} className="flex items-center gap-2.5 px-5 py-2.5">
                          <Avatar name={`${s.first_name} ${s.last_name}`} size="xs" />
                          <span className="text-sm text-gray-700">{s.last_name} {s.first_name}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
