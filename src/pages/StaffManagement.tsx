import { useEffect, useState } from 'react'
import { UserCog, Plus, X, Edit2, Check, Wifi, WifiOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Avatar from '../components/ui/Avatar'
import PageHeader from '../components/ui/PageHeader'
import type { StaffMember, Class, UserRole } from '../types'
import { ROLE_LABELS } from '../types'
import { clsx } from 'clsx'

const ROLES: UserRole[] = ['principal', 'vice_principal', 'counselor', 'teacher']

const ROLE_COLORS: Record<UserRole, string> = {
  principal: 'bg-orange-100 text-orange-700',
  vice_principal: 'bg-blue-100 text-blue-700',
  counselor: 'bg-purple-100 text-purple-700',
  teacher: 'bg-green-100 text-green-700',
}

export default function StaffManagement() {
  const { refreshStaff } = useAuth()
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [newForm, setNewForm] = useState({ full_name: '', email: '', phone: '', role: 'teacher' as UserRole })
  const [editForm, setEditForm] = useState<Partial<StaffMember>>({})
  const [newAssignment, setNewAssignment] = useState({ class_id: '', session: 'morning' as 'morning' | 'afternoon' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: staff }, { data: cls }] = await Promise.all([
      supabase.from('staff').select(`*, assignments:class_assignments(*, class:classes(*))`).order('full_name'),
      supabase.from('classes').select('*').order('name'),
    ])
    if (staff) setStaffList(staff as StaffMember[])
    if (cls) setClasses(cls as Class[])
    setLoading(false)
  }

  async function handleAddStaff() {
    if (!newForm.full_name || !newForm.email) return

    // Create auth user via invite (admin only action — would normally use service role)
    // For now insert directly (assumes auth user exists with same id, or admin creates manually)
    const tempId = crypto.randomUUID()
    await supabase.from('staff').insert({
      id: tempId,
      full_name: newForm.full_name,
      email: newForm.email,
      phone: newForm.phone || null,
      role: newForm.role,
      is_active: true,
    })
    setNewForm({ full_name: '', email: '', phone: '', role: 'teacher' })
    setShowAddForm(false)
    loadData()
    refreshStaff()
  }

  async function handleSaveEdit(id: string) {
    await supabase.from('staff').update({
      full_name: editForm.full_name,
      email: editForm.email,
      phone: editForm.phone,
      role: editForm.role,
    }).eq('id', id)
    setEditingId(null)
    loadData()
  }

  async function toggleActive(s: StaffMember) {
    await supabase.from('staff').update({ is_active: !s.is_active }).eq('id', s.id)
    loadData()
  }

  async function addAssignment(staffId: string) {
    if (!newAssignment.class_id) return
    await supabase.from('class_assignments').upsert({
      staff_id: staffId,
      class_id: newAssignment.class_id,
      session: newAssignment.session,
    }, { onConflict: 'class_id,session' })
    setAssigningId(null)
    setNewAssignment({ class_id: '', session: 'morning' })
    loadData()
    refreshStaff()
  }

  async function removeAssignment(id: string) {
    await supabase.from('class_assignments').delete().eq('id', id)
    loadData()
    refreshStaff()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="ניהול צוות" subtitle={`${staffList.length} אנשי צוות`} icon={UserCog}>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #f97316, #dc2626)' }}
        >
          <Plus size={15} />
          הוסף איש צוות
        </button>
      </PageHeader>

      <div className="p-6">
        {/* Add form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-5 mb-5 fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700">איש צוות חדש</h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input placeholder="שם מלא *" value={newForm.full_name}
                onChange={e => setNewForm(f => ({ ...f, full_name: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <input placeholder="אימייל *" value={newForm.email} dir="ltr"
                onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <input placeholder="טלפון" value={newForm.phone}
                onChange={e => setNewForm(f => ({ ...f, phone: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <select value={newForm.role} onChange={e => setNewForm(f => ({ ...f, role: e.target.value as UserRole }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddStaff}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-xl font-medium transition-colors">
                הוסף
              </button>
              <button onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-xl font-medium transition-colors">
                ביטול
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {staffList.map(s => (
              <div key={s.id} className={clsx('bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden', !s.is_active && 'opacity-60')}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <Avatar name={s.full_name} />
                  <div className="flex-1 min-w-0">
                    {editingId === s.id ? (
                      <div className="grid grid-cols-3 gap-2">
                        <input value={editForm.full_name ?? ''} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                          className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400" />
                        <input value={editForm.email ?? ''} dir="ltr" onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                          className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400" />
                        <select value={editForm.role ?? 'teacher'} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as UserRole }))}
                          className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white">
                          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-800">{s.full_name}</p>
                          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[s.role])}>
                            {ROLE_LABELS[s.role]}
                          </span>
                          {!s.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">לא פעיל</span>}
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5" dir="ltr">{s.email}</p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {editingId === s.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(s.id)} className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 flex items-center justify-center text-green-600">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(s.id); setEditForm(s) }}
                          className="w-8 h-8 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-500">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => toggleActive(s)}
                          className={clsx('w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                            s.is_active ? 'hover:bg-red-50 text-gray-400 hover:text-red-500' : 'hover:bg-green-50 text-gray-400 hover:text-green-500')}>
                          {s.is_active ? <WifiOff size={13} /> : <Wifi size={13} />}
                        </button>
                        <button onClick={() => setAssigningId(assigningId === s.id ? null : s.id)}
                          className="px-3 py-1 rounded-lg text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 font-medium">
                          שיוך כיתה
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Assignments */}
                {(s.assignments?.length ?? 0) > 0 && (
                  <div className="px-5 pb-3 flex flex-wrap gap-2">
                    {s.assignments?.map(a => (
                      <span key={a.id} className={clsx(
                        'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium',
                        a.session === 'morning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      )}>
                        {(a.class as { name: string } | undefined)?.name} · {a.session === 'morning' ? 'בוקר' : 'צהריים'}
                        <button onClick={() => removeAssignment(a.id)} className="hover:opacity-70">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Assignment form */}
                {assigningId === s.id && (
                  <div className="px-5 pb-4 flex items-center gap-2 bg-orange-50/50 border-t border-orange-100">
                    <select value={newAssignment.class_id} onChange={e => setNewAssignment(a => ({ ...a, class_id: e.target.value }))}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-orange-400 flex-1">
                      <option value="">בחר כיתה...</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={newAssignment.session} onChange={e => setNewAssignment(a => ({ ...a, session: e.target.value as 'morning' | 'afternoon' }))}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-orange-400">
                      <option value="morning">בוקר</option>
                      <option value="afternoon">צהריים</option>
                    </select>
                    <button onClick={() => addAssignment(s.id)}
                      className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg font-medium hover:bg-orange-600">
                      שייך
                    </button>
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
