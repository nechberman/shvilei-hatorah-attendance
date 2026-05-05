import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Attendance from './pages/Attendance'
import WeeklyAssessment from './pages/WeeklyAssessment'
import WeeklyReport from './pages/WeeklyReport'
import MedicalTreatment from './pages/MedicalTreatment'
import Students from './pages/Students'
import StudentProfile from './pages/StudentProfile'
import StaffManagement from './pages/StaffManagement'
import ClassManagement from './pages/ClassManagement'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function LoadingScreen() {
  const [slow, setSlow] = React.useState(false)
  React.useEffect(() => {
    const t = setTimeout(() => setSlow(true), 5000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="flex flex-col items-center gap-4">
        <img src="/logo-icon.png" alt="" className="w-12 h-12 animate-pulse" />
        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        {slow && (
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-500">מתחבר לשרת...</p>
            <p className="text-xs text-gray-400 mt-1">
              אם זה נמשך — בדוק שפרויקט Supabase פעיל
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="weekly-assessment" element={<WeeklyAssessment />} />
        <Route path="weekly-report" element={<WeeklyReport />} />
        <Route path="medical" element={<MedicalTreatment />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="staff" element={<AdminRoute><StaffManagement /></AdminRoute>} />
        <Route path="classes" element={<AdminRoute><ClassManagement /></AdminRoute>} />
      </Route>
    </Routes>
  )
}

export default function App() {
  const base = import.meta.env.BASE_URL

  return (
    <BrowserRouter basename={base}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
