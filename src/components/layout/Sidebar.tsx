import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CalendarCheck, BarChart3, FileText,
  Pill, Users, UserCog, LogOut, ChevronLeft, School,
  KeyRound, X, Eye, EyeOff, Check,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { ROLE_LABELS } from '../../types'

const navItems = [
  { to: '/', label: 'דשבורד', icon: LayoutDashboard, exact: true },
  { to: '/attendance', label: 'נוכחות', icon: CalendarCheck },
  { to: '/weekly-assessment', label: 'תפקוד שבועי', icon: BarChart3 },
  { to: '/weekly-report', label: 'דיווח שבועי', icon: FileText, canSeeAllOnly: true },
  { to: '/medical', label: 'טיפול תרופתי', icon: Pill },
  { to: '/students', label: 'רשימת תלמידים', icon: Users },
  { to: '/classes', label: 'ניהול כיתות', icon: School, adminOnly: true },
  { to: '/staff', label: 'ניהול צוות', icon: UserCog, adminOnly: true },
]

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('הסיסמה חייבת להכיל לפחות 6 תווים'); return }
    if (password !== confirm) { setError('הסיסמאות אינן תואמות'); return }
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">שינוי סיסמה</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X size={14} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-2 py-4 text-green-600">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check size={20} />
            </div>
            <p className="font-semibold text-sm">הסיסמה שונתה בהצלחה</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">סיסמה חדשה</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="לפחות 6 תווים"
                  dir="ltr"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 pl-9"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">אישור סיסמה</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="הזן שוב את הסיסמה"
                dir="ltr"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              />
            </div>
            {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-all"
              style={{ background: 'linear-gradient(135deg, #f97316, #dc2626)' }}>
              {loading ? 'שומר...' : 'שמור סיסמה'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { staff, isAdmin, canSeeAll, signOut } = useAuth()
  const [showChangePw, setShowChangePw] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    // Let ProtectedRoute handle the redirect via auth state change
  }

  const initials = staff?.full_name
    ? staff.full_name.split(' ').map(w => w[0]).slice(0, 2).join('')
    : 'NB'

  return (
    <>
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}

      <aside
        className="fixed top-0 right-0 h-full w-56 flex flex-col z-50 border-l border-white/5"
        style={{ background: 'linear-gradient(180deg, #0d1f35 0%, #0a1628 100%)' }}
      >
        {/* Logo */}
        <div className="px-4 pt-5 pb-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400/20 to-red-500/20 border border-orange-500/20 flex items-center justify-center shrink-0">
              <img src="/logo-icon.png" alt="לוגו" className="w-6 h-6 object-contain" />
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-white font-bold text-sm truncate">ישיבת שבילי התורה</p>
              <p className="text-white/40 text-xs">מערכת נוכחות</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(item => {
            if (item.adminOnly && !isAdmin) return null
            if (item.canSeeAllOnly && !canSeeAll) return null
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-gradient-to-l from-orange-500/25 to-orange-500/10 text-orange-300 border border-orange-500/25 shadow-sm'
                      : 'text-white/55 hover:text-white/90 hover:bg-white/6'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={17} className={isActive ? 'text-orange-400' : 'text-white/40 group-hover:text-white/70'} />
                    <span>{item.label}</span>
                    {isActive && <ChevronLeft size={13} className="mr-auto text-orange-400/70" />}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User info + actions */}
        <div className="p-3 border-t border-white/8">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white/90 text-xs font-semibold truncate">{staff?.full_name ?? 'משתמש'}</p>
              <p className="text-white/35 text-xs">{staff ? ROLE_LABELS[staff.role] : ''}</p>
            </div>
          </div>

          <button
            onClick={() => setShowChangePw(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/40 hover:text-amber-400 hover:bg-amber-500/10 text-sm transition-all mb-0.5"
          >
            <KeyRound size={15} />
            <span>שינוי סיסמה</span>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 text-sm transition-all"
          >
            <LogOut size={15} />
            <span>יציאה</span>
          </button>
        </div>
      </aside>
    </>
  )
}
