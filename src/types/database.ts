export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      staff: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          role: 'principal' | 'vice_principal' | 'counselor' | 'teacher'
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['staff']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['staff']['Insert']>
      }
      classes: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['classes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['classes']['Insert']>
      }
      class_assignments: {
        Row: {
          id: string
          staff_id: string
          class_id: string
          session: 'morning' | 'afternoon'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['class_assignments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['class_assignments']['Insert']>
      }
      students: {
        Row: {
          id: string
          class_id: string
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
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['students']['Insert']>
      }
      attendance: {
        Row: {
          id: string
          student_id: string
          date: string
          session: 'prayer' | 'morning' | 'afternoon'
          status: 'present' | 'absent' | 'late' | 'sick' | 'not_participating'
          marked_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['attendance']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['attendance']['Insert']>
      }
      weekly_assessments: {
        Row: {
          id: string
          student_id: string
          week_start: string
          morning_rating: number | null
          afternoon_rating: number | null
          morning_grade: number | null
          afternoon_grade: number | null
          notes: string | null
          marked_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['weekly_assessments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['weekly_assessments']['Insert']>
      }
      medical_treatments: {
        Row: {
          id: string
          student_id: string
          medication_name: string
          dosage: string | null
          timing: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['medical_treatments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['medical_treatments']['Insert']>
      }
    }
  }
}
