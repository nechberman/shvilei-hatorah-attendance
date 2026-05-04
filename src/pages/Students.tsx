import { useEffect, useState } from 'react'
import { Users, Plus, Search, FolderOpen, Phone, MapPin, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Avatar from '../components/ui/Avatar'
import PageHeader from '../components/ui/PageHeader'
import type { Student } from '../types'

export default function Students() {
  const { canSeeAll, myClassIds, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')

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
            onClick={() => navigate('/students/new')}
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
