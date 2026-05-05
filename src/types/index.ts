export type UserRole = 'principal' | 'rabbi' | 'vice_principal' | 'counselor' | 'teacher'
export type AttendanceSession = 'prayer' | 'morning' | 'afternoon'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'sick' | 'not_participating'

export interface StaffMember {
  id: string
  full_name: string
  email: string
  secondary_email: string | null
  phone: string | null
  role: UserRole
  is_active: boolean
  assignments?: ClassAssignment[]
}

export interface ClassAssignment {
  id: string
  staff_id: string
  class_id: string
  session: 'morning' | 'afternoon'
  class?: Class
  staff?: StaffMember
}

export interface Class {
  id: string
  name: string
  student_count?: number
  morning_teacher?: StaffMember
  afternoon_teacher?: StaffMember
}

export interface Student {
  id: string
  class_id: string
  class?: Class
  first_name: string
  last_name: string
  father_name: string | null
  id_number: string | null
  birth_date: string | null
  phone: string | null
  father_phone: string | null
  mother_phone: string | null
  city: string | null
  address: string | null
  drive_folder_url: string | null
  dormitory: string | null
  is_active: boolean
  created_at: string
}

export interface AttendanceRecord {
  id: string
  student_id: string
  date: string
  session: AttendanceSession
  status: AttendanceStatus
  marked_by: string | null
  created_at: string
  updated_at: string
}

export interface WeeklyAssessment {
  id: string
  student_id: string
  week_start: string
  morning_rating: number | null
  afternoon_rating: number | null
  morning_grade: number | null
  afternoon_grade: number | null
  notes: string | null
  marked_by: string | null
  student?: Student
}

export interface MedicalTreatment {
  id: string
  student_id: string
  medication_name: string
  dosage: string | null
  timing: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  student?: Student
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'נוכח',
  absent: 'נעדר',
  late: 'איחור',
  sick: 'חולה',
  not_participating: 'לא משתתף',
}

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-green-500 text-white border-green-500',
  absent: 'bg-red-500 text-white border-red-500',
  late: 'bg-amber-500 text-white border-amber-500',
  sick: 'bg-violet-500 text-white border-violet-500',
  not_participating: 'bg-gray-400 text-white border-gray-400',
}

export const SESSION_LABELS: Record<AttendanceSession, string> = {
  prayer: 'תפילה',
  morning: 'בוקר',
  afternoon: 'צהריים',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  principal: 'מנהל',
  rabbi: 'רב',
  vice_principal: 'סגן מנהל',
  counselor: 'יועצת',
  teacher: 'מורה',
}
