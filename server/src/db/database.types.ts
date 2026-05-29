export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
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
        Relationships: [
          {
            foreignKeyName: 'certificates_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certificates_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: 'courses_track_id_fkey'
            columns: ['track_id']
            isOneToOne: false
            referencedRelation: 'tracks'
            referencedColumns: ['id']
          },
        ]
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
          course_id?: string
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
        Relationships: [
          {
            foreignKeyName: 'enrollments_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'enrollments_track_id_fkey'
            columns: ['track_id']
            isOneToOne: false
            referencedRelation: 'tracks'
            referencedColumns: ['id']
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: 'manual_overrides_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'manual_overrides_rule_id_fkey'
            columns: ['rule_id']
            isOneToOne: false
            referencedRelation: 'prerequisite_rules'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'manual_overrides_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: 'prerequisite_rules_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'prerequisite_rules_parent_rule_id_fkey'
            columns: ['parent_rule_id']
            isOneToOne: false
            referencedRelation: 'prerequisite_rules'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'prerequisite_rules_target_course_id_fkey'
            columns: ['target_course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: 'prerequisite_sources_rule_id_fkey'
            columns: ['rule_id']
            isOneToOne: false
            referencedRelation: 'prerequisite_rules'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'prerequisite_sources_source_course_id_fkey'
            columns: ['source_course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          dni: string | null
          email: string
          guarani_id: string | null
          id: string
          is_active: boolean
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
          name?: string
          role?: string
          updated_at?: string
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
      ? R
      : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables']
    & DefaultSchema['Views'])
    ? (DefaultSchema['Tables']
      & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
        ? R
        : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I
  }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U
  }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema['Enums']
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema['CompositeTypes']
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
