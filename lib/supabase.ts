import { createClient } from '@supabase/supabase-js'

// Essas variáveis devem ser adicionadas ao arquivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string
          protocol: string
          type: string
          category: string
          name: string
          email: string
          student_name: string
          student_grade: string
          is_student: boolean
          message: string
          status: string
          created_at: string
          updated_at: string
          internal_comments: string | null
        }
        Insert: {
          id?: string
          protocol: string
          type: string
          category: string
          name: string
          email: string
          student_name: string
          student_grade: string
          is_student: boolean
          message: string
          status?: string
          created_at?: string
          updated_at?: string
          internal_comments?: string | null
        }
        Update: {
          id?: string
          protocol?: string
          type?: string
          category?: string
          name?: string
          email?: string
          student_name?: string
          student_grade?: string
          is_student?: boolean
          message?: string
          status?: string
          created_at?: string
          updated_at?: string
          internal_comments?: string | null
        }
      }
    }
  }
} 