// ─── Database Types ──────────────────────────────────────────────────────────
// Formato exato compatível com @supabase/supabase-js e @supabase/ssr
// Execute `npx supabase gen types typescript` após conectar ao projeto real

export type UserRole     = 'teacher' | 'student'
export type ModuleType   = 'summary' | 'tasks' | 'speaking'
export type UploadStatus = 'processing' | 'completed' | 'error'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:          string
          role:        'teacher' | 'student'
          full_name:   string | null
          email:       string | null
          avatar_url:  string | null
          created_at:  string
          updated_at:  string
        }
        Insert: {
          id:          string
          role:        'teacher' | 'student'
          full_name?:  string | null
          email?:      string | null
          avatar_url?: string | null
        }
        Update: {
          role?:       'teacher' | 'student'
          full_name?:  string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          id:           string
          title:        string
          description:  string | null
          cover_emoji:  string
          order_index:  number
          is_published: boolean
          created_by:   string | null
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id?:          string        // allow pre-generated UUID for storage path coordination
          title:        string
          description?: string | null
          cover_emoji?: string
          order_index?: number
          is_published?: boolean
          created_by?:  string | null
        }
        Update: {
          title?:        string
          description?:  string | null
          cover_emoji?:  string
          order_index?:  number
          is_published?: boolean
          updated_at?:   string
        }
        Relationships: []
      }
      modules: {
        Row: {
          id:            string
          lesson_id:     string
          type:          'summary' | 'tasks' | 'speaking'
          title:         string
          content_json:  Record<string, unknown> | null
          order_index:   number
          created_at:    string
          updated_at:    string
        }
        Insert: {
          lesson_id:     string
          type:          'summary' | 'tasks' | 'speaking'
          title:         string
          content_json?: Record<string, unknown> | null
          order_index?:  number
        }
        Update: {
          title?:        string
          content_json?: Record<string, unknown> | null
          order_index?:  number
          updated_at?:   string
        }
        Relationships: [
          {
            foreignKeyName: 'modules_lesson_id_fkey'
            columns:        ['lesson_id']
            referencedRelation: 'lessons'
            referencedColumns:  ['id']
          }
        ]
      }
      scores: {
        Row: {
          id:                  string
          student_id:          string
          module_id:           string | null
          lesson_id:           string
          module_type:         'summary' | 'tasks' | 'speaking'
          score:               number
          time_spent_seconds:  number | null
          created_at:          string
        }
        Insert: {
          student_id:          string
          module_id?:          string | null
          lesson_id:           string
          module_type:         'summary' | 'tasks' | 'speaking'
          score:               number
          time_spent_seconds?: number | null
        }
        Update: {
          score?:              number
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'scores_lesson_id_fkey'
            columns:        ['lesson_id']
            referencedRelation: 'lessons'
            referencedColumns:  ['id']
          },
          {
            foreignKeyName: 'scores_student_id_fkey'
            columns:        ['student_id']
            referencedRelation: 'profiles'
            referencedColumns:  ['id']
          }
        ]
      }
      ppt_uploads: {
        Row: {
          id:           string
          filename:     string
          storage_path: string
          lesson_id:    string | null
          status:       'processing' | 'completed' | 'error'
          uploaded_by:  string | null
          created_at:   string
        }
        Insert: {
          filename:     string
          storage_path: string
          lesson_id?:   string | null
          status?:      'processing' | 'completed' | 'error'
          uploaded_by?: string | null
        }
        Update: {
          lesson_id?: string | null
          status?:    'processing' | 'completed' | 'error'
        }
        Relationships: []
      }
    }
    Views: {
      student_performance: {
        Row: {
          student_id:        string
          student_name:      string | null
          lesson_id:         string
          lesson_title:      string
          avg_score:         number
          modules_completed: number
          last_activity:     string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role:     'teacher' | 'student'
      module_type:   'summary' | 'tasks' | 'speaking'
      upload_status: 'processing' | 'completed' | 'error'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
