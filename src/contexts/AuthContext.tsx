import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { StaffMember, ClassAssignment } from '../types'

interface AuthContextType {
  user: User | null
  staff: StaffMember | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
  canEdit: boolean
  canSeeAll: boolean
  myClassIds: string[]
  myMorningClassIds: string[]
  myAfternoonClassIds: string[]
  refreshStaff: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchStaff(userId: string) {
    const { data, error } = await supabase
      .from('staff')
      .select(`
        *,
        assignments:class_assignments(
          *,
          class:classes(*)
        )
      `)
      .eq('id', userId)
      .single()

    if (error || !data) return null
    return data as StaffMember & { assignments: ClassAssignment[] }
  }

  async function refreshStaff() {
    if (!user) return
    const staffData = await fetchStaff(user.id)
    setStaff(staffData)
  }

  useEffect(() => {
    // Timeout fallback — if Supabase doesn't respond in 8s, stop loading
    const timeout = setTimeout(() => setLoading(false), 8000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout)
      setUser(session?.user ?? null)
      if (session?.user) {
        const staffData = await fetchStaff(session.user.id)
        setStaff(staffData)
      }
      setLoading(false)
    }).catch(() => {
      clearTimeout(timeout)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const staffData = await fetchStaff(session.user.id)
        setStaff(staffData)
      } else {
        setStaff(null)
      }
      setLoading(false)
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isAdmin = staff?.role === 'principal'
  const canEdit = ['principal', 'rabbi'].includes(staff?.role ?? '')
  const canSeeAll = ['principal', 'rabbi', 'vice_principal', 'counselor'].includes(staff?.role ?? '')

  const myMorningClassIds = staff?.assignments
    ?.filter(a => a.session === 'morning')
    .map(a => a.class_id) ?? []

  const myAfternoonClassIds = staff?.assignments
    ?.filter(a => a.session === 'afternoon')
    .map(a => a.class_id) ?? []

  const myClassIds = [...new Set([...myMorningClassIds, ...myAfternoonClassIds])]

  return (
    <AuthContext.Provider value={{
      user, staff, loading, signIn, signOut,
      isAdmin, canEdit, canSeeAll,
      myClassIds, myMorningClassIds, myAfternoonClassIds,
      refreshStaff,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
