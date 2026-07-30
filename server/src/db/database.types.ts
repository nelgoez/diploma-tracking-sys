export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_valid: boolean
          issue_date: string
          moodle_certificate_id: string | null
          qualification: number | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_valid?: boolean
          issue_date?: string
          moodle_certificate_id?: string | null
          qualification?: number | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_valid?: boolean
          issue_date?: string
          moodle_certificate_id?: string | null
          qualification?: number | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          code: string
          created_at: string
          credits: number
          id: string
          is_active: boolean
          is_integrator_exam: boolean
          moodle_course_id: string | null
          name: string
          order_index: number
          track_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          is_integrator_exam?: boolean
          moodle_course_id?: string | null
          name: string
          order_index?: number
          track_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          is_integrator_exam?: boolean
          moodle_course_id?: string | null
          name?: string
          order_index?: number
          track_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      diploma_files: {
        Row: {
          created_at: string | null
          enrollment_id: string
          error_message: string | null
          file_path: string | null
          generated_at: string | null
          id: string
          reference_code: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enrollment_id: string
          error_message?: string | null
          file_path?: string | null
          generated_at?: string | null
          id?: string
          reference_code?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enrollment_id?: string
          error_message?: string | null
          file_path?: string | null
          generated_at?: string | null
          id?: string
          reference_code?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completion_date: string | null
          course_id: string | null
          created_at: string
          enrollment_date: string | null
          exam_date: string | null
          exam_status: string | null
          id: string
          observations: string | null
          qualification: number | null
          status: string
          student_id: string
          track_id: string
          updated_at: string
        }
        Insert: {
          completion_date?: string | null
          course_id?: string | null
          created_at?: string
          enrollment_date?: string | null
          exam_date?: string | null
          exam_status?: string | null
          id?: string
          observations?: string | null
          qualification?: number | null
          status?: string
          student_id: string
          track_id: string
          updated_at?: string
        }
        Update: {
          completion_date?: string | null
          course_id?: string | null
          created_at?: string
          enrollment_date?: string | null
          exam_date?: string | null
          exam_status?: string | null
          id?: string
          observations?: string | null
          qualification?: number | null
          status?: string
          student_id?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_logs: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          integration_type: string
          message: string | null
          operation: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          integration_type: string
          message?: string | null
          operation: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          integration_type?: string
          message?: string | null
          operation?: string
          status?: string
        }
        Relationships: []
      }
      manual_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          reason: string
          revoked_at: string | null
          rule_id: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          reason: string
          revoked_at?: string | null
          rule_id?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          reason?: string
          revoked_at?: string | null
          rule_id?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          id: string
          read: boolean
          student_id: string
          title: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          read?: boolean
          student_id: string
          title: string
          type: string
        }
        Update: {
          body?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          read?: boolean
          student_id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      prerequisite_rules: {
        Row: {
          condition: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          order_index: number
          parent_rule_id: string | null
          target_course_id: string
          updated_at: string
        }
        Insert: {
          condition?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          parent_rule_id?: string | null
          target_course_id: string
          updated_at?: string
        }
        Update: {
          condition?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          parent_rule_id?: string | null
          target_course_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      prerequisite_sources: {
        Row: {
          rule_id: string
          source_course_id: string
        }
        Insert: {
          rule_id: string
          source_course_id: string
        }
        Update: {
          rule_id?: string
          source_course_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          dni: string | null
          email: string
          guarani_id: string | null
          id: string
          is_active: boolean
          is_demo: boolean
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dni?: string | null
          email: string
          guarani_id?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dni?: string | null
          email?: string
          guarani_id?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      track_coordinators: {
        Row: {
          created_at: string | null
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: []
      }
      tracks: {
        Row: {
          code: string
          created_at: string
          credits_required: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          credits_required?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          credits_required?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      verification_references: {
        Row: {
          code_hash: string
          created_at: string
          enrollment_id: string
          id: string
          is_active: boolean
          reference_code: string
          revoked_at: string | null
          revoked_by: string | null
          updated_at: string
          verification_url: string
          verified_count: number
        }
        Insert: {
          code_hash: string
          created_at?: string
          enrollment_id: string
          id?: string
          is_active?: boolean
          reference_code: string
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string
          verification_url: string
          verified_count?: number
        }
        Update: {
          code_hash?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          is_active?: boolean
          reference_code?: string
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string
          verification_url?: string
          verified_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
