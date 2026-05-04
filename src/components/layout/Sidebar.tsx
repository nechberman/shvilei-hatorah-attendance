import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarCheck, BarChart3, FileText,
  Pill, Users, UserCog, LogOut, ChevronLeft,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { ROLE_LABELS } from '../../types'

const navItems = [
  { to: '/', label: 'דשבורד', icon: LayoutDashboard, exact: true },
  { to: '/attendance', label: 'נוכחות', icon: CalendarCheck },
  { to: '/weekly-assessment', label: 'תפקוד שבועי', icon: BarChart3 },
  { to: '/weekly-report', label: 'דיווח שבועי', icon: FileText, adminOnly: false, canSeeAllOnly: true },
  { to: '/medical', label: 'טיפול תרופתי', icon: Pill },
  { to: '/students', label: 'רשימת תלמידים', icon: Users },
  { to: '/staff', label: 'ניהול צוות', icon: UserCog, adminOnly: true },
]

export default function Sidebar() {
  const { staff, isAdmin, canSeeAll, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const initials = staff?.full_name
    ? staff.full_name.split(' ').map(w => w[0]).slice(0, 2).join('')
    : 'NB'

  return (
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

      {/* User info + sign out */}
      <div className="p-3 border-t border-white/8">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1.5 rounded-xl hover:bg-white/4 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white/90 text-xs font-semibold truncate">{staff?.full_name ?? 'משתמש'}</p>
            <p className="text-white/35 text-xs">{staff ? ROLE_LABELS[staff.role] : ''}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 text-sm transition-all"
        >
          <LogOut size={15} />
          <span>יציאה</span>
        </button>
      </div>
    </aside>
  )
}
