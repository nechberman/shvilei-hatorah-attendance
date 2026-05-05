import { useEffect, useState } from 'react'
import { Users, Plus, Search, FolderOpen, Phone, MapPin, Filter, X, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useHebrewDate } from '../hooks/useHebrewDate'
import Avatar from '../components/ui/Avatar'
import PageHeader from '../components/ui/PageHeader'
import type { Student } from '../types'

const EMPTY_FORM = {
  first_name: '', last_name: '', father_name: '',
  id_number: '', birth_date: '',
  class_id: '',
  phone: '', father_phone: '', mother_phone: '',
  city: '', address: '', dormitory: '',
}

function AddStudentModal({ classes, onClose, onSaved }: {
  classes: { id: string; name: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hebrewBirthDate = useHebrewDate(form.birth_date)

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name || !form.last_name || !form.class_id) {
      setError('שם פרטי, שם משפחה וכיתה הם שדות חובה')
      return
    }
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('students').insert({
      first_name: form.first_name,
      last_name: form.last_name,
      father_name: form.father_name || null,
      id_number: form.id_number || null,
      birth_date: form.birth_date || null,
      class_id: form.class_id,
      phone: form.phone || null,
      father_phone: form.father_phone || null,
      mother_phone: form.mother_phone || null,
      city: form.city || null,
      address: form.address || null,
      dormitory: form.dormitory || null,
      is_active: true,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">הוספת תלמיד חדש</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">שם פרטי *</label>
              <input value={form.first_name} onChange={set('first_name')} required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                placeholder="שם פרטי" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">שם משפחה *</label>
              <input value={form.last_name} onChange={set('last_name')} required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                placeholder="שם משפחה" />
            </div>
          </div>

          {/* Father name */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">שם האבא</label>
            <input value={form.father_name} onChange={set('father_name')}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              placeholder="שם האבא" />
          </div>

          {/* ID + Class */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">תעודת זהות</label>
              <input value={form.id_number} onChange={set('id_number')}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                placeholder="000000000" dir="ltr" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">כיתה *</label>
              <div className="relative">
                <select value={form.class_id} onChange={set('class_id')} required
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 appearance-none">
                  <option value="">בחר כיתה</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Birth dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">תאריך לידה לועזי</label>
              <input type="date" value={form.birth_date} onChange={set('birth_date')}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">תאריך לידה עברי</label>
              <div className="px-3 py-2.5 text-sm border border-gray-100 rounded-xl bg-amber-50/60 text-amber-700 font-medium min-h-[42px] flex items-center">
                {hebrewBirthDate || (form.birth_date ? '...' : <span className="text-gray-300 font-normal">יחושב אוטומטית</span>)}
              </div>
            </div>
          </div>

          {/* Phones */}
          <div className="grid grid-cols-3 gap-3">
            {([
              ['טלפון תלמיד', 'phone'],
              ['טלפון אבא', 'father_phone'],
              ['טלפון אמא', 'mother_phone'],
            ] as const).map(([label, key]) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
                <input value={form[key]} onChange={set(key)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                  placeholder="050-0000000" dir="ltr" />
              </div>
            ))}
          </div>

          {/* Address row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">עיר</label>
              <input value={form.city} onChange={set('city')}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                placeholder="עיר" />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">כתובת</label>
              <input value={form.address} onChange={set('address')}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                placeholder="רחוב ומספר" />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">פנימייה</label>
              <input value={form.dormitory} onChange={set('dormitory')}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                placeholder="שם הפנימייה" />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #1e40af, #1d4ed8)' }}>
            {saving ? 'שומר...' : 'הוסף תלמיד'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Students() {
  const { canSeeAll, myClassIds, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => { loadClasses() }, [])
  useEffect(() => { loadStudents() }, [canSeeAll, myClassIds.join(','), classFilter])

  async function loadClasses() {
    const { data } = await supabase.from('classes').select('id, name').order('name')
    if (data) setClasses(data)
  }

  async function loadStudents() {
    setLoading(true)
    try {
      let q = supabase.from('students').select('*, class:classes(id,name)').eq('is_active', true).order('last_name')
      if (!canSeeAll && myClassIds.length > 0) q = q.in('class_id', myClassIds)
      if (classFilter !== 'all') q = q.eq('class_id', classFilter)
      const { data } = await q
      if (data) setStudents(data as Student[])
    } finally {
      setLoading(false)
    }
  }

  const filtered = students.filter(s =>
    search === '' ||
    `${s.first_name} ${s.last_name}`.includes(search) ||
    s.id_number?.includes(search) ||
    s.father_phone?.includes(search) ||
    s.phone?.includes(search)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {showAddModal && (
        <AddStudentModal
          classes={classes}
          onClose={() => setShowAddModal(false)}
          onSaved={loadStudents}
        />
      )}

      <PageHeader title="רשימת תלמידים" subtitle={`${students.length} תלמידים במאגר`} icon={Users}>
        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="חיפוש לפי שם, ת.ז. או טלפון..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-8 pl-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white w-60"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
            <option value="all">כל הכיתות</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #f97316, #dc2626)' }}
          >
            <Plus size={15} />
            הוסף תלמיד
          </button>
        )}
      </PageHeader>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p>לא נמצאו תלמידים</p>
                </div>
              )}
              {filtered.map(student => (
                <div
                  key={student.id}
                  onClick={() => navigate(`/students/${student.id}`)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-orange-50/30 cursor-pointer transition-colors group"
                >
                  <Avatar name={`${student.first_name} ${student.last_name}`} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                        {student.last_name} {student.first_name}
                      </p>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {(student.class as { name: string } | null)?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      {student.id_number && (
                        <span className="text-xs text-gray-400">ת.ז: {student.id_number}</span>
                      )}
                      {student.father_phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone size={10} />
                          {student.father_phone}
                        </span>
                      )}
                      {student.city && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin size={10} />
                          {student.city}
                        </span>
                      )}
                    </div>
                  </div>
                  {student.drive_folder_url && (
                    <a
                      href={student.drive_folder_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="w-8 h-8 rounded-lg hover:bg-blue-100 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
                      title="פתח תיק תלמיד"
                    >
                      <FolderOpen size={15} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
