import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError('פרטי הכניסה שגויים. אנא נסה שנית.')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left gradient panel */}
      <div
        className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0c1827 0%, #1a2e44 60%, #0c1827 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute top-[-80px] left-[-80px] w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />
        <div className="absolute bottom-[-40px] right-[-40px] w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #dc2626, transparent)' }} />

        <img src="/logo.png" alt="ישיבת שבילי התורה" className="w-72 object-contain mb-10 drop-shadow-2xl" />

        <div className="text-center text-white/70 space-y-2">
          <p className="text-lg font-medium text-white">מערכת ניהול נוכחות</p>
          <p className="text-sm">מעקב יומי · תפקוד שבועי · רשימת תלמידים</p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/logo.png" alt="ישיבת שבילי התורה" className="h-20 object-contain" />
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800">ברוך הבא</h1>
              <p className="text-gray-400 mt-1 text-sm">היכנס עם פרטי הגישה שלך</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">אימייל</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="example@gmail.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50 placeholder:text-gray-300 transition-all"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">סיסמה</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50 placeholder:text-gray-300 transition-all pl-10"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: loading ? '#f9a56b' : 'linear-gradient(135deg, #f97316, #dc2626)' }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'מתחבר...' : 'כניסה למערכת'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            ישיבת שבילי התורה · מרשת מוסדות שתילים
          </p>
        </div>
      </div>
    </div>
  )
}
